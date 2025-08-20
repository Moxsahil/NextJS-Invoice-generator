import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

// Verify Razorpay webhook signature
function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  
  return expectedSignature === signature;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");
    
    if (!signature) {
      return NextResponse.json({ error: "No signature provided" }, { status: 400 });
    }

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
    const isValidSignature = verifyWebhookSignature(body, signature, webhookSecret);
    
    if (!isValidSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    const eventType = event.event;
    const payload = event.payload;

    switch (eventType) {
      case "payment.captured":
        await handlePaymentCaptured(payload);
        break;
        
      case "payment.failed":
        await handlePaymentFailed(payload);
        break;
        
      case "subscription.activated":
        await handleSubscriptionActivated(payload);
        break;
        
      case "subscription.cancelled":
        await handleSubscriptionCancelled(payload);
        break;
        
      case "subscription.completed":
        await handleSubscriptionCompleted(payload);
        break;
        
      case "subscription.charged":
        await handleSubscriptionCharged(payload);
        break;
        
      case "subscription.updated":
        await handleSubscriptionUpdated(payload);
        break;
        
      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }

    return NextResponse.json({ status: "success" });
    
  } catch (error) {
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(payload: any) {
  const payment = payload.payment.entity;
  const orderId = payment.order_id;
  const paymentId = payment.id;
  const amount = payment.amount / 100; // Convert from paise to rupees

  // Find transaction by order ID
  const transaction = await prisma.transaction.findFirst({
    where: { reference: orderId }
  });

  if (transaction && transaction.status !== "SUCCESS") {
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: "SUCCESS",
        processedAt: new Date(),
        metadata: {
          ...transaction.metadata as any,
          webhook_payment_id: paymentId,
          webhook_captured_at: new Date().toISOString(),
        }
      }
    });
  }
}

async function handlePaymentFailed(payload: any) {
  const payment = payload.payment.entity;
  const orderId = payment.order_id;
  const paymentId = payment.id;
  const errorReason = payment.error_reason || "Payment failed";

  // Find transaction by order ID
  const transaction = await prisma.transaction.findFirst({
    where: { reference: orderId }
  });

  if (transaction && transaction.status !== "FAILED") {
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: "FAILED",
        processedAt: new Date(),
        failureReason: errorReason,
        metadata: {
          ...transaction.metadata as any,
          webhook_payment_id: paymentId,
          webhook_failed_at: new Date().toISOString(),
        }
      }
    });
  }
}

async function handleSubscriptionActivated(payload: any) {
  const subscription = payload.subscription.entity;
  const subscriptionId = subscription.id;
  const customerId = subscription.customer_id;

  // Find subscription in our database
  const dbSubscription = await prisma.subscription.findFirst({
    where: {
      metadata: {
        path: ["razorpay_subscription_id"],
        equals: subscriptionId
      }
    }
  });

  if (dbSubscription) {
    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        status: "ACTIVE",
        metadata: {
          ...dbSubscription.metadata as any,
          razorpay_status: subscription.status,
          webhook_activated_at: new Date().toISOString(),
        }
      }
    });
  }
}

async function handleSubscriptionCancelled(payload: any) {
  const subscription = payload.subscription.entity;
  const subscriptionId = subscription.id;

  // Find subscription in our database
  const dbSubscription = await prisma.subscription.findFirst({
    where: {
      metadata: {
        path: ["razorpay_subscription_id"],
        equals: subscriptionId
      }
    }
  });

  if (dbSubscription) {
    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        status: "CANCELED",
        canceledAt: new Date(),
        metadata: {
          ...dbSubscription.metadata as any,
          razorpay_status: subscription.status,
          webhook_cancelled_at: new Date().toISOString(),
        }
      }
    });

    // Update user status to free plan
    const freePlan = await prisma.plan.findFirst({
      where: { price: 0, isActive: true }
    });

    if (freePlan && dbSubscription.userId) {
      await prisma.user.update({
        where: { id: dbSubscription.userId },
        data: {
          subscriptionStatus: "ACTIVE",
          planId: freePlan.id,
          subscriptionEndDate: null,
          nextBillingDate: null,
        }
      });
    }
  }
}

async function handleSubscriptionCompleted(payload: any) {
  const subscription = payload.subscription.entity;
  const subscriptionId = subscription.id;

  // Find subscription in our database
  const dbSubscription = await prisma.subscription.findFirst({
    where: {
      metadata: {
        path: ["razorpay_subscription_id"],
        equals: subscriptionId
      }
    }
  });

  if (dbSubscription) {
    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        status: "CANCELED", // Subscription completed means it ended
        metadata: {
          ...dbSubscription.metadata as any,
          razorpay_status: subscription.status,
          webhook_completed_at: new Date().toISOString(),
        }
      }
    });
  }
}

async function handleSubscriptionCharged(payload: any) {
  const payment = payload.payment.entity;
  const subscriptionId = payment.subscription_id;
  const amount = payment.amount / 100; // Convert from paise to rupees

  // Find subscription in our database
  const dbSubscription = await prisma.subscription.findFirst({
    where: {
      metadata: {
        path: ["razorpay_subscription_id"],
        equals: subscriptionId
      }
    },
    include: { plan: true }
  });

  if (dbSubscription && dbSubscription.userId) {
    // Create billing history record for recurring payment
    await prisma.billingHistory.create({
      data: {
        userId: dbSubscription.userId,
        subscriptionId: dbSubscription.id,
        amount: amount,
        currency: "INR",
        status: "PAID",
        planName: dbSubscription.plan.name,
        billingReason: "subscription_renewal",
        description: `Recurring payment for ${dbSubscription.plan.name} plan`,
        periodStart: dbSubscription.currentPeriodStart,
        periodEnd: dbSubscription.currentPeriodEnd,
        paidAt: new Date(),
        invoiceNumber: `REC-${Date.now()}-${dbSubscription.userId.slice(-4)}`,
        paymentMethod: "Razorpay",
        metadata: {
          razorpay_payment_id: payment.id,
          razorpay_subscription_id: subscriptionId,
          webhook_charged_at: new Date().toISOString(),
        },
      },
    });

    // Update next billing date
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1); // Assuming monthly billing

    await prisma.user.update({
      where: { id: dbSubscription.userId },
      data: {
        nextBillingDate: nextBillingDate,
        invoiceUsage: 0, // Reset usage for new billing period
      }
    });
  }
}

async function handleSubscriptionUpdated(payload: any) {
  const subscription = payload.subscription.entity;
  const subscriptionId = subscription.id;

  // Find subscription in our database
  const dbSubscription = await prisma.subscription.findFirst({
    where: {
      metadata: {
        path: ["razorpay_subscription_id"],
        equals: subscriptionId
      }
    }
  });

  if (dbSubscription) {
    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        metadata: {
          ...dbSubscription.metadata as any,
          razorpay_status: subscription.status,
          webhook_updated_at: new Date().toISOString(),
        }
      }
    });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { z } from "zod";

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  transactionId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      transactionId 
    } = verifyPaymentSchema.parse(body);

    // Verify payment signature
    const isValidSignature = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Get transaction details
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: userId,
        reference: razorpay_order_id,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    if (transaction.status === "SUCCESS") {
      return NextResponse.json(
        { error: "Transaction already processed" },
        { status: 400 }
      );
    }

    const metadata = transaction.metadata as any;
    const planId = metadata.planId;

    // Get plan details
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update transaction status
      const updatedTransaction = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: "SUCCESS",
          processedAt: new Date(),
          metadata: {
            ...metadata,
            razorpay_payment_id,
            razorpay_signature,
            verifiedAt: new Date().toISOString(),
          },
        },
      });

      // Calculate subscription dates
      const now = new Date();
      const trialEnd = plan.trialPeriodDays 
        ? new Date(now.getTime() + (plan.trialPeriodDays * 24 * 60 * 60 * 1000))
        : null;
      
      const periodStart = now;
      const periodEnd = new Date(
        now.getFullYear() + (plan.interval === 'YEAR' ? plan.intervalCount : 0),
        now.getMonth() + (plan.interval === 'MONTH' ? plan.intervalCount : 0),
        now.getDate()
      );

      // Cancel current subscription if exists
      const currentSubscription = await tx.subscription.findFirst({
        where: {
          userId: userId,
          status: { in: ['ACTIVE', 'TRIAL'] },
        },
      });

      if (currentSubscription) {
        await tx.subscription.update({
          where: { id: currentSubscription.id },
          data: { 
            status: 'CANCELED',
            canceledAt: now 
          }
        });
      }

      // Create new subscription
      const newSubscription = await tx.subscription.create({
        data: {
          userId,
          planId,
          status: plan.trialPeriodDays && plan.trialPeriodDays > 0 ? 'TRIAL' : 'ACTIVE',
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          trialStart: plan.trialPeriodDays ? now : null,
          trialEnd: trialEnd,
          metadata: {
            razorpay_payment_id,
            razorpay_order_id,
            initial_payment_amount: plan.price,
          },
        },
        include: {
          plan: true,
        },
      });

      // Update user subscription details
      await tx.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: newSubscription.status as any,
          planId: plan.id,
          subscriptionStartDate: periodStart,
          subscriptionEndDate: periodEnd,
          nextBillingDate: plan.trialPeriodDays ? trialEnd : periodEnd,
          trialEndsAt: trialEnd,
          invoiceUsage: 0, // Reset usage for new billing period
        },
      });

      // Create billing history record
      await tx.billingHistory.create({
        data: {
          userId,
          subscriptionId: newSubscription.id,
          transactionId: updatedTransaction.id,
          amount: plan.price,
          currency: plan.currency,
          status: 'PAID',
          planName: plan.name,
          billingReason: 'subscription_payment',
          description: `Payment for ${plan.name} plan subscription`,
          periodStart,
          periodEnd,
          paidAt: now,
          invoiceNumber: `PAY-${Date.now()}-${userId.slice(-4)}`,
          paymentMethod: 'Razorpay',
          metadata: {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
          },
        },
      });

      return { subscription: newSubscription, transaction: updatedTransaction };
    });

    return NextResponse.json({
      success: true,
      message: `Successfully subscribed to ${plan.name} plan!`,
      subscription: result.subscription,
      transaction: result.transaction,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    // Mark transaction as failed
    try {
      const body = await request.json();
      const { transactionId } = body;
      
      if (transactionId) {
        await prisma.transaction.update({
          where: { id: transactionId },
          data: {
            status: "FAILED",
            processedAt: new Date(),
            failureReason: "Payment verification failed",
          },
        });
      }
    } catch (updateError) {
      // Ignore update errors
    }

    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
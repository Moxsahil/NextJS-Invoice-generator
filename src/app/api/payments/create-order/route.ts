import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createRazorpayOrder, createOrGetRazorpayCustomer } from "@/lib/razorpay";
import { z } from "zod";

const createOrderSchema = z.object({
  planId: z.string().min(1, "Plan ID is required"),
  paymentType: z.enum(["subscription", "upgrade"]),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { planId, paymentType } = createOrderSchema.parse(body);

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        planId: true,
        subscriptionStatus: true,
        razorpayCustomerId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get plan details
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (plan.price === 0) {
      return NextResponse.json({ error: "No payment required for free plan" }, { status: 400 });
    }

    // Create or get Razorpay customer
    let razorpayCustomer;
    if (user.razorpayCustomerId) {
      // Use existing customer ID
      razorpayCustomer = { id: user.razorpayCustomerId };
    } else {
      // Create new customer
      razorpayCustomer = await createOrGetRazorpayCustomer({
        email: user.email,
        name: user.name,
        phone: user.phone || undefined,
      });
      
      // Store the customer ID in database
      await prisma.user.update({
        where: { id: user.id },
        data: { razorpayCustomerId: razorpayCustomer.id },
      });
    }

    // Create Razorpay order
    const razorpayOrder = await createRazorpayOrder({
      amount: plan.price,
      currency: plan.currency,
      receipt: `ord_${Date.now().toString().slice(-10)}`,
      notes: {
        userId: user.id,
        planId: plan.id,
        planName: plan.name,
        paymentType: paymentType,
      },
    });

    // Store order in database
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: paymentType === "subscription" ? "SUBSCRIPTION_PAYMENT" : "SUBSCRIPTION_PAYMENT",
        amount: plan.price,
        currency: plan.currency,
        status: "PENDING",
        reference: razorpayOrder.id,
        description: `Payment for ${plan.name} plan`,
        metadata: {
          razorpayOrderId: razorpayOrder.id,
          razorpayCustomerId: razorpayCustomer.id,
          planId: plan.id,
          planName: plan.name,
          paymentType: paymentType,
        },
      },
    });

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: plan.price,
      currency: plan.currency,
      customerDetails: {
        name: user.name,
        email: user.email,
        contact: user.phone || "",
      },
      planDetails: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        currency: plan.currency,
        interval: plan.interval,
        features: plan.features,
      },
      transactionId: transaction.id,
      key: process.env.RAZORPAY_KEY_ID,
    });

  } catch (error) {
    console.error("Create order error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create payment order", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
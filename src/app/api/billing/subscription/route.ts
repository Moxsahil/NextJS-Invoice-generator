import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { z } from "zod";

const subscriptionSchema = z.object({
  planId: z.string().min(1, "Plan ID is required"),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          include: {
            plan: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentSubscription = user.subscriptions[0] || null;
    
    return NextResponse.json({
      subscription: currentSubscription,
      userStatus: {
        subscriptionStatus: user.subscriptionStatus,
        planId: user.planId,
        trialEndsAt: user.trialEndsAt,
        nextBillingDate: user.nextBillingDate,
        invoiceUsage: user.invoiceUsage,
        walletBalance: user.walletBalance
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { planId } = subscriptionSchema.parse(body);

    // Get the plan details
    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Get current user subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: { in: ['ACTIVE', 'TRIAL'] } },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentSubscription = user.subscriptions[0];

    // Calculate dates
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

    // Determine subscription status
    let subscriptionStatus = 'ACTIVE';
    if (plan.price === 0) {
      subscriptionStatus = 'ACTIVE'; // Free plan
    } else if (plan.trialPeriodDays && plan.trialPeriodDays > 0) {
      subscriptionStatus = 'TRIAL'; // Paid plan with trial
    }

    const result = await prisma.$transaction(async (tx) => {
      // Cancel current subscription if exists
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
          status: subscriptionStatus as any,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          trialStart: subscriptionStatus === 'TRIAL' ? now : null,
          trialEnd: subscriptionStatus === 'TRIAL' ? trialEnd : null,
        },
        include: {
          plan: true
        }
      });

      // Update user subscription details
      await tx.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: subscriptionStatus as any,
          planId: plan.id,
          subscriptionStartDate: periodStart,
          subscriptionEndDate: periodEnd,
          nextBillingDate: subscriptionStatus === 'TRIAL' ? trialEnd : periodEnd,
          trialEndsAt: subscriptionStatus === 'TRIAL' ? trialEnd : null,
          invoiceUsage: 0 // Reset usage for new billing period
        }
      });

      // Create billing history record
      if (plan.price > 0) {
        await tx.billingHistory.create({
          data: {
            userId,
            subscriptionId: newSubscription.id,
            amount: plan.price,
            currency: plan.currency,
            status: subscriptionStatus === 'TRIAL' ? 'PENDING' : 'PAID',
            planName: plan.name,
            billingReason: 'subscription_change',
            description: `Subscription to ${plan.name} plan`,
            periodStart,
            periodEnd,
            dueDate: subscriptionStatus === 'TRIAL' ? trialEnd : now,
            invoiceNumber: `SUB-${Date.now()}-${userId.slice(-4)}`,
          }
        });
      }

      return newSubscription;
    });

    return NextResponse.json({
      subscription: result,
      message: `Successfully ${currentSubscription ? 'changed to' : 'subscribed to'} ${plan.name} plan`
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to manage subscription" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'TRIAL'] }
      },
      include: {
        plan: true
      }
    });

    if (!currentSubscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // Update subscription to canceled
      const updatedSubscription = await tx.subscription.update({
        where: { id: currentSubscription.id },
        data: {
          status: 'CANCELED',
          canceledAt: now,
          autoRenew: false
        }
      });

      // Update user status to free plan
      const freePlan = await tx.plan.findFirst({
        where: { price: 0, isActive: true }
      });

      if (freePlan) {
        await tx.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: 'ACTIVE',
            planId: freePlan.id,
            subscriptionEndDate: null,
            nextBillingDate: null,
            trialEndsAt: null
          }
        });
      }

      // Create billing history for cancellation
      await tx.billingHistory.create({
        data: {
          userId,
          subscriptionId: currentSubscription.id,
          amount: 0,
          currency: currentSubscription.plan.currency,
          status: 'CANCELED',
          planName: currentSubscription.plan.name,
          billingReason: 'subscription_canceled',
          description: `Canceled subscription to ${currentSubscription.plan.name} plan`,
          periodStart: currentSubscription.currentPeriodStart,
          periodEnd: currentSubscription.currentPeriodEnd,
          paidAt: now,
          invoiceNumber: `CANCEL-${Date.now()}-${userId.slice(-4)}`,
        }
      });

      return updatedSubscription;
    });

    return NextResponse.json({
      message: "Subscription canceled successfully",
      subscription: result
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
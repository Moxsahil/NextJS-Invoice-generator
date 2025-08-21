import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the free plan
    const freePlan = await prisma.plan.findFirst({
      where: { 
        price: 0, 
        isActive: true 
      },
      orderBy: { sortOrder: 'asc' }
    });

    if (!freePlan) {
      return NextResponse.json(
        { error: "No free plan found" },
        { status: 404 }
      );
    }

    // Update user with free plan if they don't have billing info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        planId: true,
        subscriptionStatus: true 
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If user doesn't have a plan, assign free plan
    if (!user.planId) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          planId: freePlan.id,
          subscriptionStatus: 'ACTIVE',
          subscriptionStartDate: new Date(),
          trialEndsAt: null,
          nextBillingDate: null,
          invoiceUsage: 0
        }
      });

      return NextResponse.json({
        message: "Billing initialized with free plan",
        planId: freePlan.id
      });
    }

    return NextResponse.json({
      message: "Billing already initialized",
      planId: user.planId
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to initialize billing" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ plans });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch plans" },
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

    // Check if user is admin (you can implement admin check based on your requirements)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    // For demo purposes, let's allow plan creation
    // In production, you'd want proper admin authentication
    
    const body = await request.json();
    const {
      name,
      description,
      price,
      currency = "INR",
      interval,
      intervalCount = 1,
      trialPeriodDays = 7,
      features,
      limits,
      isPopular = false,
      color = "blue"
    } = body;

    const plan = await prisma.plan.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        currency,
        interval,
        intervalCount,
        trialPeriodDays,
        features,
        limits,
        isPopular,
        color,
        sortOrder: await prisma.plan.count() + 1
      }
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create plan" },
      { status: 500 }
    );
  }
}
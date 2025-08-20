import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // First, check if plans already exist
    const existingPlans = await prisma.plan.findMany();
    
    if (existingPlans.length > 0) {
      return NextResponse.json({
        message: "Plans already exist",
        count: existingPlans.length,
      });
    }

    // Create default plans
    const plans = await prisma.plan.createMany({
      data: [
        {
          id: "free",
          name: "Free",
          description: "Perfect for individuals getting started",
          price: 0,
          currency: "INR",
          interval: "MONTH",
          intervalCount: 1,
          trialPeriodDays: 0,
          features: [
            "Up to 5 invoices per month",
            "Basic invoice templates",
            "Email notifications",
            "Customer management",
            "Basic reporting"
          ],
          limits: {
            invoicesPerMonth: 5,
            customers: 10,
            storage: "100MB"
          },
          isActive: true,
          isPopular: false,
          sortOrder: 0,
          color: "gray"
        },
        {
          id: "basic",
          name: "Basic",
          description: "For small businesses",
          price: 299,
          currency: "INR",
          interval: "MONTH",
          intervalCount: 1,
          trialPeriodDays: 7,
          features: [
            "Up to 50 invoices per month",
            "Professional templates",
            "Email & SMS notifications",
            "Customer management",
            "Advanced reporting",
            "Tax calculations",
            "Payment tracking"
          ],
          limits: {
            invoicesPerMonth: 50,
            customers: 100,
            storage: "1GB"
          },
          isActive: true,
          isPopular: true,
          sortOrder: 1,
          color: "blue"
        },
        {
          id: "pro",
          name: "Pro",
          description: "For growing businesses",
          price: 599,
          currency: "INR",
          interval: "MONTH",
          intervalCount: 1,
          trialPeriodDays: 7,
          features: [
            "Up to 200 invoices per month",
            "All template designs",
            "Priority support",
            "Advanced analytics",
            "Multi-currency support",
            "Recurring invoices",
            "Payment gateway integration",
            "Inventory management"
          ],
          limits: {
            invoicesPerMonth: 200,
            customers: 500,
            storage: "5GB"
          },
          isActive: true,
          isPopular: false,
          sortOrder: 2,
          color: "purple"
        },
        {
          id: "enterprise",
          name: "Enterprise",
          description: "For large organizations",
          price: 1499,
          currency: "INR",
          interval: "MONTH",
          intervalCount: 1,
          trialPeriodDays: 14,
          features: [
            "Unlimited invoices",
            "Custom branding",
            "24/7 priority support",
            "Advanced integrations",
            "Multi-user access",
            "API access",
            "Custom reporting",
            "White-label solution"
          ],
          limits: {
            invoicesPerMonth: -1, // Unlimited
            customers: -1, // Unlimited
            storage: "50GB"
          },
          isActive: true,
          isPopular: false,
          sortOrder: 3,
          color: "gold"
        }
      ],
    });

    return NextResponse.json({
      message: "Plans seeded successfully",
      count: plans.count,
    });
  } catch (error) {
    console.error("Seed plans error:", error);
    return NextResponse.json(
      { error: "Failed to seed plans" },
      { status: 500 }
    );
  }
}
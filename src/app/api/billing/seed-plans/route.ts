import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const defaultPlans = [
  {
    name: "Free",
    description: "Perfect for getting started with basic invoice management",
    price: 0,
    currency: "INR",
    interval: "MONTH",
    intervalCount: 1,
    trialPeriodDays: 0,
    features: [
      "Up to 5 invoices per month",
      "1 user account", 
      "Basic templates",
      "Email support",
      "PDF export",
      "Basic customer management"
    ],
    limits: {
      maxInvoicesPerMonth: 5,
      maxUsers: 1,
      maxCustomers: 25,
      emailSupport: true,
      prioritySupport: false,
      apiAccess: false,
      customBranding: false,
      advancedReports: false
    },
    isActive: true,
    isPopular: false,
    sortOrder: 1,
    color: "gray"
  },
  {
    name: "Basic",
    description: "Ideal for small businesses and freelancers",
    price: 299,
    currency: "INR", 
    interval: "MONTH",
    intervalCount: 1,
    trialPeriodDays: 7,
    features: [
      "Up to 50 invoices per month",
      "3 user accounts",
      "Custom templates", 
      "Priority email support",
      "Payment tracking",
      "Basic analytics",
      "Customer portal"
    ],
    limits: {
      maxInvoicesPerMonth: 50,
      maxUsers: 3,
      maxCustomers: 100,
      emailSupport: true,
      prioritySupport: true,
      apiAccess: false,
      customBranding: false,
      advancedReports: false
    },
    isActive: true,
    isPopular: false,
    sortOrder: 2,
    color: "blue"
  },
  {
    name: "Pro", 
    description: "Perfect for growing businesses with advanced needs",
    price: 599,
    currency: "INR",
    interval: "MONTH",
    intervalCount: 1,
    trialPeriodDays: 14,
    features: [
      "Unlimited invoices",
      "10 user accounts",
      "Advanced templates",
      "Live chat support",
      "Payment processing",
      "Advanced analytics", 
      "API access",
      "White-label options",
      "Automated reminders",
      "Multi-currency support"
    ],
    limits: {
      maxInvoicesPerMonth: -1, // Unlimited
      maxUsers: 10,
      maxCustomers: -1, // Unlimited
      emailSupport: true,
      prioritySupport: true,
      apiAccess: true,
      customBranding: true,
      advancedReports: true
    },
    isActive: true,
    isPopular: true,
    sortOrder: 3,
    color: "purple"
  },
  {
    name: "Enterprise",
    description: "For large organizations with custom requirements",
    price: 1499,
    currency: "INR",
    interval: "MONTH",
    intervalCount: 1,
    trialPeriodDays: 30,
    features: [
      "Everything in Pro",
      "Unlimited users",
      "Custom integrations",
      "Dedicated support manager",
      "99.9% SLA guarantee",
      "Custom branding",
      "Multi-company support",
      "Advanced security",
      "Custom workflows",
      "Priority feature requests"
    ],
    limits: {
      maxInvoicesPerMonth: -1, // Unlimited
      maxUsers: -1, // Unlimited
      maxCustomers: -1, // Unlimited
      emailSupport: true,
      prioritySupport: true,
      apiAccess: true,
      customBranding: true,
      advancedReports: true,
      dedicatedSupport: true,
      customIntegrations: true
    },
    isActive: true,
    isPopular: false,
    sortOrder: 4,
    color: "green"
  }
];

export async function POST(request: NextRequest) {
  try {
    for (const planData of defaultPlans) {
      const existingPlan = await prisma.plan.findFirst({
        where: { name: planData.name }
      });

      if (!existingPlan) {
        await prisma.plan.create({
          data: planData
        });
      }
    }

    return NextResponse.json({
      message: "Default plans created successfully"
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create default plans" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Use POST to seed default plans"
  });
}
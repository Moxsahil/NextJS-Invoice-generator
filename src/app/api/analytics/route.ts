import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const dateRange = url.searchParams.get("dateRange") || "6months";

    // Calculate date ranges
    const now = new Date();
    const startDate = getStartDate(dateRange);
    const previousStartDate = getPreviousStartDate(dateRange, startDate);

    // Get current period data
    const [
      currentInvoices,
      previousInvoices,
      monthlyData,
      topCustomersData,
      invoiceStatusData,
    ] = await Promise.all([
      // Current period invoices
      prisma.invoice.findMany({
        where: {
          userId,
          createdAt: {
            gte: startDate,
            lte: now,
          },
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
            },
          },
        },
      }),

      // Previous period invoices for comparison
      prisma.invoice.findMany({
        where: {
          userId,
          createdAt: {
            gte: previousStartDate,
            lt: startDate,
          },
        },
      }),

      // Monthly revenue data for chart
      getMonthlyRevenueData(userId, dateRange),

      // Top customers data
      getTopCustomersData(userId, startDate, now),

      // Invoice status distribution
      getInvoiceStatusData(userId, startDate, now),
    ]);

    // Calculate current period metrics
    const currentMetrics = calculateMetrics(currentInvoices);
    const previousMetrics = calculateMetrics(previousInvoices);

    // Calculate growth rates
    const revenueGrowth = calculateGrowthRate(
      currentMetrics.totalRevenue,
      previousMetrics.totalRevenue
    );
    const invoiceGrowth = calculateGrowthRate(
      currentMetrics.totalInvoices,
      previousMetrics.totalInvoices
    );
    const avgInvoiceGrowth = calculateGrowthRate(
      currentMetrics.averageInvoice,
      previousMetrics.averageInvoice
    );
    const collectionRateChange = calculateGrowthRate(
      currentMetrics.collectionRate,
      previousMetrics.collectionRate
    );

    // Prepare response
    const analyticsData = {
      // Key metrics
      totalRevenue: currentMetrics.totalRevenue,
      totalInvoices: currentMetrics.totalInvoices,
      averageInvoice: currentMetrics.averageInvoice,
      collectionRate: currentMetrics.collectionRate,

      // Growth rates
      revenueGrowth,
      invoiceGrowth,
      avgInvoiceGrowth,
      collectionRateChange,

      // Chart data
      monthlyRevenue: monthlyData,
      invoiceStatus: invoiceStatusData,
      topCustomers: topCustomersData,

      // Additional metrics
      paidAmount: currentMetrics.paidAmount,
      pendingAmount: currentMetrics.pendingAmount,
      overdueAmount: currentMetrics.overdueAmount,

      // Date range info
      dateRange,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
    };

    return NextResponse.json({ analytics: analyticsData });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}

// Helper functions
function getStartDate(dateRange: string): Date {
  const now = new Date();
  switch (dateRange) {
    case "1month":
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case "3months":
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case "6months":
    default:
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
  }
}

function getPreviousStartDate(dateRange: string, currentStart: Date): Date {
  const monthsBack =
    dateRange === "1month" ? 1 : dateRange === "3months" ? 3 : 6;
  return new Date(
    currentStart.getFullYear(),
    currentStart.getMonth() - monthsBack,
    currentStart.getDate()
  );
}

function calculateMetrics(invoices: any[]) {
  const totalInvoices = invoices.length;
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const averageInvoice = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

  const paidInvoices = invoices.filter((inv) => inv.status === "PAID");
  const paidAmount = paidInvoices.reduce(
    (sum, inv) => sum + inv.totalAmount,
    0
  );

  const pendingInvoices = invoices.filter((inv) => inv.status === "SENT" || inv.status === "PENDING");
  const pendingAmount = pendingInvoices.reduce(
    (sum, inv) => sum + inv.totalAmount,
    0
  );

  const overdueInvoices = invoices.filter((inv) => inv.status === "OVERDUE");
  const overdueAmount = overdueInvoices.reduce(
    (sum, inv) => sum + inv.totalAmount,
    0
  );

  const collectionRate =
    totalRevenue > 0 ? (paidAmount / totalRevenue) * 100 : 0;

  return {
    totalInvoices,
    totalRevenue,
    averageInvoice,
    collectionRate,
    paidAmount,
    pendingAmount,
    overdueAmount,
  };
}

function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

async function getMonthlyRevenueData(userId: string, dateRange: string) {
  const startDate = getStartDate(dateRange);
  const now = new Date();

  // Get all invoices in the date range
  const invoices = await prisma.invoice.findMany({
    where: {
      userId,
      createdAt: {
        gte: startDate,
        lte: now,
      },
    },
    select: {
      totalAmount: true,
      createdAt: true,
      status: true,
    },
  });

  // Group by month
  const monthlyData: { [key: string]: { revenue: number; invoices: number } } =
    {};

  invoices.forEach((invoice) => {
    const month = invoice.createdAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });

    if (!monthlyData[month]) {
      monthlyData[month] = { revenue: 0, invoices: 0 };
    }

    monthlyData[month].revenue += invoice.totalAmount;
    monthlyData[month].invoices += 1;
  });

  // Convert to array and sort by date
  return Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      revenue: data.revenue,
      invoices: data.invoices,
    }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
}

async function getTopCustomersData(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  const customerData = await prisma.customer.findMany({
    where: {
      userId,
      invoices: {
        some: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    },
    include: {
      invoices: {
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          totalAmount: true,
          status: true,
        },
      },
    },
  });

  return customerData
    .map((customer) => {
      const totalAmount = customer.invoices.reduce(
        (sum, inv) => sum + inv.totalAmount,
        0
      );
      const invoiceCount = customer.invoices.length;

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        status: customer.status,
        amount: totalAmount,
        invoices: invoiceCount,
      };
    })
    .filter((customer) => customer.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10); // Top 10 customers
}

async function getInvoiceStatusData(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  const invoices = await prisma.invoice.findMany({
    where: {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      status: true,
    },
  });

  // Count invoices by status
  const statusCounts: { [key: string]: number } = {};
  invoices.forEach((invoice) => {
    statusCounts[invoice.status] = (statusCounts[invoice.status] || 0) + 1;
  });

  // Convert to array format for chart
  return Object.entries(statusCounts).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
    value: count,
  }));
}

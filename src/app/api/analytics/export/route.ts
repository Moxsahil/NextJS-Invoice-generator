// /api/analytics/export/route.ts - Analytics export API
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dateRange, format = "json" } = await request.json();

    // Calculate date ranges
    const now = new Date();
    const startDate = getStartDate(dateRange);

    // Get comprehensive data for export
    const [invoices, customers] = await Promise.all([
      // All invoices in date range
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
              phone: true,
              address: true,
              city: true,
              state: true,
              status: true,
            },
          },
          items: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      // Customer data with invoice aggregations
      prisma.customer.findMany({
        where: {
          userId,
          invoices: {
            some: {
              createdAt: {
                gte: startDate,
                lte: now,
              },
            },
          },
        },
        include: {
          invoices: {
            where: {
              createdAt: {
                gte: startDate,
                lte: now,
              },
            },
            select: {
              id: true,
              invoiceNumber: true,
              totalAmount: true,
              status: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    // Calculate summary metrics
    const totalRevenue = invoices.reduce(
      (sum, inv) => sum + inv.totalAmount,
      0
    );
    const totalInvoices = invoices.length;
    const averageInvoice = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

    const paidInvoices = invoices.filter((inv) => inv.status === "PAID");
    const paidAmount = paidInvoices.reduce(
      (sum, inv) => sum + inv.totalAmount,
      0
    );
    const collectionRate =
      totalRevenue > 0 ? (paidAmount / totalRevenue) * 100 : 0;

    // Status breakdown
    const statusBreakdown = invoices.reduce((acc, invoice) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Monthly breakdown
    const monthlyBreakdown = invoices.reduce((acc, invoice) => {
      const month = invoice.createdAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });

      if (!acc[month]) {
        acc[month] = { revenue: 0, invoices: 0 };
      }

      acc[month].revenue += invoice.totalAmount;
      acc[month].invoices += 1;

      return acc;
    }, {} as Record<string, { revenue: number; invoices: number }>);

    // Customer analytics
    const customerAnalytics = customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      status: customer.status,
      totalInvoices: customer.invoices.length,
      totalRevenue: customer.invoices.reduce(
        (sum, inv) => sum + inv.totalAmount,
        0
      ),
      averageInvoiceValue:
        customer.invoices.length > 0
          ? customer.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0) /
            customer.invoices.length
          : 0,
      lastInvoiceDate:
        customer.invoices.length > 0
          ? customer.invoices.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )[0].createdAt
          : null,
    }));

    // Prepare comprehensive export data
    const exportData = {
      metadata: {
        exportDate: now.toISOString(),
        dateRange,
        periodStart: startDate.toISOString(),
        periodEnd: now.toISOString(),
        totalRecords: {
          invoices: totalInvoices,
          customers: customers.length,
        },
      },

      summary: {
        totalRevenue,
        totalInvoices,
        averageInvoice,
        collectionRate,
        paidAmount,
        pendingAmount: invoices
          .filter((inv) => inv.status === "SENT")
          .reduce((sum, inv) => sum + inv.totalAmount, 0),
        overdueAmount: invoices
          .filter((inv) => inv.status === "OVERDUE")
          .reduce((sum, inv) => sum + inv.totalAmount, 0),
        draftAmount: invoices
          .filter((inv) => inv.status === "DRAFT")
          .reduce((sum, inv) => sum + inv.totalAmount, 0),
      },

      breakdown: {
        byStatus: statusBreakdown,
        byMonth: monthlyBreakdown,
      },

      detailedData: {
        invoices: invoices.map((invoice) => ({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          customerName: invoice.customer?.name || invoice.customerName,
          customerEmail: invoice.customer?.email || "",
          customerPhone: invoice.customer?.phone || "",
          customerAddress: invoice.customer?.address || invoice.customerAddress,
          invoiceDate: invoice.invoiceDate.toISOString(),
          dueDate: invoice.dueDate.toISOString(),
          subtotal: invoice.subtotal,
          sgstAmount: invoice.sgstAmount,
          cgstAmount: invoice.cgstAmount,
          totalAmount: invoice.totalAmount,
          status: invoice.status,
          createdAt: invoice.createdAt.toISOString(),
          items: invoice.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount,
          })),
        })),

        customers: customerAnalytics,
      },

      insights: {
        topCustomers: customerAnalytics
          .filter((c) => c.totalRevenue > 0)
          .sort((a, b) => b.totalRevenue - a.totalRevenue)
          .slice(0, 10),

        monthlyTrends: Object.entries(monthlyBreakdown)
          .map(([month, data]) => ({
            month,
            revenue: data.revenue,
            invoices: data.invoices,
            averageInvoiceValue:
              data.invoices > 0 ? data.revenue / data.invoices : 0,
          }))
          .sort(
            (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
          ),
      },
    };

    // Return JSON format
    if (format === "json") {
      return NextResponse.json({
        success: true,
        data: exportData,
      });
    }

    // Generate CSV format
    if (format === "csv") {
      const csvContent = generateDetailedCSV(exportData);

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="analytics_detailed_${dateRange}_${
            now.toISOString().split("T")[0]
          }.csv"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  } catch (error) {
    console.error("Error exporting analytics:", error);
    return NextResponse.json(
      { error: "Failed to export analytics data" },
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

function generateDetailedCSV(data: any): string {
  const lines: string[] = [];

  // Header
  lines.push('"ANALYTICS EXPORT REPORT"');
  lines.push(
    `"Generated At","${new Date(data.metadata.exportDate).toLocaleString()}"`
  );
  lines.push(`"Period","${data.metadata.dateRange}"`);
  lines.push(
    `"Date Range","${new Date(
      data.metadata.periodStart
    ).toLocaleDateString()} - ${new Date(
      data.metadata.periodEnd
    ).toLocaleDateString()}"`
  );
  lines.push("");

  // Summary
  lines.push('"SUMMARY"');
  lines.push('"Metric","Value"');
  lines.push(
    `"Total Revenue","₹${data.summary.totalRevenue.toLocaleString()}"`
  );
  lines.push(`"Total Invoices","${data.summary.totalInvoices}"`);
  lines.push(
    `"Average Invoice","₹${Math.round(
      data.summary.averageInvoice
    ).toLocaleString()}"`
  );
  lines.push(`"Collection Rate","${data.summary.collectionRate.toFixed(1)}%"`);
  lines.push(`"Paid Amount","₹${data.summary.paidAmount.toLocaleString()}"`);
  lines.push(
    `"Pending Amount","₹${data.summary.pendingAmount.toLocaleString()}"`
  );
  lines.push(
    `"Overdue Amount","₹${data.summary.overdueAmount.toLocaleString()}"`
  );
  lines.push("");

  // Invoice Details
  lines.push('"INVOICE DETAILS"');
  lines.push(
    '"Invoice Number","Customer Name","Customer Email","Invoice Date","Due Date","Subtotal","SGST","CGST","Total Amount","Status","Created At"'
  );
  data.detailedData.invoices.forEach((invoice: any) => {
    lines.push(
      `"${invoice.invoiceNumber}","${invoice.customerName}","${
        invoice.customerEmail
      }","${new Date(invoice.invoiceDate).toLocaleDateString()}","${new Date(
        invoice.dueDate
      ).toLocaleDateString()}","₹${invoice.subtotal.toLocaleString()}","₹${invoice.sgstAmount.toLocaleString()}","₹${invoice.cgstAmount.toLocaleString()}","₹${invoice.totalAmount.toLocaleString()}","${
        invoice.status
      }","${new Date(invoice.createdAt).toLocaleDateString()}"`
    );
  });
  lines.push("");

  // Customer Analytics
  lines.push('"CUSTOMER ANALYTICS"');
  lines.push(
    '"Name","Email","Phone","City","Total Revenue","Total Invoices","Average Invoice","Status","Last Invoice"'
  );
  data.detailedData.customers.forEach((customer: any) => {
    lines.push(
      `"${customer.name}","${customer.email}","${customer.phone || ""}","${
        customer.city || ""
      }","₹${customer.totalRevenue.toLocaleString()}","${
        customer.totalInvoices
      }","₹${Math.round(customer.averageInvoiceValue).toLocaleString()}","${
        customer.status
      }","${
        customer.lastInvoiceDate
          ? new Date(customer.lastInvoiceDate).toLocaleDateString()
          : "N/A"
      }"`
    );
  });

  return lines.join("\n");
}

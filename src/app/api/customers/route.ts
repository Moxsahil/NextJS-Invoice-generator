import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notificationService } from "@/lib/notification-service";

// GET /api/customers - Fetch all customers with real-time invoice data
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user ID
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all customers with their invoices
    const customers = await prisma.customer.findMany({
      where: {
        userId: userId,
      },
      include: {
        invoices: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            createdAt: true,
            invoiceDate: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform customers with accurate invoice calculations
    const transformedCustomers = customers.map((customer) => {
      const invoices = customer.invoices;

      // Calculate accurate statistics
      const totalInvoices = invoices.length;

      // Total revenue from ALL invoices (not just paid ones for now, as per your current setup)
      const totalAmount = invoices.reduce(
        (sum, invoice) => sum + (invoice.totalAmount || 0),
        0
      );

      // Alternative: Only count PAID invoices for revenue
      // const totalAmount = invoices
      //   .filter(inv => inv.status === "PAID")
      //   .reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);

      // Get the most recent invoice date
      const lastInvoice = invoices.length > 0 ? invoices[0].createdAt : null;

      // Calculate additional metrics
      const averageInvoiceValue =
        totalInvoices > 0 ? totalAmount / totalInvoices : 0;

      // Count by status
      const invoicesByStatus = invoices.reduce((acc, invoice) => {
        acc[invoice.status] = (acc[invoice.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        gstin: customer.gstin,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zipCode: customer.zipCode,
        country: customer.country,
        status: customer.status,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
        userId: customer.userId,

        // Real-time calculated fields that will update when invoices are created
        totalInvoices: totalInvoices,
        totalAmount: totalAmount,
        lastInvoice: lastInvoice ? lastInvoice.toISOString() : null,
        averageInvoiceValue: Math.round(averageInvoiceValue),

        // Additional metrics for detailed views
        invoiceStats: {
          paid: invoicesByStatus.PAID || 0,
          pending: invoicesByStatus.SENT || 0,
          overdue: invoicesByStatus.OVERDUE || 0,
          draft: invoicesByStatus.DRAFT || 0,
        },

        // Include recent invoices for context
        recentInvoices: invoices.slice(0, 3).map((inv) => ({
          id: inv.id,
          amount: inv.totalAmount,
          status: inv.status,
          date: inv.invoiceDate.toISOString(),
        })),
      };
    });

    return NextResponse.json(transformedCustomers, { status: 200 });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create customer (unchanged)
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user ID
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: {
        email: data.email,
      },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: "A customer with this email already exists" },
        { status: 400 }
      );
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        phone: data.phone?.trim() || null,
        gstin: data.gstin?.trim() || null,
        address: data.address?.trim() || null,
        city: data.city?.trim() || null,
        state: data.state?.trim() || null,
        zipCode: data.zipCode?.trim() || null,
        country: data.country?.trim() || null,
        status: data.status || "Active",
        userId: userId,
      },
    });

    // Create notification for new customer
    try {
      await notificationService.createCustomerNotification(
        'new',
        userId,
        {
          name: customer.name,
          email: customer.email,
        }
      );
    } catch (error) {
      console.error('Failed to create notification:', error);
    }

    return NextResponse.json(
      {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        gstin: customer.gstin,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zipCode: customer.zipCode,
        country: customer.country,
        status: customer.status,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
        userId: customer.userId,

        // Initialize with zero values for new customers
        totalInvoices: 0,
        totalAmount: 0,
        lastInvoice: null,
        averageInvoiceValue: 0,
        invoiceStats: {
          paid: 0,
          pending: 0,
          overdue: 0,
          draft: 0,
        },
        recentInvoices: [],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating customer:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as any).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A customer with this email already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create customer. Please try again." },
      { status: 500 }
    );
  }
}

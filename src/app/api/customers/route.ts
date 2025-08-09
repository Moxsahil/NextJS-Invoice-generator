import { NextResponse } from "next/server";
import { PrismaClient } from "../../../generated/prisma";

const prisma = new PrismaClient();

// Helper function to get or create a default user
async function getOrCreateDefaultUser() {
  // Try to find any existing user
  let user = await prisma.user.findFirst();

  // If no user exists, create a default one
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: `admin_${Date.now()}@invoicegen.local`,
        name: "System Admin",
        password: "temp_password", // In production, hash this
      },
    });
  }

  return user.id;
}

// GET /api/customers - Fetch all customers
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    // If no specific userId is provided, get the default user
    const targetUserId = userId || (await getOrCreateDefaultUser());

    // First, get all customers
    const customers = await prisma.customer.findMany({
      where: {
        userId: targetUserId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Then, get invoice data for each customer separately
    const transformedCustomers = await Promise.all(
      customers.map(async (customer) => {
        // Get invoices for this customer
        const invoices = await prisma.invoice.findMany({
          where: {
            customerId: customer.id,
          },
          select: {
            id: true,
            subtotal: true,
            cgstAmount: true,
            sgstAmount: true,
            totalAmount: true,
            createdAt: true,
          },
        });

        // Calculate total amount from all invoices
        const totalAmount = invoices.reduce(
          (sum, invoice) => sum + (invoice.totalAmount || 0),
          0
        );

        // Get the last invoice date
        const lastInvoice =
          invoices.length > 0
            ? invoices.sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )[0]
            : null;

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
          totalInvoices: invoices.length,
          totalAmount: totalAmount,
          lastInvoice: lastInvoice ? lastInvoice.createdAt.toISOString() : null,
        };
      })
    );

    return NextResponse.json(transformedCustomers, { status: 200 });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create customer with dynamic user creation
export async function POST(request: Request) {
  try {
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

    // Get or create a user to associate with the customer
    const userId = await getOrCreateDefaultUser();

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
        totalInvoices: 0,
        totalAmount: 0,
        lastInvoice: null,
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

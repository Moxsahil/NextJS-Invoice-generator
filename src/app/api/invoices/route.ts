import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notificationService } from "@/lib/notification-service";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const createInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  companyName: z.string().min(1, "Company name is required"),
  companyGSTIN: z.string().optional(),
  companyAddress: z.string().min(1, "Company address is required"),
  companyPhone: z.string().optional(),
  customerId: z.string().min(1, "Customer selection is required"), // Now required
  invoiceDate: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  items: z.array(
    z.object({
      description: z.string().min(1, "Item description is required"),
      quantity: z.number().positive(),
      rate: z.number().positive(),
    })
  ),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const customerId = url.searchParams.get("customerId");

    // Build where clause
    const whereClause: any = { userId };
    if (customerId) {
      whereClause.customerId = customerId;
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        items: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            gstin: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            country: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform invoices to include customer data for backward compatibility
    const transformedInvoices = invoices.map((invoice) => ({
      ...invoice,
      // Populate customer fields from relationship for backward compatibility
      customerName: invoice.customer?.name || invoice.customerName,
      customerGSTIN: invoice.customer?.gstin || invoice.customerGSTIN,
      customerAddress: invoice.customer
        ? [
            invoice.customer.address,
            invoice.customer.city,
            invoice.customer.state,
          ]
            .filter(Boolean)
            .join(", ")
        : invoice.customerAddress,
    }));

    return NextResponse.json({ invoices: transformedInvoices });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST = create a new invoice with real-time customer sync
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createInvoiceSchema.parse(body);

    // Verify customer exists and belongs to user
    const customer = await prisma.customer.findFirst({
      where: {
        id: data.customerId,
        userId: userId,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found or access denied" },
        { status: 404 }
      );
    }

    // Check if invoice number is unique
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: data.invoiceNumber,
        userId,
      },
    });

    if (existingInvoice) {
      return NextResponse.json(
        { error: "Invoice number already exists" },
        { status: 400 }
      );
    }

    // Get user's settings for tax rates and reminders
    const userSettings = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        sgstRate: true,
        cgstRate: true,
        invoiceReminders: true,
        companyEmail: true,
      },
    });

    const sgstRate = userSettings?.sgstRate || 2.5;
    const cgstRate = userSettings?.cgstRate || 2.5;

    // Calculate totals using user's configured tax rates
    const subtotal = data.items.reduce(
      (sum, item) => sum + item.quantity * item.rate,
      0
    );
    const sgstAmount = subtotal * (sgstRate / 100);
    const cgstAmount = subtotal * (cgstRate / 100);
    const totalAmount = subtotal + sgstAmount + cgstAmount;

    // Create invoice in a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create invoice with customer relationship
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: data.invoiceNumber,
          companyName: data.companyName,
          companyGSTIN: data.companyGSTIN,
          companyAddress: data.companyAddress,
          companyPhone: data.companyPhone,
          // Store customer data for backward compatibility
          customerName: customer.name,
          customerGSTIN: customer.gstin,
          customerAddress: [customer.address, customer.city, customer.state]
            .filter(Boolean)
            .join(", "),
          invoiceDate: new Date(data.invoiceDate),
          dueDate: new Date(data.dueDate),
          subtotal,
          cgstAmount,
          sgstAmount,
          totalAmount,
          userId,
          customerId: data.customerId, // Link to customer
          items: {
            create: data.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.quantity * item.rate,
            })),
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });

      // Update customer's last activity timestamp for real-time sync
      await tx.customer.update({
        where: { id: data.customerId },
        data: {
          updatedAt: new Date(), // This triggers customer data refresh
        },
      });

      return invoice;
    });

    // Create notification for invoice creation
    try {
      await notificationService.createInvoiceNotification(
        'created',
        userId,
        {
          invoiceNumber: result.invoiceNumber,
          customerName: customer.name,
          amount: totalAmount,
        }
      );
    } catch (error) {
      console.error('Failed to create notification:', error);
    }

    // Check if payment reminders are enabled and schedule them
    if (userSettings?.invoiceReminders && customer.email) {
      try {
        // Schedule payment reminders
        const reminderResponse = await fetch(
          `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/payment-reminders`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Cookie": request.headers.get("cookie") || "",
            },
            body: JSON.stringify({
              invoiceId: result.id,
              customerEmail: customer.email,
              dueDate: data.dueDate,
            }),
          }
        );

        if (reminderResponse.ok) {
          console.log("Payment reminders scheduled successfully");
        }
      } catch (error) {
        console.error("Failed to schedule payment reminders:", error);
        // Don't fail the invoice creation if reminders fail
      }
    }

    // **IMPORTANT**: Send a signal to refresh customer data
    // This could be enhanced with WebSockets, but for now we use a timestamp approach
    const responseData = {
      invoice: result,
      customerUpdated: true, // Flag to indicate customer data should be refreshed
      customerId: data.customerId,
      timestamp: new Date().toISOString(),
      remindersScheduled: userSettings?.invoiceReminders && customer.email ? true : false,
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

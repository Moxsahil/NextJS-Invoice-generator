import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const createInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  companyName: z.string().min(1, "Company name is required"),
  companyGSTIN: z.string().optional(),
  companyAddress: z.string().min(1, "Company address is required"),
  companyPhone: z.string().optional(),
  customerName: z.string().min(1, "Customer name is required"),
  customerGSTIN: z.string().optional(),
  customerAddress: z.string().min(1, "Customer address is required"),
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
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST = create a new invoice

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createInvoiceSchema.parse(body);

    // Calculate total amount
    const subtotal = data.items.reduce(
      (sum, item) => sum + item.quantity * item.rate,
      0
    );
    const sgstAmount = subtotal * 0.025;
    const cgstAmount = subtotal * 0.025;
    const totalAmount = subtotal + sgstAmount + cgstAmount;

    // create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        ...data,
        invoiceDate: new Date(data.invoiceDate),
        dueDate: new Date(data.dueDate),
        subtotal,
        cgstAmount,
        sgstAmount,
        totalAmount,
        userId,
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
      },
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

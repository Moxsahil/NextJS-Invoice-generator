import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

import { z } from "zod";

const updateInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1),
  companyName: z.string().min(1),
  companyGSTIN: z.string().optional(),
  companyAddress: z.string().min(1),
  companyPhone: z.string().optional(),
  customerName: z.string().min(1),
  customerGSTIN: z.string().optional(),
  customerAddress: z.string().min(1),
  invoiceDate: z.string(),
  dueDate: z.string(),
  status: z.enum(["DRAFT", "SENT", "PENDING", "PAID", "OVERDUE"]),
  subtotal: z.number(),
  sgstAmount: z.number(),
  cgstAmount: z.number(),
  totalAmount: z.number(),
  items: z.array(
    z.object({
      id: z.string().optional(),
      description: z.string().min(1),
      quantity: z.number().positive(),
      rate: z.number().positive(),
      amount: z.number(),
    })
  ),
});

// PUT - Update invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateInvoiceSchema.parse(body);

    // Check if invoice exists and belongs to user
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        items: true,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Check if invoice number is unique (excluding current invoice)
    const duplicateInvoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: data.invoiceNumber,
        userId,
        id: { not: id },
      },
    });

    if (duplicateInvoice) {
      return NextResponse.json(
        { error: "Invoice number already exists" },
        { status: 400 }
      );
    }

    // Update invoice in a transaction
    const updatedInvoice = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      // Update invoice
      const invoice = await tx.invoice.update({
        where: { id },
        data: {
          invoiceNumber: data.invoiceNumber,
          companyName: data.companyName,
          companyGSTIN: data.companyGSTIN,
          companyAddress: data.companyAddress,
          companyPhone: data.companyPhone,
          customerName: data.customerName,
          customerGSTIN: data.customerGSTIN,
          customerAddress: data.customerAddress,
          invoiceDate: new Date(data.invoiceDate),
          dueDate: new Date(data.dueDate),
          status: data.status,
          subtotal: data.subtotal,
          sgstAmount: data.sgstAmount,
          cgstAmount: data.cgstAmount,
          totalAmount: data.totalAmount,
        },
      });

      // Create new items
      await tx.invoiceItem.createMany({
        data: data.items.map((item) => ({
          invoiceId: id,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
        })),
      });

      return invoice;
    });

    // Fetch updated invoice with items
    const finalInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    return NextResponse.json({ invoice: finalInvoice });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Fetch single invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    await prisma.invoice.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

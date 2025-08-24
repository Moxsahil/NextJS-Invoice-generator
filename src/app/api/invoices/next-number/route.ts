import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's invoice settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        invoicePrefix: true,
        invoiceSuffix: true,
        invoiceStartNumber: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const prefix = user.invoicePrefix || "INV";
    const suffix = user.invoiceSuffix || "";
    const startNumber = user.invoiceStartNumber || 1;

    // Get existing invoices to find the next number
    const existingInvoices = await prisma.invoice.findMany({
      where: {
        userId,
        invoiceNumber: {
          startsWith: `${prefix}-`,
        },
      },
      select: {
        invoiceNumber: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Extract numbers from existing invoice numbers
    const existingNumbers = existingInvoices
      .map((invoice) => {
        const numberPart = invoice.invoiceNumber
          .replace(`${prefix}-`, '')
          .replace(suffix, '');
        const num = parseInt(numberPart);
        return isNaN(num) ? 0 : num;
      })
      .filter(num => num > 0);

    // Determine next number
    let nextNumber = startNumber;
    if (existingNumbers.length > 0) {
      const maxNumber = Math.max(...existingNumbers);
      nextNumber = maxNumber + 1;
    }

    // Format the invoice number
    const nextInvoiceNumber = `${prefix}-${String(nextNumber).padStart(4, '0')}${suffix}`;

    return NextResponse.json({
      nextInvoiceNumber,
      nextNumber,
      prefix,
      suffix,
    });
  } catch (error) {
    console.error("Error getting next invoice number:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
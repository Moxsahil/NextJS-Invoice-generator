import { NextRequest, NextResponse } from "next/server";
import { sendInvoiceEmail } from "@/lib/emailService";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invoice, customerEmail, companyEmail } = await request.json();

    if (!invoice || !customerEmail) {
      return NextResponse.json(
        { error: "Invoice data and customer email are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Send the email
    await sendInvoiceEmail(invoice, customerEmail, companyEmail);

    return NextResponse.json({
      message: "Invoice sent successfully",
      sentTo: customerEmail,
      invoiceNumber: invoice.invoiceNumber,
    });
  } catch (error) {
    console.error("Error sending invoice:", error);
    return NextResponse.json(
      { error: "Failed to send invoice email" },
      { status: 500 }
    );
  }
}

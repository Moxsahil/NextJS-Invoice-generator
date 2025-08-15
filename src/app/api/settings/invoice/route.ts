import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await request.json();
    
    // Update user with invoice settings data
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        invoicePrefix: settings.prefix,
        invoiceSuffix: settings.suffix || null,
        invoiceStartNumber: settings.numberingStart,
        invoiceResetNumbering: settings.resetNumbering,
        defaultCurrency: settings.defaultCurrency,
        defaultPaymentTerms: `${settings.defaultDueDays} days`,
        defaultTaxRate: settings.defaultTaxRate,
        sgstRate: settings.sgstRate,
        cgstRate: settings.cgstRate,
        igstRate: settings.igstRate,
        includeQRCode: settings.includeQRCode,
        showBankDetails: settings.showBankDetails,
        showCompanyLogo: settings.showCompanyLogo,
        showPaymentTerms: settings.showPaymentTerms,
        autoSendEmail: settings.autoSendEmail,
        emailTemplate: settings.emailTemplate,
        invoiceReminders: settings.enableReminders,
        defaultTerms: settings.defaultTerms,
        invoiceFooter: settings.defaultNotes,
        bankName: settings.bankName,
        accountNumber: settings.accountNumber,
        accountName: settings.accountName,
        ifscCode: settings.ifscCode,
        upiId: settings.upiId,
        merchantName: settings.merchantName,
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json({
      message: "Invoice settings updated successfully",
      settings: {
        prefix: updatedUser.invoicePrefix,
        numberingStart: updatedUser.invoiceStartNumber,
        defaultCurrency: updatedUser.defaultCurrency,
        defaultDueDays: parseInt(updatedUser.defaultPaymentTerms.replace(' days', '')),
        defaultTaxRate: updatedUser.defaultTaxRate,
        enableReminders: updatedUser.invoiceReminders,
        defaultNotes: updatedUser.invoiceFooter,
      },
    });
  } catch (error) {
    console.error("Error updating invoice settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's invoice settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        invoicePrefix: true,
        invoiceSuffix: true,
        invoiceStartNumber: true,
        invoiceResetNumbering: true,
        defaultCurrency: true,
        defaultPaymentTerms: true,
        defaultTaxRate: true,
        sgstRate: true,
        cgstRate: true,
        igstRate: true,
        includeQRCode: true,
        showBankDetails: true,
        showCompanyLogo: true,
        showPaymentTerms: true,
        autoSendEmail: true,
        emailTemplate: true,
        invoiceReminders: true,
        defaultTerms: true,
        invoiceFooter: true,
        bankName: true,
        accountNumber: true,
        accountName: true,
        ifscCode: true,
        upiId: true,
        merchantName: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const invoiceSettings = {
      // Invoice Numbering
      prefix: user.invoicePrefix || "INV",
      suffix: user.invoiceSuffix || "",
      numberingStart: user.invoiceStartNumber || 1,
      resetNumbering: user.invoiceResetNumbering || "never",

      // Default Settings
      defaultCurrency: user.defaultCurrency || "INR",
      defaultDueDays: parseInt((user.defaultPaymentTerms || "30 days").replace(' days', '')),
      defaultTaxRate: user.defaultTaxRate || 18,

      // GST Settings
      sgstRate: user.sgstRate || 2.5,
      cgstRate: user.cgstRate || 2.5,
      igstRate: user.igstRate || 5,

      // Invoice Features
      includeQRCode: user.includeQRCode !== null ? user.includeQRCode : true,
      showBankDetails: user.showBankDetails !== null ? user.showBankDetails : true,
      showCompanyLogo: user.showCompanyLogo !== null ? user.showCompanyLogo : true,
      showPaymentTerms: user.showPaymentTerms !== null ? user.showPaymentTerms : true,

      // Email Settings
      autoSendEmail: user.autoSendEmail !== null ? user.autoSendEmail : false,
      emailTemplate: user.emailTemplate || "professional",

      // Payment Reminders
      enableReminders: user.invoiceReminders !== null ? user.invoiceReminders : true,
      reminderDays: [7, 3, 1], // Static for now
      overdueReminders: [1, 7, 15], // Static for now

      // Default Terms and Conditions
      defaultTerms: user.defaultTerms || "Payment is due within 30 days of invoice date. Late payments may be subject to a 1.5% monthly service charge.",
      defaultNotes: user.invoiceFooter || "Thank you for your business!",

      // Bank Details
      bankName: user.bankName || "",
      accountNumber: user.accountNumber || "",
      accountName: user.accountName || "",
      ifscCode: user.ifscCode || "",

      // UPI Details
      upiId: user.upiId || "",
      merchantName: user.merchantName || "",
    };

    return NextResponse.json({
      data: invoiceSettings,
    });
  } catch (error) {
    console.error("Error fetching invoice settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
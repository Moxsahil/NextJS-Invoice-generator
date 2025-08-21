import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  companyName: string;
  companyGSTIN?: string;
  companyAddress: string;
  companyPhone?: string;
  customerName: string;
  customerGSTIN?: string;
  customerAddress: string;
  customerPhone?: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  sgstAmount: number;
  cgstAmount: number;
  totalAmount: number;
  status: string;
  items: InvoiceItem[];
}

export class ProfessionalInvoicePDF {
  private doc: jsPDF;
  private readonly primaryColor = "#1f2937"; // Dark gray
  private readonly accentColor = "#3b82f6"; // Blue
  private readonly lightGray = "#f8fafc";
  private readonly borderColor = "#e5e7eb";
  private readonly pageWidth: number;
  private readonly pageHeight: number;
  private currentY: number;
  private readonly margin = 40;
  private readonly footerHeight = 60; // Reserved space for footer

  constructor() {
    this.doc = new jsPDF("p", "pt", "a4");
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.currentY = this.margin;
  }

  private addHeader(invoice: Invoice, invoiceSettings?: any) {
    // Clean header without boxes
    let startY = this.margin;

    // Company logo - centered if enabled and available
    if (invoiceSettings?.showCompanyLogo && invoiceSettings?.companyLogo) {
      try {
        const logoSize = 60; // Logo height
        const logoX = (this.pageWidth - logoSize) / 2;
        
        // Add logo image
        this.doc.addImage(
          invoiceSettings.companyLogo,
          "JPEG",
          logoX,
          startY,
          logoSize,
          logoSize,
          undefined,
          "FAST"
        );
        
        startY += logoSize + 15; // Add space after logo
      } catch (error) {
        console.error("Error adding company logo to PDF:", error);
        // Continue without logo if there's an error
      }
    }

    // INVOICE title - centered
    this.doc.setFontSize(28);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(31, 41, 55);
    const titleWidth = this.doc.getTextWidth("INVOICE");
    this.doc.text(
      "INVOICE",
      (this.pageWidth - titleWidth) / 2,
      startY + 15
    );

    // Company name - centered and larger
    this.doc.setFontSize(20);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(59, 130, 246);
    const companyWidth = this.doc.getTextWidth(invoice.companyName);
    this.doc.text(
      invoice.companyName,
      (this.pageWidth - companyWidth) / 2,
      startY + 40
    );

    // Company address - centered
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(107, 114, 128);
    const addressLines = this.splitText(invoice.companyAddress, 400);
    let addressY = startY + 55;
    addressLines.forEach((line) => {
      const lineWidth = this.doc.getTextWidth(line);
      this.doc.text(line, (this.pageWidth - lineWidth) / 2, addressY);
      addressY += 14;
    });

    // Company phone - centered if available
    if (invoice.companyPhone) {
      addressY += 2;
      const phoneText = `Phone: ${invoice.companyPhone}`;
      const phoneWidth = this.doc.getTextWidth(phoneText);
      this.doc.text(phoneText, (this.pageWidth - phoneWidth) / 2, addressY);
      addressY += 6;
    }

    // GST number - centered if available
    if (invoice.companyGSTIN) {
      this.doc.setFontSize(10);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(107, 114, 128);
      const gstText = `GST NO: ${invoice.companyGSTIN}`;
      const gstWidth = this.doc.getTextWidth(gstText);
      this.doc.text(gstText, (this.pageWidth - gstWidth) / 2, addressY + 10);
      addressY += 2;
    }

    // Add horizontal line after header
    this.doc.setDrawColor(31, 41, 55);
    this.doc.setLineWidth(1);
    this.doc.line(
      this.margin,
      addressY + 20,
      this.pageWidth - this.margin,
      addressY + 20
    );

    this.currentY = addressY + 20;
  }

  private addBillingSection(invoice: Invoice) {
    const leftBoxX = this.margin;
    const rightBoxX = this.pageWidth / 2 + 20;
    const sectionWidth = this.pageWidth / 2 - this.margin - 20;

    // Bill From section with full company details
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(31, 41, 55);
    this.doc.text("Bill From :", leftBoxX, this.currentY + 20);

    let billFromY = this.currentY + 38;

    // Company name
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(31, 41, 55);
    this.doc.text(invoice.companyName, leftBoxX, billFromY);
    billFromY += 18;

    // Company address
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(107, 114, 128);
    const companyLines = this.splitText(invoice.companyAddress, sectionWidth);
    companyLines.forEach((line) => {
      this.doc.text(line, leftBoxX, billFromY);
      billFromY += 12;
    });

    // Company phone if available
    if (invoice.companyPhone) {
      billFromY += 4;
      this.doc.text(`Phone: ${invoice.companyPhone}`, leftBoxX, billFromY);
      billFromY += 16;
    }

    // Company GST if available
    if (invoice.companyGSTIN) {
      this.doc.text(`GST: ${invoice.companyGSTIN}`, leftBoxX, billFromY);
      billFromY += 16;
    }

    // Bill To section - no boxes
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(31, 41, 55);
    this.doc.text("Bill To :", rightBoxX, this.currentY + 20);

    let detailsY = this.currentY + 38;

    // Customer details with clean layout
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(31, 41, 55);
    this.doc.text(invoice.customerName, rightBoxX, detailsY);
    detailsY += 18;

    // Customer address lines
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(107, 114, 128);
    const customerLines = this.splitText(invoice.customerAddress, sectionWidth);
    customerLines.forEach((line) => {
      this.doc.text(line, rightBoxX, detailsY);
      detailsY += 12;
    });

    // Customer phone if available
    if (invoice.customerPhone) {
      detailsY += 4;
      this.doc.text(`Phone: ${invoice.customerPhone}`, rightBoxX, detailsY);
      detailsY += 16;
    }

    // GST if available
    if (invoice.customerGSTIN) {
      detailsY += 4;
      this.doc.text(`GST: ${invoice.customerGSTIN}`, rightBoxX, detailsY);
      detailsY += 16;
    }

    // Calculate the maximum Y position from both sections
    const maxBillFromY = billFromY;
    const maxBillToY = detailsY + 10;
    const maxY = Math.max(maxBillFromY, maxBillToY);

    // Invoice details section - positioned to the right, below Bill To section
    let invoiceDetailsY = detailsY + 20;

    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(31, 41, 55);
    this.doc.text("Invoice Details", rightBoxX, invoiceDetailsY);

    invoiceDetailsY += 20;
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(107, 114, 128);

    this.doc.text(
      `Invoice No: ${invoice.invoiceNumber}`,
      rightBoxX,
      invoiceDetailsY
    );
    invoiceDetailsY += 14;

    this.doc.text(
      `Invoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString(
        "en-IN"
      )}`,
      rightBoxX,
      invoiceDetailsY
    );
    invoiceDetailsY += 14;

    this.doc.text(
      `Due Date: ${new Date(invoice.dueDate).toLocaleDateString("en-IN")}`,
      rightBoxX,
      invoiceDetailsY
    );

    this.currentY = Math.max(maxY, invoiceDetailsY) + 40;
  }

  private addItemsTable(invoice: Invoice) {
    const tableData = invoice.items.map((item) => [
      item.description,
      item.quantity.toString(),
      `Rs.${item.rate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      `Rs.${item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    ]);

    // No empty rows - table adjusts to actual items

    autoTable(this.doc, {
      startY: this.currentY,
      head: [["Product Description", "Quantity", "Rate", "Amount"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [31, 41, 55],
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: "bold",
        halign: "center",
        cellPadding: 12,
      },
      bodyStyles: {
        fontSize: 10,
        textColor: [31, 41, 55],
        cellPadding: 10,
        lineColor: [229, 231, 235],
        lineWidth: 0.5,
      },
      columnStyles: {
        0: { halign: "left", cellWidth: 280 },
        1: { halign: "center", cellWidth: 70 },
        2: { halign: "right", cellWidth: 90 },
        3: { halign: "right", cellWidth: 100 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: this.margin, right: this.margin },
      styles: {
        lineColor: [229, 231, 235],
        lineWidth: 0.5,
      },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 20;
  }

  private addTotalsSection(invoice: Invoice) {
    // Align with table's right margin
    const totalsX = this.pageWidth - this.margin - 135;
    const labelWidth = 80;

    let totalY = this.currentY + 20;

    // Check if totals section would fit on current page
    const totalsSectionHeight = 100;
    if (
      totalY + totalsSectionHeight >
      this.pageHeight - this.footerHeight - 40
    ) {
      // Add new page if content overflows
      this.doc.addPage();
      totalY = 60;
      this.currentY = 40;
    }
    const lineHeight = 16;

    // Clean totals section without boxes
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(31, 41, 55);

    // Subtotal - right aligned amounts
    this.doc.text("Subtotal:", totalsX, totalY);
    this.doc.text(
      `Rs.${invoice.subtotal.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
      })}`,
      totalsX + 150,
      totalY,
      { align: "right" }
    );
    totalY += lineHeight;

    // CGST
    this.doc.text("CGST:", totalsX, totalY);
    this.doc.text(
      `Rs.${invoice.cgstAmount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
      })}`,
      totalsX + 150,
      totalY,
      { align: "right" }
    );
    totalY += lineHeight;

    // SGST
    this.doc.text("SGST:", totalsX, totalY);
    this.doc.text(
      `Rs.${invoice.sgstAmount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
      })}`,
      totalsX + 150,
      totalY,
      { align: "right" }
    );
    totalY += lineHeight;

    // Separator line
    this.doc.setDrawColor(31, 41, 55);
    this.doc.setLineWidth(1);
    this.doc.line(totalsX, totalY, totalsX + 150, totalY);
    totalY += 16;

    // Total Amount
    this.doc.setFontSize(13);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(59, 130, 246);
    this.doc.text("Total Amount:", totalsX, totalY);
    this.doc.text(
      `Rs.${invoice.totalAmount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
      })}`,
      totalsX + 160,
      totalY,
      { align: "right" }
    );

    this.currentY = totalY + 40;
  }

  private addBankDetailsSection(invoice: Invoice, invoiceSettings?: any) {
    // Only add if bank details are enabled in settings and available
    if (!invoiceSettings?.showBankDetails) return;

    const sectionX = this.margin;
    const sectionWidth = this.pageWidth - this.margin * 2;
    let bankY = this.currentY + 30;

    // Check if bank details section would fit on current page
    const bankSectionHeight = 120;
    if (bankY + bankSectionHeight > this.pageHeight - this.footerHeight - 40) {
      // Add new page if content overflows
      this.doc.addPage();
      bankY = 40;
      this.currentY = 40;
    }

    // Add top border line (like border-t in CSS)
    this.doc.setDrawColor(229, 231, 235);
    this.doc.setLineWidth(1);
    this.doc.line(sectionX, bankY - 10, sectionX + sectionWidth, bankY - 10);

    // Bank Details title with icon representation
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(31, 41, 55);
    this.doc.text("Bank Details", sectionX, bankY + 10);

    bankY += 35;

    // Background box (like bg-gray-50 rounded-lg)
    const boxHeight = 80;
    this.doc.setFillColor(248, 250, 252); // Light gray background
    this.doc.setDrawColor(229, 231, 235);
    this.doc.setLineWidth(0.5);
    this.doc.roundedRect(sectionX, bankY, sectionWidth, boxHeight, 3, 3, "FD");

    // Grid layout - 2 columns like md:grid-cols-2
    const leftColX = sectionX + 20;
    const rightColX = sectionX + sectionWidth / 2 + 10;
    const colWidth = sectionWidth / 2 - 30;
    let leftY = bankY + 20;
    let rightY = bankY + 20;

    this.doc.setFontSize(9);

    // Left Column - Bank Name & Account Number
    if (invoiceSettings.bankName) {
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(31, 41, 55);
      this.doc.text("Bank Name:", leftColX, leftY);
      leftY += 12;
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(75, 85, 99);
      this.doc.text(
        invoiceSettings.bankName || "Not configured",
        leftColX,
        leftY
      );
      leftY += 20;
    }

    if (invoiceSettings.accountNumber) {
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(31, 41, 55);
      this.doc.text("Account Number:", leftColX, leftY);
      leftY += 12;
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(75, 85, 99);
      this.doc.text(
        invoiceSettings.accountNumber || "Not configured",
        leftColX,
        leftY
      );
    }

    // Right Column - IFSC Code & Account Holder
    if (invoiceSettings.ifscCode) {
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(31, 41, 55);
      this.doc.text("IFSC Code:", rightColX, rightY);
      rightY += 12;
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(75, 85, 99);
      this.doc.text(
        invoiceSettings.ifscCode || "Not configured",
        rightColX,
        rightY
      );
      rightY += 20;
    }

    if (invoiceSettings.accountName) {
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(31, 41, 55);
      this.doc.text("Account Holder:", rightColX, rightY);
      rightY += 12;
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(75, 85, 99);
      this.doc.text(
        invoiceSettings.accountName || invoice.companyName,
        rightColX,
        rightY
      );
    }

    this.currentY = bankY + boxHeight + 20;
  }

  private addQRCodeSection(qrCodeDataUrl?: string) {
    // QR code will be added in footer, so just return here
    return;
  }

  private addFooterToCurrentPage(qrCodeDataUrl?: string) {
    // Footer always at bottom of page
    const footerY = this.pageHeight - this.footerHeight + 10;
    const qrSize = 50; // Smaller size to fit in footer

    // Clean footer without box
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(31, 41, 55);
    this.doc.text("Payment Terms & Conditions", this.margin, footerY);

    // Footer content
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(107, 114, 128);
    this.doc.text(
      "Payment is due within 30 days of invoice date. Late payments may be subject to a 1.5% monthly service charge.",
      this.margin,
      footerY + 12
    );
    this.doc.text(
      "This is electronically generated invoice, it does not require any signature.",
      this.margin,
      footerY + 22
    );

    // Add QR code to bottom right if available
    if (qrCodeDataUrl) {
      const qrBoxX = this.pageWidth - this.margin - qrSize;
      const qrY = footerY - 25; // Moved QR code higher

      try {
        // Add QR code to bottom right
        this.doc.addImage(qrCodeDataUrl, "PNG", qrBoxX, qrY, qrSize, qrSize);

        // QR code labels - positioned higher to avoid cutoff
        this.doc.setFontSize(7);
        this.doc.setFont("helvetica", "normal");
        this.doc.setTextColor(107, 114, 128);
        this.doc.text("Scan to Pay", qrBoxX + qrSize / 2, qrY + qrSize + 10, {
          align: "center",
        });
        this.doc.text("UPI Payment", qrBoxX + qrSize / 2, qrY + qrSize + 18, {
          align: "center",
        });
      } catch (error) {
        console.error("Error adding QR code to footer:", error);
        // Show placeholder text instead
        this.doc.setFontSize(7);
        this.doc.setTextColor(107, 114, 128);
        this.doc.text("QR Code", qrBoxX + qrSize / 2, qrY + qrSize / 2 - 5, {
          align: "center",
        });
      }
    }
  }

  private addFooter(invoice: Invoice, qrCodeDataUrl?: string) {
    // Add footer to all pages
    const totalPages = (this.doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.addFooterToCurrentPage(qrCodeDataUrl);
    }
  }

  private splitText(text: string, maxWidth: number): string[] {
    return this.doc.splitTextToSize(text, maxWidth);
  }

  public async generatePDF(
    invoice: Invoice,
    options?: {
      includeQRCode?: boolean;
      upiId?: string;
      merchantName?: string;
    },
    invoiceSettings?: any
  ): Promise<void> {
    try {
      // Generate QR code if options are provided
      let qrCodeDataUrl = "";
      if (options?.includeQRCode && options?.upiId) {
        try {
          const merchantName = options.merchantName || invoice.companyName;
          const upiUrl = `upi://pay?pa=${options.upiId}&pn=${encodeURIComponent(
            merchantName
          )}&am=${invoice.totalAmount}&cu=INR&tn=${encodeURIComponent(
            `Payment for Invoice ${invoice.invoiceNumber}`
          )}`;
          qrCodeDataUrl = await QRCode.toDataURL(upiUrl, {
            width: 150,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
            errorCorrectionLevel: "M",
          });
        } catch (qrError) {
          console.error("Error generating QR code:", qrError);
        }
      }

      // Add all sections with proper spacing
      this.addHeader(invoice, invoiceSettings);
      this.addBillingSection(invoice);
      this.addItemsTable(invoice);
      this.addTotalsSection(invoice);
      this.addBankDetailsSection(invoice, invoiceSettings);
      this.addQRCodeSection(qrCodeDataUrl);
      this.addFooter(invoice, qrCodeDataUrl);

      // Generate filename
      const fileName = `Invoice_${
        invoice.invoiceNumber
      }_${invoice.customerName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

      // Save the PDF
      this.doc.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw new Error("Failed to generate PDF");
    }
  }

  public async generatePDFAsBase64(
    invoice: Invoice,
    options?: {
      includeQRCode?: boolean;
      upiId?: string;
      merchantName?: string;
    },
    invoiceSettings?: any
  ): Promise<string> {
    try {
      // Generate QR code if options are provided
      let qrCodeDataUrl = "";
      if (options?.includeQRCode && options?.upiId) {
        try {
          const merchantName = options.merchantName || invoice.companyName;
          const upiUrl = `upi://pay?pa=${options.upiId}&pn=${encodeURIComponent(
            merchantName
          )}&am=${invoice.totalAmount}&cu=INR&tn=${encodeURIComponent(
            `Payment for Invoice ${invoice.invoiceNumber}`
          )}`;
          qrCodeDataUrl = await QRCode.toDataURL(upiUrl, {
            width: 150,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
            errorCorrectionLevel: "M",
          });
        } catch (qrError) {
          console.error("Error generating QR code:", qrError);
        }
      }

      // Add all sections with proper spacing
      this.addHeader(invoice, invoiceSettings);
      this.addBillingSection(invoice);
      this.addItemsTable(invoice);
      this.addTotalsSection(invoice);
      this.addBankDetailsSection(invoice, invoiceSettings);
      this.addQRCodeSection(qrCodeDataUrl);
      this.addFooter(invoice, qrCodeDataUrl);

      // Return PDF as base64 string
      return this.doc.output('datauristring').split(',')[1];
    } catch (error) {
      console.error("Error generating PDF as base64:", error);
      throw new Error("Failed to generate PDF as base64");
    }
  }
}

// Export function for easy use
export const downloadInvoiceAsPDF = async (
  invoice: Invoice,
  qrOptions?: {
    includeQRCode?: boolean;
    upiId?: string;
    merchantName?: string;
  },
  invoiceSettings?: any
) => {
  try {
    const pdfGenerator = new ProfessionalInvoicePDF();
    await pdfGenerator.generatePDF(invoice, qrOptions, invoiceSettings);
  } catch (error) {
    console.error("Error in downloadInvoiceAsPDF:", error);
    throw error;
  }
};

// Export function for generating PDF as base64 (for email attachments)
export const generateInvoicePDFAsBase64 = async (
  invoice: Invoice,
  qrOptions?: {
    includeQRCode?: boolean;
    upiId?: string;
    merchantName?: string;
  },
  invoiceSettings?: any
): Promise<string> => {
  try {
    const pdfGenerator = new ProfessionalInvoicePDF();
    return await pdfGenerator.generatePDFAsBase64(invoice, qrOptions, invoiceSettings);
  } catch (error) {
    console.error("Error in generateInvoicePDFAsBase64:", error);
    throw error;
  }
};

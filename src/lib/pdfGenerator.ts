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
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  sgstAmount: number;
  cgstAmount: number;
  totalAmount: number;
  status: string;
  items: InvoiceItem[];
}

interface TaxRates {
  sgstRate?: number;
  cgstRate?: number;
}

export class ProfessionalInvoicePDF {
  private doc: jsPDF;
  private readonly primaryColor = "#2563eb"; // Blue
  private readonly secondaryColor = "#64748b"; // Slate
  private readonly successColor = "#16a34a"; // Green
  private readonly pageWidth: number;
  private readonly pageHeight: number;
  private currentY: number;

  constructor() {
    this.doc = new jsPDF("p", "pt", "a4");
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.currentY = 60;
  }

  private addHeader(invoice: Invoice) {
    // Company Logo Placeholder
    this.doc.setFillColor(37, 99, 235); // Blue background
    this.doc.rect(40, 40, 60, 60, "F");

    // Logo Text
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(24);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("I", 65, 80);

    // Invoice Title
    this.doc.setTextColor(33, 37, 41);
    this.doc.setFontSize(32);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("INVOICE", this.pageWidth - 200, 60);

    // Invoice Number
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(100, 116, 139);
    this.doc.text(`#${invoice.invoiceNumber}`, this.pageWidth - 200, 85);

    // Date
    this.doc.text(
      `Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`,
      this.pageWidth - 200,
      105
    );

    this.currentY = 140;
  }

  private addCompanyInfo(invoice: Invoice) {
    // Company Section
    this.doc.setFontSize(18);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(33, 37, 41);
    this.doc.text(invoice.companyName, 40, this.currentY);

    this.currentY += 25;

    // Company Details
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(100, 116, 139);

    const companyLines = this.splitText(invoice.companyAddress, 250);
    companyLines.forEach((line) => {
      this.doc.text(line, 40, this.currentY);
      this.currentY += 15;
    });

    if (invoice.companyPhone) {
      this.doc.text(`Phone: ${invoice.companyPhone}`, 40, this.currentY);
      this.currentY += 15;
    }

    if (invoice.companyGSTIN) {
      this.doc.text(`GSTIN: ${invoice.companyGSTIN}`, 40, this.currentY);
      this.currentY += 15;
    }

    this.currentY += 20;
  }

  private addBillToSection(invoice: Invoice) {
    const startY = 140;

    // Bill To Header with background
    this.doc.setFillColor(248, 250, 252); // Light gray background
    this.doc.rect(320, startY - 15, 235, 30, "F");

    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(33, 37, 41);
    this.doc.text("BILL TO", 330, startY);

    // Customer Details
    this.doc.setFontSize(13);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(33, 37, 41);
    this.doc.text(invoice.customerName, 330, startY + 35);

    let customerY = startY + 55;

    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(100, 116, 139);

    const customerLines = this.splitText(invoice.customerAddress, 220);
    customerLines.forEach((line) => {
      this.doc.text(line, 330, customerY);
      customerY += 15;
    });

    if (invoice.customerGSTIN) {
      this.doc.text(`GSTIN: ${invoice.customerGSTIN}`, 330, customerY);
      customerY += 15;
    }

    // Due Date Box
    this.doc.setFillColor(254, 242, 242); // Light red background
    this.doc.rect(320, customerY + 10, 235, 25, "F");
    this.doc.setTextColor(185, 28, 28);
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(
      `Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`,
      330,
      customerY + 27
    );

    this.currentY = Math.max(this.currentY, customerY + 60);
  }

  private addItemsTable(invoice: Invoice) {
    const tableData = invoice.items.map((item, index) => [
      (index + 1).toString(),
      item.description,
      item.quantity.toString(),
      `₹${item.rate.toFixed(2)}`,
      `₹${item.amount.toFixed(2)}`,
    ]);

    // Use the imported autoTable function
    autoTable(this.doc, {
      startY: this.currentY,
      head: [["#", "Description", "Qty", "Rate", "Amount"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [37, 99, 235], // Blue header
        textColor: [255, 255, 255],
        fontSize: 12,
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: {
        fontSize: 11,
        textColor: [55, 65, 81],
        cellPadding: 10,
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 30 },
        1: { halign: "left", cellWidth: 250 },
        2: { halign: "center", cellWidth: 50 },
        3: { halign: "right", cellWidth: 80 },
        4: { halign: "right", cellWidth: 90 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 40, right: 40 },
      styles: {
        lineColor: [209, 213, 219],
        lineWidth: 0.5,
      },
    });

    // Get the final Y position after the table
    this.currentY = (this.doc as any).lastAutoTable.finalY + 30;
  }

  private addTotalsSection(invoice: Invoice) {
    const totalsX = this.pageWidth - 200;
    const boxWidth = 160;
    const boxStartY = this.currentY;

    // Totals background box
    this.doc.setFillColor(248, 250, 252);
    this.doc.rect(totalsX - 10, boxStartY - 10, boxWidth, 120, "F");

    // Border
    this.doc.setDrawColor(209, 213, 219);
    this.doc.setLineWidth(1);
    this.doc.rect(totalsX - 10, boxStartY - 10, boxWidth, 120);

    const lineHeight = 20;
    let currentTotalY = boxStartY + 10;

    // Subtotal
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(100, 116, 139);
    this.doc.text("Subtotal:", totalsX, currentTotalY);
    this.doc.text(
      `₹${invoice.subtotal.toFixed(2)}`,
      totalsX + 140,
      currentTotalY,
      { align: "right" }
    );

    currentTotalY += lineHeight;

    // Calculate tax rates dynamically
    const sgstRate = invoice.subtotal > 0 ? ((invoice.sgstAmount / invoice.subtotal) * 100).toFixed(1) : "2.5";
    const cgstRate = invoice.subtotal > 0 ? ((invoice.cgstAmount / invoice.subtotal) * 100).toFixed(1) : "2.5";

    // SGST
    this.doc.text(`SGST (${sgstRate}%):`, totalsX, currentTotalY);
    this.doc.text(
      `₹${invoice.sgstAmount.toFixed(2)}`,
      totalsX + 140,
      currentTotalY,
      { align: "right" }
    );

    currentTotalY += lineHeight;

    // CGST
    this.doc.text(`CGST (${cgstRate}%):`, totalsX, currentTotalY);
    this.doc.text(
      `₹${invoice.cgstAmount.toFixed(2)}`,
      totalsX + 140,
      currentTotalY,
      { align: "right" }
    );

    currentTotalY += lineHeight + 5;

    // Separator line
    this.doc.setDrawColor(37, 99, 235);
    this.doc.setLineWidth(2);
    this.doc.line(totalsX, currentTotalY, totalsX + 140, currentTotalY);

    currentTotalY += 15;

    // Total Amount
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(37, 99, 235);
    this.doc.text("Total Amount:", totalsX, currentTotalY);
    this.doc.text(
      `₹${invoice.totalAmount.toFixed(2)}`,
      totalsX + 140,
      currentTotalY,
      { align: "right" }
    );

    this.currentY += 140;
  }

  private async addFooter(invoice: Invoice, qrCodeDataUrl?: string) {
    const footerY = this.pageHeight - 100;

    // Footer line
    this.doc.setDrawColor(209, 213, 219);
    this.doc.setLineWidth(0.5);
    this.doc.line(40, footerY - 20, this.pageWidth - 40, footerY - 20);

    // If QR code is provided, add it to the right side
    if (qrCodeDataUrl) {
      try {
        // Add QR code on the right side
        const qrSize = 60;
        const qrX = this.pageWidth - qrSize - 40;
        const qrY = footerY - 15;
        
        this.doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
        
        // QR code label
        this.doc.setFontSize(8);
        this.doc.setFont("helvetica", "normal");
        this.doc.setTextColor(100, 116, 139);
        this.doc.text(`Scan to Pay ₹${invoice.totalAmount.toFixed(2)}`, qrX + qrSize/2, qrY + qrSize + 10, {
          align: "center",
        });
        this.doc.text("UPI Payment", qrX + qrSize/2, qrY + qrSize + 20, {
          align: "center",
        });
      } catch (error) {
        console.error("Error adding QR code to PDF:", error);
      }
    }

    // Thank you message (left side or center if no QR code)
    const messageX = qrCodeDataUrl ? this.pageWidth / 3 : this.pageWidth / 2;
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(37, 99, 235);
    this.doc.text("Thank you for your business!", messageX, footerY, {
      align: "center",
    });

    // Footer note
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(100, 116, 139);
    this.doc.text(
      "This is a computer-generated invoice and does not require a signature.",
      messageX,
      footerY + 25,
      { align: "center" }
    );
  }

  private addStatusBadge(status: string) {
    let badgeColor: [number, number, number];
    let textColor: [number, number, number] = [255, 255, 255];

    switch (status.toUpperCase()) {
      case "PAID":
        badgeColor = [22, 163, 74]; // Green
        break;
      case "SENT":
        badgeColor = [37, 99, 235]; // Blue
        break;
      case "OVERDUE":
        badgeColor = [239, 68, 68]; // Red
        break;
      default:
        badgeColor = [107, 114, 128]; // Gray
    }

    // Badge background
    this.doc.setFillColor(...badgeColor);
    this.doc.roundedRect(this.pageWidth - 120, 120, 80, 25, 5, 5, "F");

    // Badge text
    this.doc.setTextColor(...textColor);
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(status.toUpperCase(), this.pageWidth - 80, 137, {
      align: "center",
    });
  }

  private splitText(text: string, maxWidth: number): string[] {
    return this.doc.splitTextToSize(text, maxWidth);
  }

  public async generatePDF(invoice: Invoice, options?: { includeQRCode?: boolean; upiId?: string; merchantName?: string }): Promise<void> {
    try {
      // Generate QR code if options are provided
      let qrCodeDataUrl = '';
      if (options?.includeQRCode && options?.upiId) {
        try {
          const upiUrl = `upi://pay?pa=${options.upiId}&pn=${encodeURIComponent(options.merchantName || invoice.companyName)}&am=${invoice.totalAmount}&cu=INR&tn=${encodeURIComponent(`Payment for Invoice ${invoice.invoiceNumber}`)}`;
          qrCodeDataUrl = await QRCode.toDataURL(upiUrl, {
            width: 150,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M'
          });
        } catch (qrError) {
          console.error("Error generating QR code:", qrError);
        }
      }

      // Add all sections
      this.addHeader(invoice);
      this.addCompanyInfo(invoice);
      this.addBillToSection(invoice);
      this.addStatusBadge(invoice.status);
      this.addItemsTable(invoice);
      this.addTotalsSection(invoice);
      await this.addFooter(invoice, qrCodeDataUrl);

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

}

// Export function for easy use
export const downloadInvoiceAsPDF = async (invoice: Invoice, qrOptions?: { includeQRCode?: boolean; upiId?: string; merchantName?: string }) => {
  try {
    const pdfGenerator = new ProfessionalInvoicePDF();
    await pdfGenerator.generatePDF(invoice, qrOptions);
  } catch (error) {
    console.error("Error in downloadInvoiceAsPDF:", error);
    throw error;
  }
};


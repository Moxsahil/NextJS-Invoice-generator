import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import QRCode from "qrcode";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return NextResponse.json(
        { message: "Invoice ID is required" },
        { status: 400 }
      );
    }

    // Fetch invoice data from your database with items
    const invoice = await getInvoiceById(invoiceId);

    if (!invoice) {
      return NextResponse.json(
        { message: "Invoice not found" },
        { status: 404 }
      );
    }

    // Check if the invoice belongs to the authenticated user
    if (invoice.userId !== userId) {
      return NextResponse.json(
        { message: "Access denied" },
        { status: 403 }
      );
    }

    // Fetch invoice settings to check if QR code should be included
    const invoiceSettings = await getInvoiceSettings(invoice.userId);
    
    // Generate QR code if enabled
    let qrCodeDataUrl = '';
    if (invoiceSettings?.includeQRCode && invoiceSettings?.upiId) {
      try {
        const merchantName = invoiceSettings.merchantName || invoiceSettings.companyName || invoice.companyName;
        const upiUrl = `upi://pay?pa=${invoiceSettings.upiId}&pn=${encodeURIComponent(merchantName)}&am=${invoice.totalAmount}&cu=INR&tn=${encodeURIComponent(`Payment for Invoice ${invoice.invoiceNumber}`)}`;
        qrCodeDataUrl = await QRCode.toDataURL(upiUrl, {
          width: 150,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        });
      } catch (error) {
        console.error("Error generating QR code for PDF:", error);
      }
    }

    // Launch Puppeteer with optimized settings
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Set page size and wait for fonts to load
    await page.setViewport({ width: 1200, height: 800 });

    // Create HTML content for the invoice
    const htmlContent = generateInvoiceHTML(invoice, invoiceSettings, qrCodeDataUrl);

    await page.setContent(htmlContent, {
      waitUntil: ["load", "networkidle0"],
    });

    // Generate PDF with optimized settings
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: {
        top: "1.2cm",
        right: "1.2cm",
        bottom: "1.2cm",
        left: "1.2cm",
      },
    });

    await browser.close();

    // Return PDF as downloadable file
    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set("Content-Disposition", `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
    headers.set("Content-Length", pdfBuffer.length.toString());
    headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    headers.set("Pragma", "no-cache");
    headers.set("Expires", "0");

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: headers,
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      {
        message: "Error generating PDF",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// Enhanced HTML template for better PDF rendering
function generateInvoiceHTML(invoice: any, invoiceSettings: any = null, qrCodeDataUrl: string = ''): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body { 
          font-family: 'Arial', 'Helvetica', sans-serif; 
          margin: 0; 
          padding: 24px; 
          color: #333;
          line-height: 1.5;
          background: white;
          font-size: 14px;
        }
        
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .header { 
          text-align: center; 
          margin-bottom: 40px; 
          border-bottom: 3px solid #2563eb; 
          padding: 30px 20px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }
        
        .invoice-title { 
          font-size: 42px; 
          font-weight: bold; 
          color: #1e293b; 
          margin-bottom: 10px;
          letter-spacing: 2px;
        }
        
        .company-name { 
          font-size: 32px; 
          font-weight: bold; 
          color: #2563eb; 
          margin-bottom: 8px;
        }
        
        .company-gstin {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }
        
        .content-wrapper {
          padding: 0 30px 30px;
        }
        
        .details-section { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 60px; 
          margin-bottom: 50px; 
          padding: 25px 0;
          align-items: flex-start;
        }
        
        .detail-box h3 { 
          font-size: 20px; 
          font-weight: bold; 
          margin-bottom: 20px; 
          color: #1e293b;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 8px;
        }
        
        .detail-box p { 
          margin: 10px 0; 
          color: #475569;
          font-size: 14px;
          line-height: 1.6;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        .detail-box strong {
          color: #1e293b;
          font-weight: 600;
        }
        
        .invoice-meta {
          background: #f1f5f9;
          padding: 15px;
          border-radius: 6px;
          margin-top: 15px;
          border-left: 4px solid #2563eb;
        }
        
        .items-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 40px;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .items-table th, .items-table td { 
          border: 1px solid #e2e8f0; 
          padding: 16px 14px; 
          text-align: left;
          font-size: 14px;
          vertical-align: top;
          word-wrap: break-word;
        }
        
        .items-table th { 
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white; 
          font-weight: 600;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.5px;
        }
        
        .items-table tbody tr:nth-child(even) {
          background-color: #f8fafc;
        }
        
        .items-table tbody tr:hover {
          background-color: #f1f5f9;
        }
        
        .items-table td {
          color: #475569;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-medium { font-weight: 500; }
        
        .totals-section { 
          margin-bottom: 50px;
          display: flex;
          justify-content: flex-end;
          page-break-inside: avoid;
        }
        
        .totals-box {
          min-width: 420px;
          background: #f8fafc;
          border-radius: 8px;
          padding: 28px;
          border: 1px solid #e2e8f0;
        }
        
        .total-line { 
          display: flex; 
          justify-content: space-between; 
          margin: 14px 0; 
          padding: 12px 0;
          font-size: 15px;
          color: #475569;
          align-items: center;
        }
        
        .total-line.subtotal {
          border-bottom: 1px solid #cbd5e1;
          font-weight: 600;
          color: #1e293b;
        }
        
        .total-final { 
          border-top: 3px solid #2563eb; 
          font-weight: bold; 
          font-size: 20px;
          margin-top: 15px;
          padding-top: 15px;
          color: #1e293b;
        }
        
        .total-final .amount {
          color: #2563eb;
          font-size: 24px;
        }
        
        .footer { 
          text-align: center; 
          margin-top: 50px; 
          padding-top: 25px; 
          border-top: 2px solid #e2e8f0; 
          color: #64748b;
          background: #f8fafc;
          margin-left: -30px;
          margin-right: -30px;
          margin-bottom: -30px;
          padding-left: 30px;
          padding-right: 30px;
          padding-bottom: 30px;
        }
        
        .footer-message {
          font-size: 18px;
          font-weight: 500;
          color: #2563eb;
          margin-bottom: 8px;
        }
        
        .footer-note {
          font-size: 12px;
          color: #94a3b8;
          font-style: italic;
        }
        
        /* Print optimizations */
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .invoice-container { box-shadow: none; }
        }
        
        @page {
          margin: 1cm;
          size: A4;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <h1 class="invoice-title">INVOICE</h1>
          <h2 class="company-name">${invoice.companyName}</h2>
          ${
            invoice.companyGSTIN
              ? `<p class="company-gstin">GSTIN: ${invoice.companyGSTIN}</p>`
              : ""
          }
        </div>

        <div class="content-wrapper">
          <div class="details-section">
            <div class="detail-box">
              <h3>Bill From</h3>
              <p><strong>${invoice.companyName}</strong></p>
              <p>${invoice.companyAddress.replace(/\n/g, "<br>")}</p>
              ${
                invoice.companyPhone
                  ? `<p><strong>Phone:</strong> ${invoice.companyPhone}</p>`
                  : ""
              }
              ${
                invoice.companyGSTIN
                  ? `<p><strong>GSTIN:</strong> ${invoice.companyGSTIN}</p>`
                  : ""
              }
            </div>
            
            <div class="detail-box">
              <h3>Bill To</h3>
              <p><strong>${invoice.customerName}</strong></p>
              <p>${invoice.customerAddress.replace(/\n/g, "<br>")}</p>
              ${
                invoice.customerGSTIN
                  ? `<p><strong>GSTIN:</strong> ${invoice.customerGSTIN}</p>`
                  : ""
              }
              
              <div class="invoice-meta">
                <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
                <p><strong>Invoice Date:</strong> ${new Date(
                  invoice.invoiceDate
                ).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</p>
                <p><strong>Due Date:</strong> ${new Date(
                  invoice.dueDate
                ).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</p>
                <p><strong>Status:</strong> <span style="color: ${getStatusColor(
                  invoice.status
                )}; font-weight: 600;">${invoice.status.toUpperCase()}</span></p>
              </div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 50%;">Description</th>
                <th style="width: 15%;" class="text-center">Qty</th>
                <th style="width: 17%;" class="text-right">Rate (₹)</th>
                <th style="width: 18%;" class="text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items
                .map(
                  (item: any, index: number) => `
                <tr>
                  <td>
                    <div class="font-medium">${item.description}</div>
                    ${
                      item.notes
                        ? `<div style="font-size: 12px; color: #64748b; margin-top: 4px;">${item.notes}</div>`
                        : ""
                    }
                  </td>
                  <td class="text-center font-medium">${item.quantity}</td>
                  <td class="text-right">₹${item.rate.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}</td>
                  <td class="text-right font-medium">₹${item.amount.toLocaleString(
                    "en-IN",
                    { minimumFractionDigits: 2 }
                  )}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="totals-section">
            <div class="totals-box">
              <div class="total-line subtotal">
                <span>Subtotal:</span>
                <span>₹${invoice.subtotal.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}</span>
              </div>
              <div class="total-line">
                <span>SGST (${invoice.subtotal > 0 ? ((invoice.sgstAmount / invoice.subtotal) * 100).toFixed(1) : "2.5"}%):</span>
                <span>₹${invoice.sgstAmount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}</span>
              </div>
              <div class="total-line">
                <span>CGST (${invoice.subtotal > 0 ? ((invoice.cgstAmount / invoice.subtotal) * 100).toFixed(1) : "2.5"}%):</span>
                <span>₹${invoice.cgstAmount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}</span>
              </div>
              ${
                invoice.discount && invoice.discount > 0
                  ? `
                <div class="total-line">
                  <span>Discount:</span>
                  <span>-₹${invoice.discount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}</span>
                </div>
              `
                  : ""
              }
              <div class="total-line total-final">
                <span>Total Amount:</span>
                <span class="amount">₹${invoice.totalAmount.toLocaleString(
                  "en-IN",
                  { minimumFractionDigits: 2 }
                )}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
              <div style="flex: 1; text-align: left;">
                <p class="footer-message">Thank you for your business!</p>
                <p class="footer-note">This is a computer-generated invoice and does not require a signature.</p>
                <p class="footer-note">Generated on ${new Date().toLocaleDateString(
                  "en-IN",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}</p>
              </div>
              ${qrCodeDataUrl && invoiceSettings?.includeQRCode ? `
                <div style="text-align: center; margin-left: 20px;">
                  <p style="font-size: 12px; color: #64748b; margin-bottom: 8px;">
                    Scan to Pay ₹${invoice.totalAmount.toFixed(2)}
                  </p>
                  <img
                    src="${qrCodeDataUrl}"
                    alt="UPI Payment QR Code"
                    style="width: 96px; height: 96px; border: 1px solid #e2e8f0; border-radius: 4px;"
                  />
                  <p style="font-size: 10px; color: #94a3b8; margin-top: 4px;">
                    UPI Payment
                  </p>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Helper function to get status color
function getStatusColor(status: string): string {
  const colors: { [key: string]: string } = {
    paid: "#059669",
    pending: "#d97706",
    overdue: "#dc2626",
    draft: "#6b7280",
    cancelled: "#ef4444",
  };
  return colors[status.toLowerCase()] || "#6b7280";
}

// Database query function to get invoice settings from User table
async function getInvoiceSettings(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        includeQRCode: true,
        upiId: true,
        merchantName: true,
        companyName: true,
      },
    });
    return user;
  } catch (error) {
    console.error("Error fetching invoice settings:", error);
    return null;
  }
}

// Database query function using Prisma
async function getInvoiceById(invoiceId: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },
      include: {
        items: {
          orderBy: {
            id: "asc",
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invoice) return null;

    // Transform the data to match the expected format
    return {
      ...invoice,
      items: invoice.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
      })),
    };
  } catch (error) {
    console.error("Database query error:", error);
    throw new Error("Failed to fetch invoice data");
  }
}

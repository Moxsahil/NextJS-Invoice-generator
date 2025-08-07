import nodemailer from "nodemailer";
import { downloadInvoiceAsPDF } from "./pdfGenerator";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface InvoiceEmailData {
  invoice: any;
  customerEmail: string;
  companyEmail?: string;
  emailConfig?: EmailConfig;
}

export class InvoiceEmailService {
  private transporter: any;

  constructor(emailConfig?: EmailConfig) {
    if (emailConfig) {
      this.transporter = nodemailer.createTransport(emailConfig);
    } else {
      // Default configuration - you can use environment variables
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  private generateEmailHTML(invoice: any): string {
    const formattedDate = new Date(invoice.invoiceDate).toLocaleDateString(
      "en-GB",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    const formattedDueDate = new Date(invoice.dueDate).toLocaleDateString(
      "en-GB",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.invoiceNumber}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 0;
            background-color: #f8fafc;
        }
        .email-container {
            background-color: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            margin: 20px;
        }
        .header {
            background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .header p {
            margin: 8px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .content {
            padding: 35px 30px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #1f2937;
            font-weight: 600;
        }
        .message {
            font-size: 15px;
            line-height: 1.7;
            color: #4b5563;
            margin-bottom: 25px;
        }
        .invoice-summary {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-left: 5px solid #3b82f6;
            border-radius: 8px;
            padding: 25px;
            margin: 25px 0;
        }
        .summary-title {
            font-size: 16px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
        }
        .summary-title::before {
            content: "📋";
            margin-right: 8px;
        }
        .summary-details {
            display: grid;
            gap: 10px;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .summary-row:last-child {
            border-bottom: none;
            font-weight: 700;
            font-size: 16px;
            color: #1f2937;
            border-top: 2px solid #3b82f6;
            padding-top: 15px;
            margin-top: 10px;
        }
        .summary-label {
            color: #6b7280;
            font-weight: 500;
        }
        .summary-value {
            font-weight: 600;
            color: #1f2937;
        }
        .total-amount {
            color: #3b82f6 !important;
            font-size: 18px !important;
        }
        .payment-info {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
        }
        .payment-info h3 {
            color: #92400e;
            margin: 0 0 10px 0;
            font-size: 16px;
        }
        .payment-info p {
            color: #78350f;
            margin: 0;
            font-weight: 500;
        }
        .cta-section {
            text-align: center;
            margin: 30px 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 15px;
            transition: transform 0.2s;
        }
        .cta-button:hover {
            transform: translateY(-1px);
        }
        .footer {
            background: #f9fafb;
            padding: 25px 30px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
        }
        .footer-message {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 15px;
        }
        .company-info {
            color: #4b5563;
            font-size: 13px;
            font-weight: 500;
        }
        .contact-info {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .status-draft { background: #f3f4f6; color: #374151; }
        .status-sent { background: #dbeafe; color: #1d4ed8; }
        .status-paid { background: #d1fae5; color: #065f46; }
        .status-overdue { background: #fee2e2; color: #991b1b; }
        
        @media (max-width: 600px) {
            .email-container { margin: 10px; }
            .content, .header, .footer { padding: 20px; }
            .summary-row { flex-direction: column; align-items: flex-start; gap: 5px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Invoice from ${invoice.companyName}</h1>
            <p>Professional Invoice & Payment Details</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Hello ${invoice.customerName},
            </div>
            
            <div class="message">
                <p>I hope this email finds you well. Please find attached your invoice for the recent services/products provided by <strong>${
                  invoice.companyName
                }</strong>.</p>
                
                <p>This invoice contains a detailed breakdown of all items, applicable taxes, and the total amount due. We appreciate your business and look forward to continuing our professional relationship.</p>
            </div>
            
            <div class="invoice-summary">
                <div class="summary-title">Invoice Summary</div>
                <div class="summary-details">
                    <div class="summary-row">
                        <span class="summary-label">Invoice Number:</span>
                        <span class="summary-value">#${
                          invoice.invoiceNumber
                        }</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Invoice Date:</span>
                        <span class="summary-value">${formattedDate}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Due Date:</span>
                        <span class="summary-value">${formattedDueDate}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Status:</span>
                        <span class="status-badge status-${invoice.status.toLowerCase()}">${
      invoice.status
    }</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Subtotal:</span>
                        <span class="summary-value">₹${invoice.subtotal.toLocaleString(
                          "en-IN",
                          { minimumFractionDigits: 2 }
                        )}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">SGST (2.5%):</span>
                        <span class="summary-value">₹${invoice.sgstAmount.toLocaleString(
                          "en-IN",
                          { minimumFractionDigits: 2 }
                        )}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">CGST (2.5%):</span>
                        <span class="summary-value">₹${invoice.cgstAmount.toLocaleString(
                          "en-IN",
                          { minimumFractionDigits: 2 }
                        )}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Total Amount:</span>
                        <span class="summary-value total-amount">₹${invoice.totalAmount.toLocaleString(
                          "en-IN",
                          { minimumFractionDigits: 2 }
                        )}</span>
                    </div>
                </div>
            </div>
            
            ${
              invoice.status !== "PAID"
                ? `
            <div class="payment-info">
                <h3>⏰ Payment Due</h3>
                <p>Payment is due by <strong>${formattedDueDate}</strong>. Please process payment at your earliest convenience to avoid any late fees.</p>
            </div>
            `
                : ""
            }
            
            <div class="message">
                <p><strong>What's included in this invoice:</strong></p>
                <ul style="color: #4b5563; margin: 10px 0; padding-left: 20px;">
                    ${invoice.items
                      .map(
                        (item: any) => `
                        <li style="margin: 5px 0;">${item.description} (Qty: ${
                          item.quantity
                        }) - ₹${item.amount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}</li>
                    `
                      )
                      .join("")}
                </ul>
                
                <p>If you have any questions about this invoice or need any clarification regarding the services provided, please don't hesitate to contact us. We're here to help!</p>
                
                <p>For payment arrangements or if you need to discuss the terms, feel free to reach out to us directly.</p>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-message">
                <strong>Thank you for choosing ${
                  invoice.companyName
                }!</strong><br>
                We value your business and appreciate the opportunity to serve you.
            </div>
            
            <div class="company-info">
                <strong>${invoice.companyName}</strong><br>
                ${invoice.companyAddress.replace(/\n/g, "<br>")}
                ${
                  invoice.companyPhone
                    ? `<br>Phone: ${invoice.companyPhone}`
                    : ""
                }
                ${
                  invoice.companyGSTIN
                    ? `<br>GSTIN: ${invoice.companyGSTIN}`
                    : ""
                }
            </div>
            
            <div class="contact-info">
                This is an automated email. For support, please reply to this email or contact us directly.<br>
                Generated on ${new Date().toLocaleDateString(
                  "en-GB"
                )} at ${new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    })}
            </div>
        </div>
    </div>
</body>
</html>
    `;
  }

  public async sendInvoiceEmail(data: InvoiceEmailData): Promise<boolean> {
    try {
      const { invoice, customerEmail, companyEmail } = data;

      // Generate PDF as base64
      const pdfBase64 = await this.generatePDFBase64(invoice);

      const mailOptions = {
        from: {
          name: invoice.companyName,
          address:
            companyEmail || process.env.SMTP_USER || "noreply@company.com",
        },
        to: customerEmail,
        subject: `Invoice #${invoice.invoiceNumber} from ${
          invoice.companyName
        } - ₹${invoice.totalAmount.toLocaleString("en-IN")}`,
        html: this.generateEmailHTML(invoice),
        attachments: [
          {
            filename: `Invoice_${
              invoice.invoiceNumber
            }_${invoice.customerName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
            content: pdfBase64,
            encoding: "base64",
            contentType: "application/pdf",
          },
        ],
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error("Error sending invoice email:", error);
      throw error;
    }
  }

  private async generatePDFBase64(invoice: any): Promise<string> {
    // This is a simplified version - you'll need to modify your PDF generator
    // to return base64 instead of downloading
    return new Promise((resolve, reject) => {
      try {
        // Import your PDF generator and modify it to return base64
        // For now, this is a placeholder
        const base64Data = "placeholder_base64_data";
        resolve(base64Data);
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const sendInvoiceEmail = async (
  invoice: any,
  customerEmail: string,
  companyEmail?: string
): Promise<boolean> => {
  const emailService = new InvoiceEmailService();
  return await emailService.sendInvoiceEmail({
    invoice,
    customerEmail,
    companyEmail,
  });
};

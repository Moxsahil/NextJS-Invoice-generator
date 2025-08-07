"use client";

import { motion } from "framer-motion";
import { Download, Send, Edit, Printer, Mail, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useState } from "react";
import { downloadInvoiceAsPDF } from "@/lib/pdfGenerator";
import Link from "next/link";

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  onSend: (email: string) => void;
  isLoading: boolean;
}

function EmailModal({
  isOpen,
  onClose,
  invoice,
  onSend,
  isLoading,
}: EmailModalProps) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSend = () => {
    if (!email) {
      setEmailError("Email address is required");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setEmailError("");
    onSend(email);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4   backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-300">
            Send Invoice via Email
          </h3>
          <button
            onClick={onClose}
            className="text-gray-100 hover:text-gray-400 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Mail className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Invoice Details
                </p>
                <p className="text-xs text-blue-700">
                  #{invoice.invoiceNumber} • ₹
                  {invoice.totalAmount.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="customerEmail"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Customer Email Address
            </label>
            <input
              type="email"
              id="customerEmail"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                emailError ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="customer@example.com"
              disabled={isLoading}
            />
            {emailError && (
              <p className="mt-1 text-sm text-red-600">{emailError}</p>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Email Preview:
            </h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p>
                <strong>Subject:</strong> Invoice #{invoice.invoiceNumber} from{" "}
                {invoice.companyName}
              </p>
              <p>
                <strong>Attachment:</strong> Professional PDF invoice
              </p>
              <p>
                <strong>Content:</strong> Professional invoice email with
                payment details
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 bg-orange-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              loading={isLoading}
              disabled={isLoading || !email}
              className="flex-1"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Invoice
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
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

interface InvoicePreviewProps {
  invoice: Invoice;
}

export default function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isEmailSending, setIsEmailSending] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      // Small delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Generate and download PDF
      downloadInvoiceAsPDF(invoice);

      // Show success message (optional)
      // You could replace alert with a toast notification
      setTimeout(() => {
        alert(`Invoice ${invoice.invoiceNumber} downloaded successfully!`);
      }, 1000);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendEmail = async (customerEmail: string) => {
    try {
      setIsEmailSending(true);

      const response = await fetch("/api/send-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoice,
          customerEmail,
          companyEmail: "your-company@example.com",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Invoice sent successfully to ${customerEmail}!`);
        setIsEmailModalOpen(false);
      } else {
        throw new Error(data.error || "Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Failed to send email. Please try again.");
    } finally {
      setIsEmailSending(false);
    }
  };

  return (
    <>
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Action Buttons - Responsive */}
        <div className="flex flex-wrap gap-2 sm:gap-4 print:hidden">
          <Button onClick={handlePrint} className="text-xs sm:text-sm">
            <Printer className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Print</span>
            <span className="sm:hidden">Print</span>
          </Button>
          <Button
            onClick={handleDownload}
            variant="outline"
            className="text-xs sm:text-sm"
            loading={isDownloading}
            disabled={isDownloading}
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">
              {isDownloading ? "Downloading..." : "Download PDF"}
            </span>
            <span className="sm:hidden">
              {isDownloading ? "Downloading..." : "PDF"}
            </span>
          </Button>
          <Button
            onClick={() => setIsEmailModalOpen(true)}
            variant="outline"
            className="text-xs sm:text-sm"
          >
            <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Send Email</span>
            <span className="sm:hidden">Send</span>
          </Button>
          <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
            <Button variant="outline" className="text-xs sm:text-sm">
              <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Edit
            </Button>
          </Link>
        </div>

        {/* Rest of your existing invoice preview code remains the same */}
        <motion.div
          id="invoice-preview"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 lg:p-8 print:border-none print:shadow-none"
        >
          {/* All your existing invoice preview JSX remains exactly the same */}
          {/* Header - Responsive */}
          <div className="text-center mb-6 sm:mb-8 border-b-2 border-blue-600 pb-4 sm:pb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              INVOICE
            </h1>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-blue-600">
              {invoice.companyName}
            </h2>
            {invoice.companyGSTIN && (
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                GSTIN: {invoice.companyGSTIN}
              </p>
            )}
          </div>

          {/* Company and Customer Details - Responsive Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                Bill From:
              </h3>
              <div className="space-y-1 text-sm sm:text-base">
                <p className="font-semibold text-gray-900">
                  {invoice.companyName}
                </p>
                <p className="text-gray-600 whitespace-pre-line">
                  {invoice.companyAddress}
                </p>
                {invoice.companyPhone && (
                  <p className="text-gray-600">Phone: {invoice.companyPhone}</p>
                )}
                {invoice.companyGSTIN && (
                  <p className="text-gray-600">GSTIN: {invoice.companyGSTIN}</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 lg:mt-0">
                Bill To:
              </h3>
              <div className="space-y-1 text-sm sm:text-base">
                <p className="font-semibold text-gray-900">
                  {invoice.customerName}
                </p>
                <p className="text-gray-600 whitespace-pre-line">
                  {invoice.customerAddress}
                </p>
                {invoice.customerGSTIN && (
                  <p className="text-gray-600">
                    GSTIN: {invoice.customerGSTIN}
                  </p>
                )}
              </div>

              <div className="mt-4 sm:mt-6 space-y-1 text-xs sm:text-sm text-gray-600">
                <p>
                  <span className="font-semibold text-gray-800">
                    Invoice #:
                  </span>{" "}
                  {invoice.invoiceNumber}
                </p>
                <p>
                  <span className="font-semibold text-gray-800">
                    Invoice Date:
                  </span>{" "}
                  {new Date(invoice.invoiceDate).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-semibold text-gray-800">Due Date:</span>{" "}
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Items Table - Mobile Responsive */}
          {/* Desktop Table */}
          <div className="hidden sm:block mb-6 sm:mb-8 overflow-x-auto">
            <table className="w-full border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm">
                    Description
                  </th>
                  <th className="border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm">
                    Quantity
                  </th>
                  <th className="border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm">
                    Rate
                  </th>
                  <th className="border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-gray-600 text-xs sm:text-sm">
                      {item.description}
                    </td>
                    <td className="border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-center text-gray-600 text-xs sm:text-sm">
                      {item.quantity}
                    </td>
                    <td className="border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-right text-gray-600 text-xs sm:text-sm">
                      ₹{item.rate.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-right text-gray-600 text-xs sm:text-sm">
                      ₹{item.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View for Items */}
          <div className="sm:hidden mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Items:</h3>
            <div className="space-y-3">
              {invoice.items.map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                >
                  <div className="font-medium text-sm text-gray-900 mb-2">
                    {item.description}
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>
                      Qty: {item.quantity} × ₹{item.rate.toFixed(2)}
                    </span>
                    <span className="font-semibold text-gray-900">
                      ₹{item.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals - Responsive */}
          <div className="flex justify-end mb-6 sm:mb-8">
            <div className="w-full sm:max-w-md">
              <div className="space-y-2">
                <div className="flex justify-between items-center border-b border-gray-200 pb-2 text-xs sm:text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">Subtotal:</span>
                  <span>₹{invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm text-gray-600">
                  <span>SGST (2.5%):</span>
                  <span>₹{invoice.sgstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm text-gray-600">
                  <span>CGST (2.5%):</span>
                  <span>₹{invoice.cgstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-t-2 border-blue-600 pt-2">
                  <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
                    Total Amount:
                  </span>
                  <span className="text-base sm:text-lg lg:text-xl font-bold text-blue-600">
                    ₹{invoice.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Responsive */}
          <div className="text-center mt-8 sm:mt-12 pt-4 sm:pt-6 border-t border-gray-200">
            <p className="text-xs sm:text-sm text-gray-600">
              Thank you for your business!
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              This is a computer-generated invoice and does not require a
              signature.
            </p>
          </div>
        </motion.div>
      </div>
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        invoice={invoice}
        onSend={handleSendEmail}
        isLoading={isEmailSending}
      />
    </>
  );
}

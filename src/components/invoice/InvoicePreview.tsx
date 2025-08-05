"use client";

import { motion } from "framer-motion";
import { Download, Send, Edit, Printer } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

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

interface InvoicePreviewProps {
  invoice: Invoice;
}

export default function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Implementation for PDF download would go here
    alert("PDF download functionality would be implemented here");
  };

  const handleSend = () => {
    // Implementation for sending invoice would go here
    alert("Email sending functionality would be implemented here");
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 print:hidden">
        <Button onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
        <Button onClick={handleDownload} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
        <Button onClick={handleSend} variant="outline">
          <Send className="w-4 h-4 mr-2" />
          Send Email
        </Button>
        <Button variant="outline">
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </div>

      {/* Invoice Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-lg p-8 print:border-none print:shadow-none"
      >
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-blue-600 pb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">INVOICE</h1>
          <h2 className="text-2xl font-semibold text-blue-600">
            {invoice.companyName}
          </h2>
          {invoice.companyGSTIN && (
            <p className="text-gray-600">GSTIN: {invoice.companyGSTIN}</p>
          )}
        </div>

        {/* Company and Customer Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Bill From:
            </h3>
            <div className="space-y-1">
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
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Bill To:
            </h3>
            <div className="space-y-1">
              <p className="font-semibold text-gray-900">
                {invoice.customerName}
              </p>
              <p className="text-gray-600 whitespace-pre-line">
                {invoice.customerAddress}
              </p>
              {invoice.customerGSTIN && (
                <p className="text-gray-600">GSTIN: {invoice.customerGSTIN}</p>
              )}
            </div>

            <div className="mt-6 space-y-1 text-gray-600">
              <p>
                <span className="font-semibold text-gray-800">Invoice #:</span>{" "}
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

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="border border-gray-300 px-4 py-3 text-left">
                  Description
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center">
                  Quantity
                </th>
                <th className="border border-gray-300 px-4 py-3 text-right">
                  Rate
                </th>
                <th className="border border-gray-300 px-4 py-3 text-right">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3 text-gray-600">
                    {item.description}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center text-gray-600">
                    {item.quantity}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right text-gray-600">
                    ₹{item.rate.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right text-gray-600">
                    ₹{item.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-full max-w-md">
            <div className="space-y-2">
              <div className="flex justify-between items-center border-b border-gray-200 pb-2 text-gray-600">
                <span className="font-semibold text-gray-900">Subtotal:</span>
                <span>₹{invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>SGST (2.5%):</span>
                <span>₹{invoice.sgstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>CGST (2.5%):</span>
                <span>₹{invoice.cgstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-t-2 border-blue-600 pt-2">
                <span className="text-xl font-bold text-gray-900">
                  Total Amount:
                </span>
                <span className="text-xl font-bold text-blue-600">
                  ₹{invoice.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-6 border-t border-gray-200">
          <p className="text-gray-600">Thank you for your business!</p>
          <p className="text-sm text-gray-500 mt-2">
            This is a computer-generated invoice and does not require a
            signature.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

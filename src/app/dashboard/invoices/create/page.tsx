"use client";

import InvoiceForm from "@/components/invoice/invoiceForm";

export default function CreateInvoicePage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Invoice</h1>
        <p className="text-gray-600">
          Create a new invoice with automatic GST calculations
        </p>
      </div>

      <InvoiceForm />
    </div>
  );
}

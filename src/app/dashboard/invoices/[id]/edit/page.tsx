"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Save, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EditInvoiceForm from "@/components/invoice/EditInvoiceForm";
import Link from "next/link";

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
  items: Array<{
    id?: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
}
export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (params.id) {
      fetchInvoice();
    }
  }, [params.id]);

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setInvoice(data.invoice);
      } else {
        setError(data.error || "Failed to fetch invoice");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedInvoice: any) => {
    try {
      const response = await fetch(`/api/invoices/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedInvoice),
      });

      const data = await response.json();

      if (response.ok) {
        // Show success message
        alert("Invoice updated successfully!");
        // Redirect to invoice detail page
        router.push(`/dashboard/invoices/${params.id}`);
      } else {
        throw new Error(data.error || "Failed to update invoice");
      }
    } catch (error) {
      console.error("Error updating invoice:", error);
      alert("Failed to update invoice. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/dashboard/invoices">
            <Button>Back to Invoices</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link href={`/dashboard/invoices/${params.id}`}>
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Edit Invoice
            </h1>
            <p className="text-gray-600">
              {invoice?.invoiceNumber} • {invoice?.customerName}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link href={`/dashboard/invoices/${params.id}`}>
            <Button variant="outline">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </Link>
        </div>
      </div>

      {/* Edit Form */}
      {invoice && (
        <EditInvoiceForm
          invoice={invoice}
          onSave={handleSave}
          onCancel={() => router.push(`/dashboard/invoices/${params.id}`)}
        />
      )}
    </div>
  );
}

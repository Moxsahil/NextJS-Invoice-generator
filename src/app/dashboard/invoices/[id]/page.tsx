"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import InvoicePreview from "@/components/invoice/InvoicePreview";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function InvoiceDetailPage() {
  const params = useParams();
  const [invoice, setInvoice] = useState(null);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Link
          href="/dashboard/invoices"
          className="inline-flex items-center text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Invoices
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/invoices"
          className="inline-flex items-center text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Invoices
        </Link>
      </div>

      {invoice && <InvoicePreview invoice={invoice} />}
    </div>
  );
}

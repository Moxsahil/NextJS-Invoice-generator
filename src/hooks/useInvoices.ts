"use client";

import { useState, useEffect } from "react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE";
  invoiceDate: string;
  dueDate: string;
  createdAt: string;
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/invoices");

      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch invoices");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const createInvoice = async (invoiceData: any) => {
    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices((prev) => [data.invoice, ...prev]);
        return { success: true, invoice: data.invoice };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error };
      }
    } catch (err) {
      return { success: false, error: "Network error occurred" };
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setInvoices((prev) => prev.filter((invoice) => invoice.id !== id));
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error };
      }
    } catch (err) {
      return { success: false, error: "Network error occurred" };
    }
  };

  const updateInvoiceStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setInvoices((prev) =>
          prev.map((invoice) =>
            invoice.id === id ? { ...invoice, status: status as any } : invoice
          )
        );
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error };
      }
    } catch (err) {
      return { success: false, error: "Network error occurred" };
    }
  };

  const refreshInvoices = () => {
    fetchInvoices();
  };

  return {
    invoices,
    loading,
    error,
    createInvoice,
    deleteInvoice,
    updateInvoiceStatus,
    refreshInvoices,
  };
}

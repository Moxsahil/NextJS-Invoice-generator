"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, Edit, Trash2, FileText } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

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

interface InvoiceListProps {
  searchTerm: string;
  statusFilter: string;
}

export default function InvoiceList({
  searchTerm,
  statusFilter,
}: InvoiceListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await fetch("/api/invoices");
      const data = await response.json();

      if (response.ok) {
        setInvoices(data.invoices);
      } else {
        setError(data.error || "Failed to fetch invoices");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setInvoices(invoices.filter((invoice) => invoice.id !== id));
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete invoice");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "SENT":
        return "bg-blue-100 text-blue-800";
      case "OVERDUE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchInvoices}>Try Again</Button>
        </div>
      </Card>
    );
  }

  if (filteredInvoices.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No invoices found
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== "ALL"
              ? "No invoices match your current filters."
              : "Create your first invoice to get started!"}
          </p>
          <Link href="/dashboard/invoices/create">
            <Button>Create Invoice</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Invoice #
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Customer
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Amount
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Status
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Due Date
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice, index) => (
              <motion.tr
                key={invoice.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="py-4 px-4">
                  <div className="font-medium text-gray-900">
                    {invoice.invoiceNumber}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(invoice.invoiceDate).toLocaleDateString()}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-gray-900">{invoice.customerName}</div>
                </td>
                <td className="py-4 px-4">
                  <div className="font-medium text-gray-900">
                    ₹{invoice.totalAmount.toFixed(2)}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      invoice.status
                    )}`}
                  >
                    {invoice.status}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="text-gray-900">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <Link href={`/dashboard/invoices/${invoice.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteInvoice(invoice.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

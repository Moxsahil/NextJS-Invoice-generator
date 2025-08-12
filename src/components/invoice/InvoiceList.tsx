"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, Edit, Trash2, FileText, MoreVertical } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { toast } from "sonner";

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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const { confirm, isOpen, options, onConfirm, onCancel } = useConfirmDialog();

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
    const confirmed = await confirm({
      title: "Delete Invoice",
      message: "Are you sure you want to delete this invoice? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setInvoices(invoices.filter((invoice) => invoice.id !== id));
        toast.success("Invoice deleted successfully!");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete invoice");
      }
    } catch (err) {
      toast.error("Network error occurred while deleting invoice");
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
        return "bg-green-100 text-green-800 border-green-200";
      case "SENT":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "OVERDUE":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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
        <div className="text-center py-8 sm:py-12">
          <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
            No invoices found
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-6 px-4">
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
    <>
      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-3">
        {filteredInvoices.map((invoice, index) => (
          <motion.div
            key={invoice.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-semibold text-gray-900">
                    {invoice.invoiceNumber}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {invoice.customerName}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                    invoice.status
                  )}`}
                >
                  {invoice.status}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount:</span>
                  <span className="font-semibold text-gray-900">
                    ₹
                    {invoice.totalAmount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice Date:</span>
                  <span className="text-gray-900">
                    {new Date(invoice.invoiceDate).toLocaleDateString("en-GB")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Due Date:</span>
                  <span className="text-gray-900">
                    {new Date(invoice.dueDate).toLocaleDateString("en-GB")}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <Link
                  href={`/dashboard/invoices/${invoice.id}`}
                  className="flex-1"
                >
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </Link>
                <Link
                  href={`/dashboard/invoices/${invoice.id}/edit`}
                  className="flex-1"
                >
                  <Button variant="outline" size="sm" className="w-full">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteInvoice(invoice.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Delete Invoice"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                    Invoice #
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                    Customer
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                    Due Date
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900 text-sm">
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
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900">
                        {invoice.invoiceNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(invoice.invoiceDate).toLocaleDateString(
                          "en-GB"
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-gray-900">
                        {invoice.customerName}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900">
                        ₹
                        {invoice.totalAmount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
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
                        {new Date(invoice.dueDate).toLocaleDateString("en-GB")}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/dashboard/invoices/${invoice.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="View Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Edit Invoice"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteInvoice(invoice.id)}
                          title="Delete Invoice"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={isOpen}
        onClose={onCancel}
        onConfirm={onConfirm}
        title={options.title}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        variant={options.variant}
      />
    </>
  );
}

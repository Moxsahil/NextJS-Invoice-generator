"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import CustomerDetails from "@/components/customers/CustomerDetails";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { Customer } from "@/types/customer";
import { Invoice } from "@/types/invoice";
import { toast } from "sonner";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { confirm, isOpen, options, onConfirm, onCancel } = useConfirmDialog();

  const customerId = params.id as string;

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails();
    }
  }, [customerId]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch customer details
      const customerResponse = await fetch(`/api/customers/${customerId}`);
      if (!customerResponse.ok) {
        throw new Error("Failed to fetch customer");
      }
      const customerData = await customerResponse.json();

      // Fetch customer's invoices
      const invoicesResponse = await fetch(
        `/api/invoices?customerId=${customerId}`
      );
      const invoicesData = invoicesResponse.ok
        ? await invoicesResponse.json()
        : { invoices: [] };

      // Extract the invoices array from the response
      const invoicesArray = invoicesData.invoices || [];

      setCustomer(customerData);
      setInvoices(invoicesArray);
    } catch (err) {
      console.error("Error fetching customer details:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load customer details"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditCustomer = () => {
    router.push(`/dashboard/customers?edit=${customerId}`);
  };

  const handleCreateInvoice = () => {
    router.push(`/dashboard/invoices/create?customerId=${customerId}`);
  };

  const handleDeleteCustomer = async () => {
    if (!customer) return;

    const confirmed = await confirm({
      title: "Delete Customer",
      message: `Are you sure you want to delete ${customer.name}? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });

    if (confirmed) {
      try {
        const response = await fetch(`/api/customers/${customerId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete customer");
        }

        toast.success(`${customer.name} has been deleted successfully`);
        router.push("/dashboard/customers");
      } catch (err) {
        console.error("Error deleting customer:", err);
        toast.error(err instanceof Error ? err.message : "Failed to delete customer");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-800 mb-2">
          Error Loading Customer
        </h3>
        <p className="text-red-700 mb-4">{error}</p>
        <div className="flex space-x-3">
          <button
            onClick={fetchCustomerDetails}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
          <button
            onClick={() => router.push("/dashboard/customers")}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Customer Not Found
        </h3>
        <p className="text-gray-600 mb-4">
          The customer you're looking for doesn't exist.
        </p>
        <button
          onClick={() => router.push("/dashboard/customers")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Customers
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <button
                  onClick={() => router.push("/dashboard/customers")}
                  className="text-gray-700 hover:text-blue-600 inline-flex items-center"
                >
                  Customers
                </button>
              </li>
              <li>
                <div className="flex items-center">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-500 ml-1 md:ml-2">
                    {customer.name}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
          <p className="text-gray-600 mt-1">{customer.email}</p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleEditCustomer}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={handleCreateInvoice}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Invoice
          </button>
          <button
            onClick={handleDeleteCustomer}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Customer Details Component */}
      <CustomerDetails
        customer={customer}
        invoices={invoices}
        onRefresh={fetchCustomerDetails}
      />

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
    </div>
  );
}

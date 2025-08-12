"use client";

import CustomerForm from "@/components/customers/CustomerForm";
import CustomerList from "@/components/customers/CustomerList";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useCustomer } from "@/hooks/useCustomers";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { Customer } from "@/types/customer";
import { useState, useEffect } from "react";

export default function CustomersPage() {
  const {
    customers,
    loading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refreshCustomers,
    forceRefresh,
    refreshCustomer,
    lastRefresh,
  } = useCustomer();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [syncIndicator, setSyncIndicator] = useState(false);
  const { confirm, isOpen, options, onConfirm, onCancel } = useConfirmDialog();

  // Fix hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Listen for invoice creation events to trigger customer refresh
  useEffect(() => {
    const handleCustomerDataUpdate = (event: CustomEvent) => {
      console.log("Customer data update event received:", event.detail);
      setSyncIndicator(true);

      // If we have a specific customer ID, refresh just that customer
      if (event.detail.customerId) {
        refreshCustomer(event.detail.customerId);
      } else {
        // Otherwise refresh all customers
        forceRefresh();
      }

      // Hide sync indicator after 2 seconds
      setTimeout(() => {
        setSyncIndicator(false);
      }, 2000);
    };

    // Listen for custom events from invoice creation
    window.addEventListener(
      "customerDataUpdated",
      handleCustomerDataUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        "customerDataUpdated",
        handleCustomerDataUpdate as EventListener
      );
    };
  }, [forceRefresh, refreshCustomer]);

  // Don't render until client-side
  if (!isClient) {
    return (
      <div className="p-4 space-y-6 md:space-y-6">
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Customers
          </h1>
          <div className="w-full md:w-auto px-4 py-2 bg-gray-200 rounded-lg animate-pulse">
            <div className="w-full md:w-32 h-6 bg-gray-300 rounded"></div>
          </div>
        </div>
        <div className="space-y-4 md:grid md:grid-cols-3 md:gap-6 md:space-y-0">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" || customer.status.toLowerCase() === filterStatus;
    return matchesFilter && matchesSearch;
  });

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setShowAddModal(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowAddModal(true);
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    const confirmed = await confirm({
      title: "Delete Customer",
      message: `Are you sure you want to delete ${customer.name}? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });

    if (confirmed) {
      await deleteCustomer(customer.id);
      refreshCustomers();
    }
  };

  const handleFormSubmit = async (data: Partial<Customer>) => {
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, data);
      } else {
        await createCustomer(
          data as Omit<Customer, "id" | "createdAt" | "updatedAt">
        );
      }

      setShowAddModal(false);
      refreshCustomers();
    } catch (error) {
      console.error("Error saving customer:", error);
    }
  };

  const handleViewCustomer = (customer: Customer) => {
    window.location.href = `/dashboard/customers/${customer.id}`;
  };

  const handleCreateInvoice = (customer: Customer) => {
    window.location.href = `/dashboard/invoices/create?customerId=${customer.id}`;
  };

  const totalRevenue = customers.reduce(
    (sum, c) => sum + (c.totalAmount || 0),
    0
  );
  const activeCustomers = customers.filter((c) => c.status === "Active").length;

  // Handle error state
  if (error) {
    return (
      <div className="p-4 space-y-6 md:space-y-6">
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Customers
          </h1>
          <button
            onClick={handleAddCustomer}
            className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Add Customer</span>
          </button>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Error Loading Customers
          </h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={refreshCustomers}
            className="w-full md:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-6 md:space-y-6">
      {/* Real-time sync indicator */}
      {syncIndicator && (
        <div className="fixed top-4 left-4 right-4 md:right-4 md:left-auto bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span className="text-sm">Updating customer data...</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Customers
          </h1>
          <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-2 mt-1">
            <p className="text-sm text-gray-600">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
            <button
              onClick={forceRefresh}
              className="text-blue-600 hover:text-blue-700 text-sm underline text-left md:text-center"
              title="Refresh customer data"
            >
              Refresh
            </button>
          </div>
        </div>
        <button
          onClick={handleAddCustomer}
          className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search and filter */}
      <div className="space-y-4 md:flex md:flex-row md:space-y-0 md:space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border text-gray-800 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          onChange={(e) =>
            setFilterStatus(e.target.value as "all" | "active" | "inactive")
          }
          value={filterStatus}
          className="w-full md:w-auto px-4 py-2 border text-gray-800 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Statistics Cards - Mobile: Stack vertically, Desktop: Grid */}
      <div className="space-y-4 md:grid md:grid-cols-3 md:gap-6 md:space-y-0">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
          {syncIndicator && (
            <div className="absolute top-2 right-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          )}
          <h3 className="text-sm font-medium text-gray-600">Total Customers</h3>
          <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
          {syncIndicator && (
            <div className="absolute top-2 right-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          )}
          <h3 className="text-sm font-medium text-gray-600">
            Active Customers
          </h3>
          <p className="text-2xl font-bold text-gray-900">{activeCustomers}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
          {syncIndicator && (
            <div className="absolute top-2 right-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          )}
          <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
          <p className="text-2xl font-bold text-gray-900">
            ₹{totalRevenue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Customer List */}
      <CustomerList
        customers={filteredCustomers}
        loading={loading}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
        onView={handleViewCustomer}
        onCreateInvoice={handleCreateInvoice}
      />

      {/* Add/Edit Customer Modal */}
      {showAddModal && (
        <CustomerForm
          customer={editingCustomer}
          onSubmit={handleFormSubmit}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Quick Tips for Real-time Updates */}
      {customers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-blue-900">
                Real-time Updates
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                Customer data automatically updates when you create invoices.
                Revenue, invoice counts, and last invoice dates stay in sync!
              </p>
            </div>
          </div>
        </div>
      )}

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

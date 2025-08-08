"use client";

import CustomerForm from "@/components/customers/CustomerForm";
import CustomerList from "@/components/customers/CustomerList";
import { useCustomer } from "@/hooks/useCustomers";
import { Customer } from "@/types/customer";
import { useState } from "react";

export default function CustomersPage() {
  const {
    customers,
    loading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refreshCustomers,
  } = useCustomer();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

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
    if (window.confirm(`Are you sure you want to delete ${customer.name}?`)) {
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

  // if (error) {
  //   return (
  //     <div className="bg-red-50 border border-red-200 rounded-lg p-6">
  //       <h3 className="text-lg font-medium text-red-800 mb-2">
  //         Error Loading Customers
  //       </h3>
  //       <p className="text-red-700 mb-4">{error}</p>
  //       <button
  //         onClick={refreshCustomers}
  //         className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
  //       >
  //         Retry
  //       </button>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        <button
          onClick={handleAddCustomer}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
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
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
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
          className="px-4 py-2 border text-gray-800 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-600">Total Customers</h3>
          <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-600">
            Active Customers
          </h3>
          <p className="text-2xl font-bold text-gray-900">{activeCustomers}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
          <p className="text-2xl font-bold text-gray-900">
            {"₹"} {totalRevenue.toLocaleString()}
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
    </div>
  );
}

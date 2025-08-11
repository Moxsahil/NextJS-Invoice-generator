"use client";

import React, { useState, useEffect } from "react";
import { Customer } from "@/types/customer";

interface CustomerListProps {
  customers: Customer[];
  loading: boolean;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onView: (customer: Customer) => void;
  onCreateInvoice: (customer: Customer) => void;
}

export default function CustomerList({
  customers,
  loading,
  onEdit,
  onDelete,
  onView,
  onCreateInvoice,
}: CustomerListProps) {
  const [syncingCustomers, setSyncingCustomers] = useState<Set<string>>(
    new Set()
  );
  const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(
    new Set()
  );

  // Listen for real-time customer updates from invoice creation
  useEffect(() => {
    const handleCustomerUpdate = (event: CustomEvent) => {
      const { customerId } = event.detail;

      if (customerId) {
        console.log(
          "CustomerList: Received update event for customer:",
          customerId
        );

        // Show syncing indicator immediately
        setSyncingCustomers((prev) => new Set(prev).add(customerId));

        // After 2 seconds, switch to updated indicator
        setTimeout(() => {
          setSyncingCustomers((prev) => {
            const newSet = new Set(prev);
            newSet.delete(customerId);
            return newSet;
          });

          setRecentlyUpdated((prev) => new Set(prev).add(customerId));

          // Remove updated indicator after 4 seconds
          setTimeout(() => {
            setRecentlyUpdated((prev) => {
              const newSet = new Set(prev);
              newSet.delete(customerId);
              return newSet;
            });
          }, 4000);
        }, 2000);
      }
    };

    // Listen for custom events from invoice creation
    window.addEventListener(
      "customerDataUpdated",
      handleCustomerUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        "customerDataUpdated",
        handleCustomerUpdate as EventListener
      );
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <svg
          className="mx-auto h-16 w-16 text-gray-300 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Customers Found
        </h3>
        <p className="text-gray-600 mb-6">
          Get started by adding your first customer to begin creating invoices.
        </p>
        <button
          onClick={() => (window.location.href = "/dashboard/customers")}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add First Customer
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 md:px-6 py-3 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700">
          Customer Database ({customers.length} customers)
        </h3>
      </div>

      {/* Mobile View - Card Layout */}
      <div className="md:hidden">
        <div className="divide-y divide-gray-200">
          {customers.map((customer) => {
            const isSyncing = syncingCustomers.has(customer.id);
            const isRecentlyUpdated = recentlyUpdated.has(customer.id);

            return (
              <div
                key={customer.id}
                className={`p-4 transition-all duration-500 ${
                  isRecentlyUpdated
                    ? "bg-green-50 border-l-4 border-green-400"
                    : ""
                } ${isSyncing ? "bg-blue-50 border-l-4 border-blue-400" : ""}`}
              >
                {/* Customer Info */}
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex-shrink-0 h-10 w-10 relative">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Sync Status Indicators */}
                    {isSyncing && (
                      <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full animate-pulse">
                        <div className="absolute inset-0 h-3 w-3 bg-blue-400 rounded-full animate-ping"></div>
                      </div>
                    )}
                    {isRecentlyUpdated && (
                      <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {customer.name}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {customer.email}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {customer.status}
                    </span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Invoices</div>
                    <div
                      className={`text-sm font-medium flex items-center ${
                        isSyncing
                          ? "text-blue-600"
                          : isRecentlyUpdated
                          ? "text-green-600"
                          : "text-gray-900"
                      }`}
                    >
                      <span className={isSyncing ? "animate-pulse" : ""}>
                        {customer.totalInvoices || 0}
                      </span>
                      {isSyncing && (
                        <div className="ml-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Revenue</div>
                    <div
                      className={`text-sm font-medium flex items-center ${
                        isSyncing
                          ? "text-blue-600"
                          : isRecentlyUpdated
                          ? "text-green-600"
                          : "text-gray-900"
                      }`}
                    >
                      <span className={isSyncing ? "animate-pulse" : ""}>
                        ₹{(customer.totalAmount || 0).toLocaleString()}
                      </span>
                      {isSyncing && (
                        <div className="ml-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Last Invoice */}
                {customer.lastInvoice && (
                  <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-1">
                      Last Invoice
                    </div>
                    <div
                      className={`text-sm ${
                        isSyncing
                          ? "text-blue-600"
                          : isRecentlyUpdated
                          ? "text-green-600"
                          : "text-gray-900"
                      }`}
                    >
                      {new Date(customer.lastInvoice).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => onView(customer)}
                    className="flex-1 text-center px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => onCreateInvoice(customer)}
                    className="flex-1 text-center px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Invoice
                  </button>
                  <button
                    onClick={() => onEdit(customer)}
                    className="px-3 py-2 text-sm text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop View - Table Layout */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CUSTOMER
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CONTACT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  INVOICES
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  REVENUE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LAST INVOICE
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => {
                const isSyncing = syncingCustomers.has(customer.id);
                const isRecentlyUpdated = recentlyUpdated.has(customer.id);

                return (
                  <tr
                    key={customer.id}
                    className={`transition-all duration-500 hover:bg-gray-50 ${
                      isRecentlyUpdated
                        ? "bg-green-50 border-l-4 border-green-400 shadow-sm"
                        : ""
                    } ${
                      isSyncing ? "bg-blue-50 border-l-4 border-blue-400" : ""
                    }`}
                  >
                    {/* CUSTOMER Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 relative">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>

                          {/* Sync Status Indicators */}
                          {isSyncing && (
                            <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full animate-pulse">
                              <div className="absolute inset-0 h-3 w-3 bg-blue-400 rounded-full animate-ping"></div>
                            </div>
                          )}
                          {isRecentlyUpdated && (
                            <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full">
                              <svg
                                className="w-3 h-3 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}
                        </div>

                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {customer.address ? (
                              <>
                                {customer.address}
                                {customer.city && `, ${customer.city}`}
                                {customer.state && `, ${customer.state}`}
                              </>
                            ) : customer.city ? (
                              customer.city
                            ) : (
                              <span className="italic">
                                No address provided
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* CONTACT Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {customer.email}
                      </div>
                      <div className="text-sm text-gray-500">
                        {customer.phone || (
                          <span className="italic">No phone number</span>
                        )}
                      </div>
                    </td>

                    {/* INVOICES Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm font-medium flex items-center transition-all duration-500 ${
                          isSyncing
                            ? "text-blue-600"
                            : isRecentlyUpdated
                            ? "text-green-600 font-bold"
                            : "text-gray-900"
                        }`}
                      >
                        <span className={isSyncing ? "animate-pulse" : ""}>
                          {customer.totalInvoices || 0}
                        </span>

                        {isSyncing && (
                          <div className="ml-2 flex items-center">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                          </div>
                        )}

                        {isRecentlyUpdated && (
                          <div className="ml-2 text-green-600">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* REVENUE Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm font-medium flex items-center transition-all duration-500 ${
                          isSyncing
                            ? "text-blue-600"
                            : isRecentlyUpdated
                            ? "text-green-600 font-bold"
                            : "text-gray-900"
                        }`}
                      >
                        <span className={isSyncing ? "animate-pulse" : ""}>
                          ₹{(customer.totalAmount || 0).toLocaleString()}
                        </span>

                        {isSyncing && (
                          <div className="ml-2 flex items-center">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                          </div>
                        )}

                        {isRecentlyUpdated && (
                          <div className="ml-2 text-green-600">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* STATUS Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          customer.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {customer.status}
                      </span>
                    </td>

                    {/* LAST INVOICE Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm flex items-center transition-all duration-500 ${
                          isSyncing
                            ? "text-blue-600"
                            : isRecentlyUpdated
                            ? "text-green-600 font-bold"
                            : "text-gray-900"
                        }`}
                      >
                        <span className={isSyncing ? "animate-pulse" : ""}>
                          {customer.lastInvoice ? (
                            new Date(customer.lastInvoice).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )
                          ) : (
                            <span className="text-gray-400 italic">Never</span>
                          )}
                        </span>
                      </div>
                    </td>

                    {/* ACTIONS Column */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => onView(customer)}
                          className="text-blue-600 hover:text-blue-900 hover:underline transition-all duration-200 px-2 py-1 rounded"
                          title="View Customer Details"
                        >
                          View
                        </button>
                        <button
                          onClick={() => onCreateInvoice(customer)}
                          className="text-green-600 hover:text-green-900 hover:underline transition-all duration-200 px-2 py-1 rounded font-medium"
                          title="Create New Invoice"
                        >
                          Invoice
                        </button>
                        <button
                          onClick={() => onEdit(customer)}
                          className="text-indigo-600 hover:text-indigo-900 hover:underline transition-all duration-200 px-2 py-1 rounded"
                          title="Edit Customer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(customer)}
                          className="text-red-600 hover:text-red-900 hover:underline transition-all duration-200 px-2 py-1 rounded"
                          title="Delete Customer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-time Update Footer */}
      <div className="bg-gray-50 px-4 md:px-6 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4 text-gray-500">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Syncing data</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Recently updated</span>
            </div>
          </div>
          <div className="text-gray-400 flex items-center space-x-1">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span className="hidden sm:inline">
              Real-time invoice sync enabled
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

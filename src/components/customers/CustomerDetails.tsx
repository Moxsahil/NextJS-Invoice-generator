"use client";

import React, { useState } from "react";
import { Customer } from "@/types/customer";
import { Invoice } from "@/types/invoice";

interface CustomerDetailsProps {
  customer: Customer;
  invoices: Invoice[];
  onRefresh: () => void;
}

export default function CustomerDetails({
  customer,
  invoices = [], // Provide default empty array
  onRefresh,
}: CustomerDetailsProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "invoices" | "activity"
  >("overview");

  // Ensure invoices is always an array before calling array methods
  const getInvoices = Array.isArray(invoices) ? invoices : [];

  const totalRevenue = getInvoices
    .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

  const invoicesByStatus = getInvoices.reduce((acc, invoice) => {
    acc[invoice.status] = (acc[invoice.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const averageInvoiceValue =
    getInvoices.length > 0 ? totalRevenue / getInvoices.length : 0;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Customer Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                ₹ {(totalRevenue || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 265.788"
                className="w-6 h-6"
              >
                <path fill="#427D2A" d="M0 0h512v265.789H0z" />
                <path
                  fill="#87CC71"
                  d="M427.35 41.011c-.271 19.77 17.153 37.654 37.661 37.9v105.161c-21.602-.271-39.482 17.153-39.728 40.706H84.65c.271-21.603-17.157-39.487-37.662-39.733V79.884c21.685.246 39.58-17.167 39.826-38.873H427.35z"
                />
                <path
                  fill="#427D2A"
                  d="M184.56 94.866c21.004-39.459 70.01-54.415 109.468-33.412 39.458 21 54.415 70.01 33.411 109.469-21 39.457-70.009 54.414-109.467 33.411-39.459-21.004-54.415-70.01-33.412-109.468z"
                />
                <path
                  fill="#FEFEFE"
                  d="M227.768 87.669h56.52c.484 0 .881.406.881.905l-.001 8.613a.895.895 0 01-.881.903h-17.652c2.783 3.237 4.771 7.137 5.673 11.422h11.98c.484 0 .88.404.88.903v8.614c0 .497-.396.905-.88.905h-11.98c-1.081 5.131-3.724 9.715-7.421 13.263-4.843 4.647-11.51 7.529-18.838 7.529v.03h-.815l31.703 36.151c.857.978-.644 3.153-1.317 3.156l-14.657.083-33.844-38.593a1.18 1.18 0 01-.23-1.142v-14.134h19.16v.028c3.445 0 6.568-1.346 8.829-3.512a11.857 11.857 0 002.197-2.859h-29.307c-.484 0-.879-.408-.879-.905v-8.614c0-.499.396-.903.879-.903l29.307-.001a11.781 11.781 0 00-2.197-2.858c-2.261-2.169-5.384-3.514-8.829-3.514v.027l-19.16.001V88.574c0-.499.395-.905.878-.905h.001z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Invoices
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {getInvoices.length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Avg. Invoice Value
              </p>
              <p className="text-2xl font-bold text-purple-600">
                ₹ {Math.round(averageInvoiceValue || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paid Invoices</p>
              <p className="text-2xl font-bold text-green-600">
                {invoicesByStatus.PAID || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "overview", label: "Overview", icon: "📊" },
            { id: "invoices", label: "Invoices", icon: "📄" },
            { id: "activity", label: "Activity", icon: "📈" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Information */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Customer Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Name
                  </label>
                  <p className="text-gray-900">{customer.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Email
                  </label>
                  <p className="text-gray-900">{customer.email}</p>
                </div>
                {customer.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Phone
                    </label>
                    <p className="text-gray-900">{customer.phone}</p>
                  </div>
                )}
                {(customer.address || customer.city) && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Address
                    </label>
                    <p className="text-gray-900">
                      {[
                        customer.address,
                        customer.city,
                        customer.state,
                        customer.zipCode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                      {customer.country && (
                        <>
                          <br />
                          {customer.country}
                        </>
                      )}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Status
                  </label>
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
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Customer Since
                  </label>
                  <p className="text-gray-900">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Invoice Status Breakdown */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Invoice Status Breakdown
              </h3>
              <div className="space-y-3">
                {Object.entries(invoicesByStatus).map(([status, count]) => (
                  <div
                    key={status}
                    className="flex justify-between items-center"
                  >
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        status
                      )}`}
                    >
                      {status.charAt(0).toUpperCase() +
                        status.slice(1).toLowerCase()}
                    </span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                ))}
                {Object.keys(invoicesByStatus).length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No invoices yet
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "invoices" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Invoices ({getInvoices.length})
                </h3>
                <button
                  onClick={() =>
                    (window.location.href = `/dashboard/invoices/create?customerId=${customer.id}`)
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Invoice
                </button>
              </div>
            </div>

            {getInvoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoice
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {invoice.invoiceNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(invoice.invoiceDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ₹{(invoice.totalAmount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              invoice.status
                            )}`}
                          >
                            {invoice.status.charAt(0).toUpperCase() +
                              invoice.status.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() =>
                              (window.location.href = `/dashboard/invoices/${invoice.id}`)
                            }
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-300 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No invoices created for this customer
                </h3>
                <p className="text-gray-600 mb-4">
                  Create your first invoice for {customer.name} to get started.
                </p>
                <button
                  onClick={() =>
                    (window.location.href = `/dashboard/invoices/create?customerId=${customer.id}`)
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create First Invoice
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "activity" && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Recent Activity
            </h3>

            <div className="space-y-4">
              {getInvoices
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )
                .slice(0, 10)
                .map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg"
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        invoice.status === "PAID"
                          ? "bg-green-500"
                          : invoice.status === "OVERDUE"
                          ? "bg-red-500"
                          : "bg-gray-500"
                      }`}
                    ></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          Invoice {invoice.invoiceNumber} was{" "}
                          {invoice.status.toLowerCase()}
                        </p>
                        <span className="text-xs text-gray-500">
                          {new Date(invoice.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Amount: ₹{(invoice.totalAmount || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}

              {getInvoices.length === 0 && (
                <div className="text-center py-8">
                  <svg
                    className="mx-auto h-8 w-8 text-gray-300 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-gray-500 text-sm">No activity to show</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

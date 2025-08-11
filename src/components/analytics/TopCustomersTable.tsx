"use client";

import React, { useState } from "react";
import {
  TopCustomerData,
  formatCurrency,
  formatNumber,
} from "@/types/analytics";

interface TopCustomersTableProps {
  customers: TopCustomerData[];
}

const TopCustomersTable: React.FC<TopCustomersTableProps> = ({ customers }) => {
  const [sortBy, setSortBy] = useState<"revenue" | "invoices" | "average">(
    "revenue"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Sort customers based on selected criteria
  const sortedCustomers = [...customers].sort((a, b) => {
    let aVal, bVal;

    switch (sortBy) {
      case "revenue":
        aVal = a.amount;
        bVal = b.amount;
        break;
      case "invoices":
        aVal = a.invoices;
        bVal = b.invoices;
        break;
      case "average":
        aVal = a.invoices > 0 ? a.amount / a.invoices : 0;
        bVal = b.invoices > 0 ? b.amount / b.invoices : 0;
        break;
      default:
        aVal = a.amount;
        bVal = b.amount;
    }

    if (sortOrder === "desc") {
      return bVal - aVal;
    }
    return aVal - bVal;
  });

  // Calculate total revenue for percentage calculations
  const totalRevenue = customers.reduce(
    (sum, customer) => sum + customer.amount,
    0
  );

  // Get rank badge color
  const getRankBadgeColor = (index: number) => {
    switch (index) {
      case 0:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"; // Gold
      case 1:
        return "bg-gray-100 text-gray-800 border-gray-200"; // Silver
      case 2:
        return "bg-orange-100 text-orange-800 border-orange-200"; // Bronze
      default:
        return "bg-blue-100 text-blue-800 border-blue-200"; // Regular
    }
  };

  // Get rank icon
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return "🥇";
      case 1:
        return "🥈";
      case 2:
        return "🥉";
      default:
        return `#${index + 1}`;
    }
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Top Customers</h3>
          <p className="text-sm text-gray-600 mt-1">
            Your highest revenue generating customers
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [criteria, order] = e.target.value.split("-");
              setSortBy(criteria as any);
              setSortOrder(order as any);
            }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="revenue-desc">Revenue (High to Low)</option>
            <option value="revenue-asc">Revenue (Low to High)</option>
            <option value="invoices-desc">Invoices (Most to Least)</option>
            <option value="invoices-asc">Invoices (Least to Most)</option>
            <option value="average-desc">Avg Invoice (High to Low)</option>
            <option value="average-asc">Avg Invoice (Low to High)</option>
          </select>
        </div>
      </div>

      {sortedCustomers.length > 0 ? (
        <>
          {/* Mobile View - Card Layout */}
          <div className="md:hidden">
            <div className="space-y-4">
              {sortedCustomers.map((customer, index) => {
                const avgInvoice =
                  customer.invoices > 0
                    ? customer.amount / customer.invoices
                    : 0;
                const revenuePercentage =
                  totalRevenue > 0
                    ? ((customer.amount / totalRevenue) * 100).toFixed(1)
                    : "0";

                return (
                  <div
                    key={customer.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    {/* Header with rank and customer info */}
                    <div className="flex items-center space-x-3 mb-3">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border-2 ${getRankBadgeColor(
                          index
                        )}`}
                      >
                        {index < 3 ? getRankIcon(index) : index + 1}
                      </span>

                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {customer.name}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {customer.email}
                        </div>
                      </div>

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

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">
                          Total Revenue
                        </div>
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(customer.amount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {revenuePercentage}% of total
                        </div>
                        {/* Revenue bar */}
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(
                                parseFloat(revenuePercentage),
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">
                          Invoices
                        </div>
                        <div className="font-semibold text-gray-900">
                          {formatNumber(customer.invoices)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Avg: {formatCurrency(avgInvoice)}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-3 border-t border-gray-200">
                      <button
                        onClick={() =>
                          (window.location.href = `/dashboard/customers/${customer.id}`)
                        }
                        className="flex-1 text-center px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() =>
                          (window.location.href = `/dashboard/invoices/create?customerId=${customer.id}`)
                        }
                        className="flex-1 text-center px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Create Invoice
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
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                      Rank
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                      Customer
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                      Total Revenue
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                      Invoices
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                      Avg. Invoice
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedCustomers.map((customer, index) => {
                    const avgInvoice =
                      customer.invoices > 0
                        ? customer.amount / customer.invoices
                        : 0;
                    const revenuePercentage =
                      totalRevenue > 0
                        ? ((customer.amount / totalRevenue) * 100).toFixed(1)
                        : "0";

                    return (
                      <tr
                        key={customer.id}
                        className="hover:bg-gray-50 transition-colors group"
                      >
                        {/* Rank */}
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border-2 ${getRankBadgeColor(
                                index
                              )}`}
                            >
                              {index < 3 ? getRankIcon(index) : index + 1}
                            </span>
                          </div>
                        </td>

                        {/* Customer Info */}
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3 flex-shrink-0">
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-gray-900 truncate">
                                {customer.name}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {customer.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Total Revenue */}
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-semibold text-gray-900">
                              {formatCurrency(customer.amount)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {revenuePercentage}% of total
                            </div>
                            {/* Revenue bar */}
                            <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                              <div
                                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min(
                                    parseFloat(revenuePercentage),
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Invoice Count */}
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">
                            {formatNumber(customer.invoices)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {customer.invoices === 1 ? "invoice" : "invoices"}
                          </div>
                        </td>

                        {/* Average Invoice */}
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">
                            {formatCurrency(avgInvoice)}
                          </div>
                          {avgInvoice > 0 && (
                            <div className="text-sm text-gray-500">
                              per invoice
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
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

                        {/* Actions */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() =>
                                (window.location.href = `/dashboard/customers/${customer.id}`)
                              }
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                              title="View Customer Details"
                            >
                              View
                            </button>
                            <button
                              onClick={() =>
                                (window.location.href = `/dashboard/invoices/create?customerId=${customer.id}`)
                              }
                              className="text-green-600 hover:text-green-700 text-sm font-medium px-2 py-1 rounded hover:bg-green-50 transition-colors"
                              title="Create New Invoice"
                            >
                              Invoice
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
        </>
      ) : (
        <div className="text-center py-12">
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
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            No Customer Data
          </h4>
          <p className="text-gray-600 mb-6">
            No customers with revenue found for the selected period.
            <br />
            Create invoices for your customers to see them ranked here.
          </p>
          <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-3 justify-center">
            <button
              onClick={() => (window.location.href = "/dashboard/customers")}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Manage Customers
            </button>
            <button
              onClick={() =>
                (window.location.href = "/dashboard/invoices/create")
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Invoice
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {sortedCustomers.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-600">Total Customers</div>
              <div className="font-semibold text-gray-900">
                {formatNumber(sortedCustomers.length)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-600">Total Revenue</div>
              <div className="font-semibold text-gray-900">
                {formatCurrency(totalRevenue)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-600">Avg Revenue/Customer</div>
              <div className="font-semibold text-gray-900">
                {formatCurrency(
                  sortedCustomers.length > 0
                    ? totalRevenue / sortedCustomers.length
                    : 0
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-600">Top Customer Share</div>
              <div className="font-semibold text-gray-900">
                {sortedCustomers.length > 0 && totalRevenue > 0
                  ? `${(
                      (sortedCustomers[0].amount / totalRevenue) *
                      100
                    ).toFixed(1)}%`
                  : "0%"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {sortedCustomers.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => (window.location.href = "/dashboard/customers")}
              className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
            >
              View All Customers
            </button>
            <button
              onClick={() =>
                (window.location.href = "/dashboard/invoices?status=OVERDUE")
              }
              className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
            >
              Check Overdue
            </button>
            <button
              onClick={() =>
                (window.location.href = "/dashboard/invoices/create")
              }
              className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
            >
              Create Invoice
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopCustomersTable;

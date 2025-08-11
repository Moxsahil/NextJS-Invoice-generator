"use client";

import React, { useState } from "react";
import RevenueChart from "./RevenueChart";
import InvoiceStatusChart from "./InvoiceStatusChart";
import TopCustomersTable from "./TopCustomersTable";
import {
  AnalyticsData,
  formatCurrency,
  formatPercentage,
} from "@/types/analytics";

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  loading: boolean;
  dateRange: string;
  onRefresh: () => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  data,
  loading,
  dateRange,
  onRefresh,
}) => {
  const [showCharts, setShowCharts] = useState(false);
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  // Helper function to get growth color
  const getGrowthColor = (growth: number) => {
    if (growth > 0) return "text-green-600";
    if (growth < 0) return "text-red-600";
    return "text-gray-600";
  };

  // Helper function to get growth icon
  const getGrowthIcon = (growth: number) => {
    if (growth > 0) {
      return (
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
            d="M7 17l9.2-9.2M17 17V7H7"
          />
        </svg>
      );
    }
    if (growth < 0) {
      return (
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
            d="M17 7l-9.2 9.2M7 7v10h10"
          />
        </svg>
      );
    }
    return (
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
          d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
        />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Mobile: Show only 2 most important cards, Desktop: Show all 4 */}
      <div className="block sm:hidden">
        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
          {/* Total Revenue - Mobile */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <div className="p-2 bg-green-100 rounded-full w-fit mb-2">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
                <p className="text-xs font-medium text-gray-600 mb-1">
                  Total Revenue
                </p>
                <p className="text-base font-bold text-gray-900 leading-tight break-words">
                  {formatCurrency(data.totalRevenue)}
                </p>
              </div>
            </div>
            <div
              className={`flex items-center ${getGrowthColor(
                data.revenueGrowth
              )}`}
            >
              <div className="flex-shrink-0">
                {getGrowthIcon(data.revenueGrowth)}
              </div>
              <span className="text-xs font-medium ml-1 break-words">
                {formatPercentage(data.revenueGrowth)}
              </span>
            </div>
          </div>

          {/* Total Invoices - Mobile */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <div className="p-2 bg-blue-100 rounded-full w-fit mb-2">
                  <svg
                    className="w-4 h-4 text-blue-600"
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
                <p className="text-xs font-medium text-gray-600 mb-1">
                  Total Invoices
                </p>
                <p className="text-base font-bold text-gray-900 leading-tight break-words">
                  {data.totalInvoices}
                </p>
              </div>
            </div>
            <div
              className={`flex items-center ${getGrowthColor(
                data.invoiceGrowth
              )}`}
            >
              <div className="flex-shrink-0">
                {getGrowthIcon(data.invoiceGrowth)}
              </div>
              <span className="text-xs font-medium ml-1">
                {formatPercentage(data.invoiceGrowth)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: Show all 4 cards */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          {/* Total Revenue */}
          <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <div className="p-2 lg:p-3 bg-green-100 rounded-full w-fit mb-2">
                  <svg
                    className="w-4 h-4 lg:w-6 lg:h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
                <p className="text-xs lg:text-sm font-medium text-gray-600 mb-1">
                  Total Revenue
                </p>
                <p className="text-base lg:text-2xl font-bold text-gray-900 leading-tight break-words">
                  {formatCurrency(data.totalRevenue)}
                </p>
              </div>
            </div>
            <div
              className={`flex items-center ${getGrowthColor(
                data.revenueGrowth
              )}`}
            >
              <div className="flex-shrink-0">
                {getGrowthIcon(data.revenueGrowth)}
              </div>
              <span className="text-xs font-medium ml-1 break-words">
                {formatPercentage(data.revenueGrowth)}
              </span>
            </div>
          </div>

          {/* Total Invoices */}
          <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <div className="p-2 lg:p-3 bg-blue-100 rounded-full w-fit mb-2">
                  <svg
                    className="w-4 h-4 lg:w-6 lg:h-6 text-blue-600"
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
                <p className="text-xs lg:text-sm font-medium text-gray-600 mb-1">
                  Total Invoices
                </p>
                <p className="text-base lg:text-2xl font-bold text-gray-900 leading-tight break-words">
                  {data.totalInvoices}
                </p>
              </div>
            </div>
            <div
              className={`flex items-center ${getGrowthColor(
                data.invoiceGrowth
              )}`}
            >
              <div className="flex-shrink-0">
                {getGrowthIcon(data.invoiceGrowth)}
              </div>
              <span className="text-xs font-medium ml-1">
                {formatPercentage(data.invoiceGrowth)}
              </span>
            </div>
          </div>

          {/* Average Invoice */}
          <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <div className="p-2 lg:p-3 bg-purple-100 rounded-full w-fit mb-2">
                  <svg
                    className="w-4 h-4 lg:w-6 lg:h-6 text-purple-600"
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
                <p className="text-xs lg:text-sm font-medium text-gray-600 mb-1">
                  Average Invoice
                </p>
                <p className="text-base lg:text-2xl font-bold text-gray-900 leading-tight break-words">
                  {formatCurrency(data.averageInvoice)}
                </p>
              </div>
            </div>
            <div
              className={`flex items-center ${getGrowthColor(
                data.avgInvoiceGrowth
              )}`}
            >
              <div className="flex-shrink-0">
                {getGrowthIcon(data.avgInvoiceGrowth)}
              </div>
              <span className="text-xs font-medium ml-1">
                {formatPercentage(data.avgInvoiceGrowth)}
              </span>
            </div>
          </div>

          {/* Collection Rate */}
          <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <div className="p-2 lg:p-3 bg-yellow-100 rounded-full w-fit mb-2">
                  <svg
                    className="w-4 h-4 lg:w-6 lg:h-6 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <p className="text-xs lg:text-sm font-medium text-gray-600 mb-1">
                  Collection Rate
                </p>
                <p className="text-base lg:text-2xl font-bold text-gray-900 leading-tight break-words">
                  {data.collectionRate.toFixed(1)}%
                </p>
              </div>
            </div>
            <div
              className={`flex items-center ${getGrowthColor(
                data.collectionRateChange
              )}`}
            >
              <div className="flex-shrink-0">
                {getGrowthIcon(data.collectionRateChange)}
              </div>
              <span className="text-xs font-medium ml-1">
                {formatPercentage(data.collectionRateChange)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue breakdown cards - 3 columns on larger screens */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <h4 className="text-sm font-medium text-gray-600 mb-2">
            Paid Amount
          </h4>
          <p className="text-lg font-bold text-green-600 truncate">
            {formatCurrency(data.paidAmount)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <h4 className="text-sm font-medium text-gray-600 mb-2">
            Pending Amount
          </h4>
          <p className="text-lg font-bold text-yellow-600 truncate">
            {formatCurrency(data.pendingAmount)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <h4 className="text-sm font-medium text-gray-600 mb-2">
            Overdue Amount
          </h4>
          <p className="text-lg font-bold text-red-600 truncate">
            {formatCurrency(data.overdueAmount)}
          </p>
        </div>
      </div>

      {/* Charts section - Hidden on mobile by default, with toggle option */}
      <div className="hidden sm:block space-y-6">
        <RevenueChart data={data.monthlyRevenue} />
        <InvoiceStatusChart data={data.invoiceStatus} />
      </div>

      {/* Mobile Charts Toggle */}
      <div className="block sm:hidden">
        <button
          onClick={() => setShowCharts(!showCharts)}
          className="w-full bg-white p-4 rounded-lg shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              View Charts
            </span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${
                showCharts ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </button>

        {showCharts && (
          <div className="mt-4 space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
              <h4 className="text-sm font-medium text-gray-600 mb-3">
                Revenue Trends
              </h4>
              <RevenueChart data={data.monthlyRevenue} />
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
              <h4 className="text-sm font-medium text-gray-600 mb-3">
                Invoice Status
              </h4>
              <InvoiceStatusChart data={data.invoiceStatus} />
            </div>
          </div>
        )}
      </div>

      {/* Top Customers - Show only on desktop */}
      {data.topCustomers && data.topCustomers.length > 0 && (
        <div className="hidden sm:block">
          <TopCustomersTable customers={data.topCustomers} />
        </div>
      )}

      {/* Mobile: Show only top customer if available */}
      {data.topCustomers && data.topCustomers.length > 0 && (
        <div className="block sm:hidden bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <h4 className="text-sm font-medium text-gray-600 mb-3">
            Top Customer
          </h4>
          <div className="flex justify-between items-center mb-3">
            <div className="flex-1 pr-2">
              <span className="text-sm text-gray-900 truncate block">
                {data.topCustomers[0].name}
              </span>
              <span className="text-sm font-bold text-gray-900">
                {formatCurrency(data.topCustomers[0].amount)}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="View Customer"
              >
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
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </button>
              <button
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Contact Customer"
              >
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
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Data Message */}
      {data.totalInvoices === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 lg:p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Data Available
          </h3>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">
            There are no invoices in your selected date range (
            {dateRange
              .replace(/(\d+)/, "$1 ")
              .replace(/months?|month/, "Month(s)")}
            ).
          </p>
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
            <button
              onClick={() =>
                (window.location.href = "/dashboard/invoices/create")
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Invoice
            </button>
            <button
              onClick={onRefresh}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>
      )}

      {/* Data freshness indicator */}
      <div className="flex flex-col space-y-2 text-xs text-gray-500 pt-4 border-t border-gray-200">
        <div className="break-words">
          Data range: {new Date(data.startDate).toLocaleDateString()} -{" "}
          {new Date(data.endDate).toLocaleDateString()}
        </div>
        <div className="flex items-center">
          <svg
            className="w-3 h-3 mr-1 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="break-words">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

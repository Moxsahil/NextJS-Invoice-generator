"use client";

import React from "react";
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
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(data.totalRevenue)}
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
          </div>
          <div
            className={`flex items-center mt-3 ${getGrowthColor(
              data.revenueGrowth
            )}`}
          >
            {getGrowthIcon(data.revenueGrowth)}
            <span className="text-sm font-medium ml-1">
              {formatPercentage(data.revenueGrowth)} from previous period
            </span>
          </div>
        </div>

        {/* Total Invoices */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">
                Total Invoices
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data.totalInvoices}
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
          <div
            className={`flex items-center mt-3 ${getGrowthColor(
              data.invoiceGrowth
            )}`}
          >
            {getGrowthIcon(data.invoiceGrowth)}
            <span className="text-sm font-medium ml-1">
              {formatPercentage(data.invoiceGrowth)} from previous period
            </span>
          </div>
        </div>

        {/* Average Invoice */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">
                Average Invoice
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(data.averageInvoice)}
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
          <div
            className={`flex items-center mt-3 ${getGrowthColor(
              data.avgInvoiceGrowth
            )}`}
          >
            {getGrowthIcon(data.avgInvoiceGrowth)}
            <span className="text-sm font-medium ml-1">
              {formatPercentage(data.avgInvoiceGrowth)} from previous period
            </span>
          </div>
        </div>

        {/* Collection Rate */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">
                Collection Rate
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data.collectionRate.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <svg
                className="w-6 h-6 text-yellow-600"
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
          </div>
          <div
            className={`flex items-center mt-3 ${getGrowthColor(
              data.collectionRateChange
            )}`}
          >
            {getGrowthIcon(data.collectionRateChange)}
            <span className="text-sm font-medium ml-1">
              {formatPercentage(data.collectionRateChange)} from previous period
            </span>
          </div>
        </div>
      </div>

      {/* Additional Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <h4 className="text-sm font-medium text-gray-600 mb-2">
            Paid Amount
          </h4>
          <p className="text-lg font-bold text-green-600">
            {formatCurrency(data.paidAmount)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <h4 className="text-sm font-medium text-gray-600 mb-2">
            Pending Amount
          </h4>
          <p className="text-lg font-bold text-yellow-600">
            {formatCurrency(data.pendingAmount)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <h4 className="text-sm font-medium text-gray-600 mb-2">
            Overdue Amount
          </h4>
          <p className="text-lg font-bold text-red-600">
            {formatCurrency(data.overdueAmount)}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={data.monthlyRevenue} />
        <InvoiceStatusChart data={data.invoiceStatus} />
      </div>

      {/* Top Customers */}
      {data.topCustomers && data.topCustomers.length > 0 && (
        <TopCustomersTable customers={data.topCustomers} />
      )}

      {/* No Data Message for specific sections */}
      {data.totalInvoices === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
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
          <p className="text-gray-600 mb-4">
            There are no invoices in your selected date range (
            {dateRange
              .replace(/(\d+)/, "$1 ")
              .replace(/months?|month/, "Month(s)")}
            ).
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
      <div className="flex justify-between items-center text-xs text-gray-500 pt-4 border-t border-gray-200">
        <div>
          Data range: {new Date(data.startDate).toLocaleDateString()} -{" "}
          {new Date(data.endDate).toLocaleDateString()}
        </div>
        <div className="flex items-center">
          <svg
            className="w-3 h-3 mr-1"
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
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

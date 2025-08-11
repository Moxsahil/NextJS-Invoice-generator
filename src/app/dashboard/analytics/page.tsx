"use client";

import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import { useAnalytics } from "@/hooks/useAnalytics";
import { DATE_RANGE_OPTIONS } from "@/types/analytics";

export default function AnalyticsPage() {
  const {
    analyticsData,
    loading,
    error,
    dateRange,
    setDateRange,
    refreshData,
    exportReport,
    isExporting,
  } = useAnalytics();

  if (error) {
    return (
      <div className="space-y-6 text-black">
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Analytics
          </h1>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <svg
              className="w-6 h-6 text-red-600 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-red-800">
              Error Loading Analytics
            </h3>
          </div>
          <p className="text-red-600 mb-4">Unable to load analytics data</p>
          <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-3">
            <button
              onClick={refreshData}
              className="w-full md:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() =>
                (window.location.href = "/dashboard/invoices/create")
              }
              className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create First Invoice
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 text-black">
      {/* Header - Same pattern as customer page */}
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-start md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Analytics
          </h1>
          <p className="text-sm text-gray-600 mt-1 break-words">
            {analyticsData && (
              <>
                {new Date(analyticsData.startDate).toLocaleDateString()} -{" "}
                {new Date(analyticsData.endDate).toLocaleDateString()} •{" "}
                {analyticsData.totalInvoices} invoices
              </>
            )}
          </p>
        </div>

        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-3 w-full md:w-auto">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            disabled={loading}
            className="w-full md:w-auto px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
          >
            {DATE_RANGE_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
                title={option.description}
              >
                {option.label}
              </option>
            ))}
          </select>

          <button
            onClick={refreshData}
            disabled={loading}
            title="Refresh Data"
            className="w-full md:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <svg
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={exportReport}
            disabled={loading || isExporting || !analyticsData}
            className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            title="Export analytics report"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {isExporting ? "Exporting..." : "Export Report"}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && !analyticsData && (
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        </div>
      )}

      {/* Analytics Dashboard */}
      {analyticsData && (
        <AnalyticsDashboard
          data={analyticsData}
          loading={loading}
          dateRange={dateRange}
          onRefresh={refreshData}
        />
      )}

      {/* Empty State - No Data */}
      {!loading && !analyticsData && !error && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <svg
            className="mx-auto h-16 w-16 text-gray-300 mb-6"
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
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No Analytics Data
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            It looks like you don't have any invoices yet. Create your first
            invoice to start seeing analytics and insights.
          </p>
          <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-3 justify-center">
            <button
              onClick={() =>
                (window.location.href = "/dashboard/invoices/create")
              }
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create First Invoice
            </button>
            <button
              onClick={() => (window.location.href = "/dashboard/customers")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Manage Customers
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  MonthlyRevenueData,
  formatCurrency,
  formatNumber,
} from "@/types/analytics";

interface RevenueChartProps {
  data: MonthlyRevenueData[];
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const revenueData = payload[0];
      const invoiceData = revenueData.payload;

      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[200px]">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Revenue:</span>
              </div>
              <span className="font-semibold text-blue-600">
                {formatCurrency(revenueData.value)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Invoices:</span>
              </div>
              <span className="font-semibold text-green-600">
                {formatNumber(invoiceData.invoices)}
              </span>
            </div>
            {invoiceData.invoices > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                <span className="text-xs text-gray-500">Avg per invoice:</span>
                <span className="text-xs font-medium text-gray-700">
                  {formatCurrency(revenueData.value / invoiceData.invoices)}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate some stats for the header
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalInvoices = data.reduce((sum, item) => sum + item.invoices, 0);
  const avgMonthlyRevenue = data.length > 0 ? totalRevenue / data.length : 0;

  // Calculate growth from first to last month
  const growth =
    data.length >= 2
      ? ((data[data.length - 1].revenue - data[0].revenue) / data[0].revenue) *
        100
      : 0;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
          <p className="text-sm text-gray-600 mt-1">
            Monthly revenue progression over time
          </p>
        </div>

        {/* Summary stats */}
        <div className="text-right">
          <div className="text-sm text-gray-600">Period Growth</div>
          <div
            className={`text-lg font-semibold ${
              growth >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {growth >= 0 ? "+" : ""}
            {growth.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Chart legend */}
      <div className="flex items-center space-x-6 mb-4">
        <div className="flex items-center text-sm">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-gray-600">Revenue</span>
        </div>
        <div className="flex items-center text-sm">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-gray-600">Invoice Count</span>
        </div>
        <div className="text-xs text-gray-500 ml-auto">
          Avg: {formatCurrency(avgMonthlyRevenue)}/month
        </div>
      </div>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={data}
            margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
                if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
                return `₹${value}`;
              }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Revenue line */}
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 5 }}
              activeDot={{
                r: 7,
                stroke: "#3b82f6",
                strokeWidth: 2,
                fill: "#ffffff",
              }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-80 text-gray-500">
          <div className="text-center">
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
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
              />
            </svg>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No Revenue Data
            </h4>
            <p className="text-gray-600 mb-4">
              No revenue data available for the selected period.
              <br />
              Create some invoices to see trends appear here.
            </p>
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

      {/* Additional insights */}
      {data.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-600">Total Revenue</div>
              <div className="font-semibold text-gray-900">
                {formatCurrency(totalRevenue)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-600">Total Invoices</div>
              <div className="font-semibold text-gray-900">
                {formatNumber(totalInvoices)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-600">Best Month</div>
              <div className="font-semibold text-gray-900">
                {data.reduce(
                  (max, item) => (item.revenue > max.revenue ? item : max),
                  data[0]
                )?.month || "N/A"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueChart;

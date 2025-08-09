"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { InvoiceStatusData, formatNumber } from "@/types/analytics";

interface InvoiceStatusChartProps {
  data: InvoiceStatusData[];
}

const InvoiceStatusChart: React.FC<InvoiceStatusChartProps> = ({ data }) => {
  // Define colors for different invoice statuses
  const STATUS_COLORS = {
    Paid: "#10b981", // Green - completed transactions
    Pending: "#f59e0b", // Yellow - awaiting payment
    Sent: "#3b82f6", // Blue - recently sent
    Overdue: "#ef4444", // Red - past due
    Draft: "#6b7280", // Gray - not yet sent
    Cancelled: "#9ca3af", // Light gray - cancelled
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const total = payload[0].payload.total || data.payload.value;
      const percentage = ((data.value / total) * 100).toFixed(1);

      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[160px]">
          <div className="flex items-center mb-2">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: data.payload.fill }}
            />
            <span className="font-semibold text-gray-900">{data.name}</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Count:</span>
              <span className="font-semibold">{formatNumber(data.value)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Percentage:</span>
              <span className="font-semibold">{percentage}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom label function for pie slices
  const CustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }: any) => {
    // Only show label if percentage is >= 5%
    if (percent < 0.05) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={11}
        fontWeight="600"
        className="drop-shadow-sm"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Calculate total and add to data
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithTotal = data.map((item) => ({
    ...item,
    total,
    fill: STATUS_COLORS[item.name as keyof typeof STATUS_COLORS] || "#6b7280",
  }));

  // Sort data by value for better visual hierarchy
  const sortedData = [...dataWithTotal].sort((a, b) => b.value - a.value);

  // Get status insights
  const getStatusInsight = () => {
    if (total === 0) return null;

    const paidCount = data.find((item) => item.name === "Paid")?.value || 0;
    const overdueCount =
      data.find((item) => item.name === "Overdue")?.value || 0;
    const pendingCount =
      data.find((item) => item.name === "Pending" || item.name === "Sent")
        ?.value || 0;

    const paidPercentage = (paidCount / total) * 100;
    const overduePercentage = (overdueCount / total) * 100;

    if (paidPercentage >= 80)
      return { type: "success", message: "Excellent collection rate!" };
    if (overduePercentage >= 20)
      return { type: "warning", message: "High overdue rate needs attention" };
    if (pendingCount > paidCount)
      return { type: "info", message: "Many invoices awaiting payment" };

    return { type: "neutral", message: "Invoice status looks balanced" };
  };

  const insight = getStatusInsight();

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Invoice Status Distribution
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Breakdown of all invoice statuses
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Total Invoices</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatNumber(total)}
          </div>
        </div>
      </div>

      {data.length > 0 && total > 0 ? (
        <div className="flex flex-col lg:flex-row items-center">
          {/* Pie Chart */}
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sortedData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomLabel}
                  outerRadius={110}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {sortedData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend and Stats */}
          <div className="lg:w-48 lg:ml-6 mt-4 lg:mt-0 w-full">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 mb-3">
                Status Breakdown
              </h4>
              {sortedData.map((entry, index) => {
                const percentage = ((entry.value / total) * 100).toFixed(1);
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center flex-1">
                      <div
                        className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                        style={{ backgroundColor: entry.fill }}
                      />
                      <span className="text-gray-700 truncate">
                        {entry.name}
                      </span>
                    </div>
                    <div className="text-right ml-3">
                      <div className="font-semibold text-gray-900">
                        {entry.value}
                      </div>
                      <div className="text-xs text-gray-500">{percentage}%</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Status Insight */}
            {insight && (
              <div
                className={`mt-6 p-3 rounded-lg ${
                  insight.type === "success"
                    ? "bg-green-50 border border-green-200"
                    : insight.type === "warning"
                    ? "bg-red-50 border border-red-200"
                    : insight.type === "info"
                    ? "bg-blue-50 border border-blue-200"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <div
                  className={`text-xs font-medium ${
                    insight.type === "success"
                      ? "text-green-800"
                      : insight.type === "warning"
                      ? "text-red-800"
                      : insight.type === "info"
                      ? "text-blue-800"
                      : "text-gray-800"
                  }`}
                >
                  💡 Insight
                </div>
                <div
                  className={`text-sm mt-1 ${
                    insight.type === "success"
                      ? "text-green-700"
                      : insight.type === "warning"
                      ? "text-red-700"
                      : insight.type === "info"
                      ? "text-blue-700"
                      : "text-gray-700"
                  }`}
                >
                  {insight.message}
                </div>
              </div>
            )}
          </div>
        </div>
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No Invoice Data
            </h4>
            <p className="text-gray-600 mb-4">
              No invoices found for the selected period.
              <br />
              Create your first invoice to see status distribution.
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

      {/* Quick Actions */}
      {total > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                (window.location.href = "/dashboard/invoices?status=OVERDUE")
              }
              className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
            >
              View Overdue
            </button>
            <button
              onClick={() =>
                (window.location.href = "/dashboard/invoices?status=SENT")
              }
              className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
            >
              View Pending
            </button>
            <button
              onClick={() =>
                (window.location.href = "/dashboard/invoices?status=DRAFT")
              }
              className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
              View Drafts
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceStatusChart;

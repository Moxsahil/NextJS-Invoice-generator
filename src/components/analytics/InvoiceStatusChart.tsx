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
  // Enhanced colors with gradients for different invoice statuses
  const STATUS_COLORS = {
    Paid: "#10b981", // Emerald - completed transactions
    Pending: "#f59e0b", // Amber - awaiting payment
    Sent: "#3b82f6", // Blue - recently sent
    Overdue: "#ef4444", // Rose - past due
    Draft: "#6b7280", // Slate - not yet sent
    Cancelled: "#9ca3af", // Gray - cancelled
  };

  const STATUS_GRADIENTS = {
    Paid: "from-emerald-400 to-emerald-600",
    Pending: "from-amber-400 to-amber-600",
    Sent: "from-blue-400 to-blue-600",
    Overdue: "from-rose-400 to-rose-600",
    Draft: "from-slate-400 to-slate-600",
    Cancelled: "from-gray-400 to-gray-600",
  };

  const STATUS_ICONS = {
    Paid: (
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
    ),
    Pending: (
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
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    Sent: (
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
          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
        />
      </svg>
    ),
    Overdue: (
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
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
    Draft: (
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
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
        />
      </svg>
    ),
    Cancelled: (
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
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
  };

  // Enhanced tooltip component with beautiful styling
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const total = payload[0].payload.total || data.payload.value;
      const percentage = ((data.value / total) * 100).toFixed(1);
      const statusName = data.name as keyof typeof STATUS_COLORS;

      return (
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-2xl p-4 min-w-[180px] transform transition-all duration-200">
          <div className="flex items-center mb-3">
            <div
              className="w-4 h-4 rounded-full mr-3 shadow-sm"
              style={{ backgroundColor: data.payload.fill }}
            />
            <span className="font-bold text-slate-900 text-base">
              {data.name}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 text-sm">Count:</span>
              <span className="font-bold text-slate-900 text-lg">
                {formatNumber(data.value)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 text-sm">Share:</span>
              <span className="font-bold text-slate-900 text-lg">
                {percentage}%
              </span>
            </div>
          </div>

          <div
            className={`mt-3 p-2 rounded-lg bg-gradient-to-r ${STATUS_GRADIENTS[statusName]} text-white text-center`}
          >
            <div className="flex items-center justify-center gap-2">
              {STATUS_ICONS[statusName]}
              <span className="text-sm font-medium">{statusName} Status</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Enhanced label function for pie slices
  const CustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }: any) => {
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
        fontSize={
          typeof window !== "undefined" && window.innerWidth < 768 ? 10 : 12
        }
        fontWeight="700"
        className="drop-shadow-lg"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Calculate total and enhance data
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithTotal = data.map((item) => ({
    ...item,
    total,
    fill: STATUS_COLORS[item.name as keyof typeof STATUS_COLORS] || "#6b7280",
  }));

  // Sort data by value for better visual hierarchy
  const sortedData = [...dataWithTotal].sort((a, b) => b.value - a.value);

  // Enhanced status insights with more detailed analysis
  const getStatusInsight = () => {
    if (total === 0) return null;

    const paidCount = data.find((item) => item.name === "Paid")?.value || 0;
    const overdueCount =
      data.find((item) => item.name === "Overdue")?.value || 0;
    const pendingCount =
      data.find((item) => item.name === "Pending")?.value || 0;
    const sentCount = data.find((item) => item.name === "Sent")?.value || 0;
    const draftCount = data.find((item) => item.name === "Draft")?.value || 0;

    const paidPercentage = (paidCount / total) * 100;
    const overduePercentage = (overdueCount / total) * 100;
    const awaitingPayment = pendingCount + sentCount;

    if (paidPercentage >= 85) {
      return {
        type: "success",
        icon: "🎉",
        title: "Excellent Performance!",
        message: "Outstanding collection rate with minimal overdue invoices.",
      };
    }
    if (overduePercentage >= 25) {
      return {
        type: "critical",
        icon: "🚨",
        title: "Action Required",
        message: "High overdue rate requires immediate follow-up attention.",
      };
    }
    if (overduePercentage >= 15) {
      return {
        type: "warning",
        icon: "⚠️",
        title: "Monitor Closely",
        message: "Overdue rate is above ideal threshold. Consider follow-ups.",
      };
    }
    if (awaitingPayment > paidCount) {
      return {
        type: "info",
        icon: "📊",
        title: "Cash Flow Focus",
        message: "Many invoices pending payment. Consider payment reminders.",
      };
    }
    if (draftCount > paidCount) {
      return {
        type: "info",
        icon: "✏️",
        title: "Processing Needed",
        message: "Multiple drafts ready to be sent to customers.",
      };
    }

    return {
      type: "neutral",
      icon: "✅",
      title: "Balanced Portfolio",
      message: "Invoice distribution looks healthy across all statuses.",
    };
  };

  const insight = getStatusInsight();

  return (
    <div className="h-full">
      {data.length > 0 && total > 0 ? (
        <div className="space-y-6">
          {/* Chart Section */}
          <div className="flex flex-col xl:flex-row xl:items-center gap-8">
            {/* Pie Chart */}
            <div className="flex-1">
              <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30 rounded-2xl"></div>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <defs>
                        {sortedData.map((entry, index) => (
                          <linearGradient
                            key={`gradient-${index}`}
                            id={`gradient-${entry.name}`}
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                          >
                            <stop
                              offset="0%"
                              stopColor={entry.fill}
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="100%"
                              stopColor={entry.fill}
                              stopOpacity={1}
                            />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={sortedData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={CustomLabel}
                        outerRadius={110}
                        innerRadius={45}
                        dataKey="value"
                        paddingAngle={3}
                        className="drop-shadow-sm"
                      >
                        {sortedData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`url(#gradient-${entry.name})`}
                            stroke="#ffffff"
                            strokeWidth={3}
                            className="hover:opacity-80 transition-opacity duration-200 cursor-pointer"
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Enhanced Legend and Stats */}
            <div className="xl:w-80 space-y-6">
              {/* Status Breakdown */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                  Status Breakdown
                </h4>

                <div className="space-y-4">
                  {sortedData.map((entry, index) => {
                    const percentage = ((entry.value / total) * 100).toFixed(1);
                    const statusName = entry.name as keyof typeof STATUS_COLORS;

                    return (
                      <div
                        key={index}
                        className="group p-3 rounded-xl hover:bg-slate-50 transition-all duration-200 border border-transparent hover:border-slate-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="relative">
                              <div
                                className="w-4 h-4 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-200"
                                style={{ backgroundColor: entry.fill }}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-slate-400">
                                {STATUS_ICONS[statusName]}
                              </div>
                              <span className="font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                                {entry.name}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-bold text-slate-900 text-lg">
                              {formatNumber(entry.value)}
                            </div>
                            <div className="text-sm text-slate-500">
                              {percentage}%
                            </div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-3 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${STATUS_GRADIENTS[statusName]} transition-all duration-500 ease-out`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <div className="text-center">
                  <div className="text-sm font-medium text-blue-700 mb-1">
                    Total Invoices
                  </div>
                  <div className="text-4xl font-bold text-blue-900 mb-2">
                    {formatNumber(total)}
                  </div>
                  <div className="text-sm text-blue-600">
                    Across all statuses
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Status Insight */}
          {insight && (
            <div
              className={`relative overflow-hidden rounded-2xl p-6 border-2 ${
                insight.type === "success"
                  ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200"
                  : insight.type === "critical"
                  ? "bg-gradient-to-br from-rose-50 to-red-50 border-rose-200"
                  : insight.type === "warning"
                  ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"
                  : insight.type === "info"
                  ? "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200"
                  : "bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">{insight.icon}</div>
                <div className="flex-1">
                  <h4
                    className={`font-bold text-lg mb-2 ${
                      insight.type === "success"
                        ? "text-emerald-900"
                        : insight.type === "critical"
                        ? "text-rose-900"
                        : insight.type === "warning"
                        ? "text-amber-900"
                        : insight.type === "info"
                        ? "text-blue-900"
                        : "text-slate-900"
                    }`}
                  >
                    {insight.title}
                  </h4>
                  <p
                    className={`text-sm leading-relaxed ${
                      insight.type === "success"
                        ? "text-emerald-700"
                        : insight.type === "critical"
                        ? "text-rose-700"
                        : insight.type === "warning"
                        ? "text-amber-700"
                        : insight.type === "info"
                        ? "text-blue-700"
                        : "text-slate-700"
                    }`}
                  >
                    {insight.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Quick Actions */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-6 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></div>
              Quick Actions
            </h4>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  status: "OVERDUE",
                  label: "View Overdue",
                  color: "rose",
                  icon: STATUS_ICONS.Overdue,
                },
                {
                  status: "SENT",
                  label: "View Pending",
                  color: "blue",
                  icon: STATUS_ICONS.Sent,
                },
                {
                  status: "DRAFT",
                  label: "View Drafts",
                  color: "slate",
                  icon: STATUS_ICONS.Draft,
                },
                {
                  status: "PAID",
                  label: "View Paid",
                  color: "emerald",
                  icon: STATUS_ICONS.Paid,
                },
              ].map((action, index) => (
                <button
                  key={index}
                  onClick={() =>
                    (window.location.href = `/dashboard/invoices?status=${action.status}`)
                  }
                  className={`group flex items-center gap-2 p-3 rounded-xl border-2 border-${action.color}-200 bg-${action.color}-50 hover:bg-${action.color}-100 hover:border-${action.color}-300 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-md`}
                >
                  <div
                    className={`text-${action.color}-600 group-hover:scale-110 transition-transform duration-200`}
                  >
                    {action.icon}
                  </div>
                  <span
                    className={`text-sm font-medium text-${action.color}-700 group-hover:text-${action.color}-800`}
                  >
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Enhanced Empty State */
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md">
            <div className="relative mb-8">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-slate-200 to-slate-300 rounded-3xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-16 h-16 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">📊</span>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              No Invoice Data
            </h3>
            <p className="text-slate-600 mb-8 leading-relaxed">
              No invoices found for the selected period. Create your first
              invoice to see detailed status distribution and insights.
            </p>

            <button
              onClick={() =>
                (window.location.href = "/dashboard/invoices/create")
              }
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
            >
              <svg
                className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Create Your First Invoice
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceStatusChart;

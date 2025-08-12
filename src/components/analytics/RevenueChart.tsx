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
  ComposedChart,
  Bar,
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
  // Enhanced tooltip component with beautiful styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const revenueData = payload[0];
      const invoiceData = revenueData.payload;

      return (
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-2xl p-5 min-w-[220px] transform transition-all duration-200">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full text-sm font-semibold">
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {label}
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-sm"></div>
                  <span className="text-sm font-medium text-slate-700">
                    Revenue
                  </span>
                </div>
                <span className="font-bold text-blue-700 text-lg">
                  {formatCurrency(revenueData.value)}
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full shadow-sm"></div>
                  <span className="text-sm font-medium text-slate-700">
                    Invoices
                  </span>
                </div>
                <span className="font-bold text-emerald-700 text-lg">
                  {formatNumber(invoiceData.invoices)}
                </span>
              </div>
            </div>

            {invoiceData.invoices > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    Avg per invoice
                  </span>
                  <span className="font-bold text-purple-700">
                    {formatCurrency(revenueData.value / invoiceData.invoices)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate comprehensive statistics
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalInvoices = data.reduce((sum, item) => sum + item.invoices, 0);
  const avgMonthlyRevenue = data.length > 0 ? totalRevenue / data.length : 0;

  // Calculate growth from first to last month
  const growth =
    data.length >= 2
      ? ((data[data.length - 1].revenue - data[0].revenue) / data[0].revenue) *
        100
      : 0;

  // Find best and worst performing months
  const bestMonth =
    data.length > 0
      ? data.reduce(
          (max, item) => (item.revenue > max.revenue ? item : max),
          data[0]
        )
      : null;

  const worstMonth =
    data.length > 0
      ? data.reduce(
          (min, item) => (item.revenue < min.revenue ? item : min),
          data[0]
        )
      : null;

  // Calculate trend direction for last 3 months
  const recentTrend =
    data.length >= 3
      ? (() => {
          const lastThree = data.slice(-3);
          const increases = lastThree
            .slice(1)
            .filter((month, i) => month.revenue > lastThree[i].revenue).length;
          return increases >= 2 ? "up" : increases === 1 ? "stable" : "down";
        })()
      : "stable";

  return (
    <div className="h-full">
      {data.length > 0 ? (
        <div className="space-y-6">
          {/* Header with Enhanced Stats */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-3 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Revenue Analytics
                  </h3>
                  <p className="text-slate-600">
                    Monthly performance and growth trends
                  </p>
                </div>
              </div>
            </div>

            {/* Growth Indicator */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                <div className="text-sm text-slate-600 mb-1">Period Growth</div>
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                      growth >= 5
                        ? "bg-emerald-100 text-emerald-700"
                        : growth >= 0
                        ? "bg-blue-100 text-blue-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {growth >= 0 ? (
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
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    ) : (
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
                          d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                        />
                      </svg>
                    )}
                    <span className="font-bold text-lg">
                      {growth >= 0 ? "+" : ""}
                      {growth.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Trend Indicator */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                <div className="text-sm text-slate-600 mb-1">Recent Trend</div>
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                      recentTrend === "up"
                        ? "bg-emerald-100 text-emerald-700"
                        : recentTrend === "stable"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {recentTrend === "up"
                      ? "📈"
                      : recentTrend === "stable"
                      ? "➡️"
                      : "📉"}
                    <span className="font-medium capitalize">
                      {recentTrend}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Legend with Enhanced Styling */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-4 border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-sm"></div>
                  <span className="font-medium text-slate-700">
                    Revenue Trend
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full shadow-sm"></div>
                  <span className="font-medium text-slate-700">
                    Invoice Volume
                  </span>
                </div>
              </div>
              <div className="text-sm text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200">
                Monthly Average:{" "}
                <span className="font-semibold text-slate-900">
                  {formatCurrency(avgMonthlyRevenue)}
                </span>
              </div>
            </div>
          </div>

          {/* Enhanced Chart Container */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="relative">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 rounded-2xl"></div>

              <div className="relative">
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart
                    data={data}
                    margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient
                        id="revenueGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                      <linearGradient
                        id="lineGradient"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e2e8f0"
                      opacity={0.6}
                      vertical={false}
                    />

                    <XAxis
                      dataKey="month"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                      dy={10}
                    />

                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={60}
                      tickFormatter={(value) => {
                        if (value >= 10000000)
                          return `₹${(value / 10000000).toFixed(1)}Cr`;
                        if (value >= 100000)
                          return `₹${(value / 100000).toFixed(1)}L`;
                        if (value >= 1000)
                          return `₹${(value / 1000).toFixed(0)}k`;
                        return `₹${value}`;
                      }}
                    />

                    <Tooltip content={<CustomTooltip />} />

                    {/* Area fill under the line */}
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="none"
                      fill="url(#revenueGradient)"
                    />

                    {/* Invoice count as bars */}
                    <Bar
                      dataKey="invoices"
                      fill="#10b981"
                      opacity={0.1}
                      radius={[2, 2, 0, 0]}
                      yAxisId="invoices"
                    />

                    {/* Main revenue line */}
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="url(#lineGradient)"
                      strokeWidth={3}
                      dot={{
                        fill: "#ffffff",
                        strokeWidth: 3,
                        r: 4,
                        stroke: "#3b82f6",
                      }}
                      activeDot={{
                        r: 6,
                        stroke: "#3b82f6",
                        strokeWidth: 3,
                        fill: "#ffffff",
                        className: "drop-shadow-lg",
                      }}
                      connectNulls={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Enhanced Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[
              {
                label: "Total Revenue",
                value: formatCurrency(totalRevenue),
                icon: (
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
                ),
                gradient: "from-emerald-500 to-teal-600",
                bgGradient: "from-emerald-50 to-teal-50",
                borderColor: "border-emerald-200",
              },
              {
                label: "Total Invoices",
                value: formatNumber(totalInvoices),
                icon: (
                  <svg
                    className="w-6 h-6"
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
                ),
                gradient: "from-blue-500 to-indigo-600",
                bgGradient: "from-blue-50 to-indigo-50",
                borderColor: "border-blue-200",
              },
              {
                label: "Best Month",
                value: bestMonth?.month || "N/A",
                subtitle: bestMonth ? formatCurrency(bestMonth.revenue) : "",
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                ),
                gradient: "from-amber-500 to-orange-600",
                bgGradient: "from-amber-50 to-orange-50",
                borderColor: "border-amber-200",
              },
              {
                label: "Monthly Average",
                value: formatCurrency(avgMonthlyRevenue),
                subtitle: `${data.length} months`,
                icon: (
                  <svg
                    className="w-6 h-6"
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
                ),
                gradient: "from-purple-500 to-pink-600",
                bgGradient: "from-purple-50 to-pink-50",
                borderColor: "border-purple-200",
              },
            ].map((stat, index) => (
              <div
                key={index}
                className={`group relative bg-gradient-to-br ${stat.bgGradient} rounded-2xl p-6 border-2 ${stat.borderColor} hover:shadow-xl transition-all duration-300 overflow-hidden`}
              >
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`p-3 bg-gradient-to-r ${stat.gradient} rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      {stat.icon}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-slate-600 mb-2">
                      {stat.label}
                    </h4>
                    <p className="text-2xl font-bold text-slate-900 mb-1">
                      {stat.value}
                    </p>
                    {stat.subtitle && (
                      <p className="text-sm text-slate-600">{stat.subtitle}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Enhanced Empty State */
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md">
            <div className="relative mb-8">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-100 to-indigo-200 rounded-3xl flex items-center justify-center shadow-xl">
                <svg
                  className="w-16 h-16 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                  />
                </svg>
              </div>
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">📊</span>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              No Revenue Data
            </h3>
            <p className="text-slate-600 mb-8 leading-relaxed">
              No revenue data available for the selected period. Create some
              invoices to see beautiful trends and analytics appear here.
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

export default RevenueChart;

"use client";

import { AnalyticsData } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface UseAnalyticsReturn {
  analyticsData: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  dateRange: "1month" | "3months" | "6months";
  setDateRange: (range: "1month" | "3months" | "6months") => void;
  refreshData: () => void;
  exportReport: () => void;
  isExporting: boolean;
  isClient: boolean;
}

export const useAnalytics = (): UseAnalyticsReturn => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<"1month" | "3months" | "6months">(
    "6months"
  );
  const [isExporting, setIsExporting] = useState(false);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/analytics?dateRange=${dateRange}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch analytics data");
      }

      const data = await response.json();
      setAnalyticsData(data.analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load analytics"
      );
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleDateRangeChange = useCallback(
    (newRange: "1month" | "3months" | "6months") => {
      setDateRange(newRange);
    },
    []
  );

  const refreshData = useCallback(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const exportReport = useCallback(async () => {
    if (!analyticsData) return;

    try {
      setIsExporting(true);

      const reportData = {
        title: `Analytics Report - ${dateRange
          .replace(/(\d+)/, "$1 ")
          .replace(/months?|month/, "Month(s)")}`,
        generatedAt: new Date().toISOString(),
        dateRange: {
          period: dateRange,
          startDate: analyticsData.startDate,
          endDate: analyticsData.endDate,
        },
        summary: {
          totalRevenue: analyticsData.totalRevenue,
          totalInvoices: analyticsData.totalInvoices,
          averageInvoice: analyticsData.averageInvoice,
          collectionRate: analyticsData.collectionRate,
          paidAmount: analyticsData.paidAmount,
          pendingAmount: analyticsData.pendingAmount,
          overdueAmount: analyticsData.overdueAmount,
        },
        growth: {
          revenueGrowth: analyticsData.revenueGrowth,
          invoiceGrowth: analyticsData.invoiceGrowth,
          avgInvoiceGrowth: analyticsData.avgInvoiceGrowth,
          collectionRateChange: analyticsData.collectionRateChange,
        },
        monthlyRevenue: analyticsData.monthlyRevenue,
        invoiceStatusBreakdown: analyticsData.invoiceStatus,
        topCustomers: analyticsData.topCustomers,
      };

      const csvContent = generateCSVReport(reportData);
      // Download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `analytics_report_${dateRange}_${
          new Date().toISOString().split("T")[0]
        }.csv`
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Also try to export as JSON for developers
      const jsonBlob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: "application/json;charset=utf-8;",
      });
      const jsonLink = document.createElement("a");
      const jsonUrl = URL.createObjectURL(jsonBlob);

      jsonLink.setAttribute("href", jsonUrl);
      jsonLink.setAttribute(
        "download",
        `analytics_report_${dateRange}_${
          new Date().toISOString().split("T")[0]
        }.json`
      );
      jsonLink.style.visibility = "hidden";

      document.body.appendChild(jsonLink);
      jsonLink.click();
      document.body.removeChild(jsonLink);
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("Failed to export report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, [analyticsData, dateRange]);

  return {
    analyticsData,
    error,
    loading,
    dateRange,
    setDateRange,
    refreshData,
    exportReport,
    isExporting,
    isClient,
  };
};

function generateCSVReport(data: any): string {
  const lines: string[] = [];

  // Header
  lines.push(`"Analytics Report"`);
  lines.push(`"Generated At","${new Date(data.generatedAt).toLocaleString()}"`);
  lines.push(`"Period","${data.dateRange.period}"`);
  lines.push(
    `"Date Range","${new Date(
      data.dateRange.startDate
    ).toLocaleDateString()} - ${new Date(
      data.dateRange.endDate
    ).toLocaleDateString()}"`
  );
  lines.push("");

  // Summary section
  lines.push('"SUMMARY"');
  lines.push('"Metric","Value"');
  lines.push(
    `"Total Revenue","₹${data.summary.totalRevenue.toLocaleString()}"`
  );
  lines.push(`"Total Invoices","${data.summary.totalInvoices}"`);
  lines.push(
    `"Average Invoice","₹${Math.round(
      data.summary.averageInvoice
    ).toLocaleString()}"`
  );
  lines.push(`"Collection Rate","${data.summary.collectionRate.toFixed(1)}%"`);
  lines.push(`"Paid Amount","₹${data.summary.paidAmount.toLocaleString()}"`);
  lines.push(
    `"Pending Amount","₹${data.summary.pendingAmount.toLocaleString()}"`
  );
  lines.push(
    `"Overdue Amount","₹${data.summary.overdueAmount.toLocaleString()}"`
  );
  lines.push("");

  // Growth section
  lines.push('"GROWTH RATES"');
  lines.push('"Metric","Growth %"');
  lines.push(`"Revenue Growth","${data.growth.revenueGrowth.toFixed(1)}%"`);
  lines.push(`"Invoice Growth","${data.growth.invoiceGrowth.toFixed(1)}%"`);
  lines.push(
    `"Avg Invoice Growth","${data.growth.avgInvoiceGrowth.toFixed(1)}%"`
  );
  lines.push(
    `"Collection Rate Change","${data.growth.collectionRateChange.toFixed(1)}%"`
  );
  lines.push("");

  // Monthly revenue
  lines.push('"MONTHLY REVENUE"');
  lines.push('"Month","Revenue","Invoices"');
  data.monthlyRevenue.forEach((item: any) => {
    lines.push(
      `"${item.month}","₹${item.revenue.toLocaleString()}","${item.invoices}"`
    );
  });
  lines.push("");

  // Invoice status
  lines.push('"INVOICE STATUS"');
  lines.push('"Status","Count"');
  data.invoiceStatusBreakdown.forEach((item: any) => {
    lines.push(`"${item.name}","${item.value}"`);
  });
  lines.push("");

  // Top customers
  lines.push('"TOP CUSTOMERS"');
  lines.push('"Rank","Name","Email","Revenue","Invoices","Status"');
  data.topCustomers.forEach((customer: any, index: number) => {
    lines.push(
      `"${index + 1}","${customer.name}","${
        customer.email
      }","₹${customer.amount.toLocaleString()}","${customer.invoices}","${
        customer.status
      }"`
    );
  });

  return lines.join("\n");
}

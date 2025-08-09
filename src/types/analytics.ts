export interface AnalyticsData {
  // Key metrics
  totalRevenue: number;
  totalInvoices: number;
  averageInvoice: number;
  collectionRate: number;

  // Growth rates (percentage)
  revenueGrowth: number;
  invoiceGrowth: number;
  avgInvoiceGrowth: number;
  collectionRateChange: number;

  // Amount breakdowns
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;

  // Chart data
  monthlyRevenue: MonthlyRevenueData[];
  invoiceStatus: InvoiceStatusData[];
  topCustomers: TopCustomerData[];

  // Meta data
  dateRange: string;
  startDate: string;
  endDate: string;
}

export interface MonthlyRevenueData {
  month: string;
  revenue: number;
  invoices: number;
}

export interface InvoiceStatusData {
  name: string;
  value: number;
}

export interface TopCustomerData {
  id: string;
  name: string;
  email: string;
  status: string;
  amount: number;
  invoices: number;
}

export interface AnalyticsFilters {
  dateRange: "1month" | "3months" | "6months";
  customStartDate?: string;
  customEndDate?: string;
}

export interface AnalyticsResponse {
  analytics: AnalyticsData;
}

// Additional analytics interfaces for future expansion
export interface RevenueBreakdown {
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  overdueRevenue: number;
  monthOverMonth: number;
  yearOverYear: number;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  topPayingCustomers: TopCustomerData[];
  customerGrowthRate: number;
  averageCustomerValue: number;
}

export interface InvoiceAnalytics {
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  draftInvoices: number;
  averageInvoiceValue: number;
  averagePaymentTime: number; // in days
  statusDistribution: InvoiceStatusData[];
}

export interface DateRangeOption {
  value: "1month" | "3months" | "6months";
  label: string;
  description: string;
}

export const DATE_RANGE_OPTIONS: DateRangeOption[] = [
  {
    value: "1month",
    label: "Last Month",
    description: "Data from the past 30 days",
  },
  {
    value: "3months",
    label: "Last 3 Months",
    description: "Data from the past 90 days",
  },
  {
    value: "6months",
    label: "Last 6 Months",
    description: "Data from the past 180 days",
  },
];

// Export utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPercentage = (value: number): string => {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("en-IN").format(value);
};

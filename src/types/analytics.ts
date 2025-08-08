export interface AnalyticsData {
  totalRevenue: number;
  totalInvoices: number;
  averageInvoice: number;
  collectionRate: number;
  monthlyRevenue: MonthlyRevenueData[];
  invoiceStatus: InvoiceStatusData[];
  topCustomers: TopCustomerData[];
  revenueGrowth: number;
  invoiceGrowth: number;
  avgInvoiceGrowth: number;
  collectionRateChange: number;
}

export interface MonthlyRevenueData {
  month: string;
  revenue: number;
  invoices: number;
}

export interface InvoiceStatusData {
  name: string;
  value: number;
  color?: string;
}

export interface TopCustomerData {
  id: string;
  name: string;
  email?: string;
  amount: number;
  invoices: number;
  status: string;
}

export interface RevenueBreakdown {
  paid: number;
  pending: number;
  overdue: number;
  draft: number;
}

export interface PaymentTrends {
  onTimePayments: number;
  latePayments: number;
  averagePaymentTime: number; // days
  paymentMethods: PaymentMethodData[];
}

export interface PaymentMethodData {
  method: string;
  count: number;
  amount: number;
}

export interface GeographicData {
  country: string;
  customers: number;
  revenue: number;
  averageInvoice: number;
}

export interface TimeSeriesData {
  date: string;
  revenue: number;
  invoices: number;
  customers: number;
}

export interface ComparisonData {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}

export interface AnalyticsFilters {
  dateRange:
    | "today"
    | "week"
    | "1month"
    | "3months"
    | "6months"
    | "1year"
    | "custom";
  startDate?: string;
  endDate?: string;
  customerId?: string;
  status?: string[];
  currency?: string;
}

export interface DashboardMetrics {
  revenue: {
    current: number;
    previous: number;
    growth: number;
  };
  invoices: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
  };
  customers: {
    total: number;
    active: number;
    new: number;
  };
  payments: {
    collected: number;
    outstanding: number;
    averageDays: number;
  };
}

export interface AdvancedAnalytics {
  customerLifetimeValue: number;
  churnRate: number;
  revenuePerCustomer: number;
  seasonalTrends: SeasonalTrendData[];
  profitMargins: ProfitMarginData[];
  forecastData: ForecastData[];
}

export interface SeasonalTrendData {
  period: string;
  revenue: number;
  trend: "up" | "down" | "stable";
}

export interface ProfitMarginData {
  category: string;
  revenue: number;
  costs: number;
  margin: number;
}

export interface ForecastData {
  period: string;
  predictedRevenue: number;
  confidence: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
  totalInvoices?: number;
  totalAmount?: number;
  lastInvoice: string;
  invoiceStats?: {
    paid: number;
    pending: number;
    draft: number;
  };
  averageInvoiceValue?: number;
  paymentHistory?: PaymentHistory[];
}

export interface PaymentHistory {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  status: "PAID" | "PENDING" | "OVERDUE" | "DRAFT" | "CANCELLED";
  dueDate: string;
  paidDate?: string;
}

export interface CustomerStats {
  totalRevenue: number;
  totalInvoices: number;
  averageInvoiceValue: number;
  onTimePayments: number;
  latePayments: number;
  outstandingAmount: number;
  lastPaymentDate?: string;
  creditScore?: number;
  topCustomer: {
    name: string;
    totalAmount: number;
  };
}

export interface CustomerFilters {
  status?: "Active" | "Inactive" | "all";
  search?: string;
  city?: string;
  state?: string;
  country?: string;
  minRevenue?: number;
  maxRevenue?: number;
  hasOutstanding?: boolean;
}

export interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  status: "Active" | "Inactive";
}

export interface CustomerListResponse {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  newCustomersThisMonth: number;
  topCustomersByRevenue: Customer[];
  customerGrowthRate: number;
  averageCustomerValue: number;
  customerRetentionRate: number;
}

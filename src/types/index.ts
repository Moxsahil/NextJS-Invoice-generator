export * from "./customer";
export * from "./analytics";

// Re-export common types
export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
  issueDate: string;
  dueDate: string;
  status: "DRAFT" | "SENT" | "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  terms?: string;
  createdAt: string;
  updatedAt: string;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: "admin" | "user";
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SortParams {
  field: string;
  direction: "asc" | "desc";
}

export interface SearchParams {
  query: string;
  fields?: string[];
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: ValidationError[];
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
}

// Settings types
export interface AppSettings {
  company: CompanySettings;
  invoice: InvoiceSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
}

export interface CompanySettings {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  website?: string;
  taxId?: string;
  logo?: string;
}

export interface InvoiceSettings {
  prefix: string;
  numberingStart: number;
  defaultTerms: string;
  defaultCurrency: string;
  defaultTaxRate: number;
  lateFeesEnabled: boolean;
  lateFeePercentage: number;
  autoReminders: boolean;
  reminderDays: number[];
}

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  invoicePaid: boolean;
  invoiceOverdue: boolean;
  newCustomer: boolean;
  monthlyReport: boolean;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  loginAlerts: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
  allowMultipleSessions: boolean;
}

// Theme and UI types
export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  };
}

export interface UIPreferences {
  theme: "light" | "dark" | "auto";
  sidebarCollapsed: boolean;
  dashboardLayout: "grid" | "list";
  dateFormat: string;
  timeFormat: "12h" | "24h";
  currency: string;
  language: string;
}

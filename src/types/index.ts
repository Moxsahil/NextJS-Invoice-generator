export * from "./customer";
export * from "./analytics";
export * from "./auth";
export * from "./invoice";
export * from "./user";

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
  notifications: NotificationSettings;
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

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  invoicePaid: boolean;
  invoiceOverdue: boolean;
  newCustomer: boolean;
  monthlyReport: boolean;
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

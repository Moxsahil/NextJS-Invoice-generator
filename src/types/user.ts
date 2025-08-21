export interface User {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  phone?: string;
  avatar?: string;
  timezone?: string;
  language?: string;
  companyDetails?: CompanyDetails;
  preferences?: UserPreferences;
}

export interface CompanyDetails {
  name: string;
  gstin?: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  bankDetails?: BankDetails;
  businessType?: BusinessType;
  incorporationDate?: Date;
}

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  branch?: string;
  accountType?: "savings" | "current";
}

export type BusinessType =
  | "sole_proprietorship"
  | "partnership"
  | "private_limited"
  | "public_limited"
  | "llp"
  | "freelancer"
  | "other";

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  currency: "INR" | "USD" | "EUR" | "GBP";
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  timezone: string;
  language: "en" | "hi" | "ta" | "te" | "bn";
  emailNotifications: EmailNotificationSettings;
  invoiceSettings: InvoiceSettings;
  dashboardLayout: DashboardLayout;
}

export interface EmailNotificationSettings {
  invoiceCreated: boolean;
  invoiceSent: boolean;
  invoicePaid: boolean;
  invoiceOverdue: boolean;
  paymentReceived: boolean;
  weeklyReport: boolean;
  monthlyReport: boolean;
  systemUpdates: boolean;
}

export interface InvoiceSettings {
  defaultGSTRate: number;
  autoGenerateNumber: boolean;
  numberPrefix: string;
  numberSuffix: string;
  defaultDueDays: number;
  defaultTemplate: string;
  defaultCurrency: string;
  includeQRCode: boolean;
  showBankDetails: boolean;
  autoSendReminders: boolean;
  reminderDays: number[];
}

export interface DashboardLayout {
  widgets: DashboardWidget[];
  layout: "grid" | "list";
  showQuickActions: boolean;
  showRecentInvoices: boolean;
  showStats: boolean;
  showChart: boolean;
}

export interface DashboardWidget {
  id: string;
  type: "stats" | "chart" | "recent_invoices" | "quick_actions" | "customers";
  position: { x: number; y: number; w: number; h: number };
  visible: boolean;
  settings?: Record<string, any>;
}

// User settings and profile management
export interface UpdateUserProfileData {
  name?: string;
  phone?: string;
  avatar?: string;
  timezone?: string;
  language?: string;
}

export interface UpdateCompanyDetailsData {
  name?: string;
  gstin?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  bankDetails?: BankDetails;
  businessType?: BusinessType;
  incorporationDate?: Date;
}

export interface UpdateUserPreferencesData {
  theme?: "light" | "dark" | "system";
  currency?: string;
  dateFormat?: string;
  timezone?: string;
  language?: string;
  emailNotifications?: Partial<EmailNotificationSettings>;
  invoiceSettings?: Partial<InvoiceSettings>;
  dashboardLayout?: Partial<DashboardLayout>;
}

// User statistics and analytics
export interface UserStats {
  totalInvoices: number;
  totalRevenue: number;
  totalCustomers: number;
  averageInvoiceAmount: number;
  monthlyRevenue: number;
  monthlyInvoiceCount: number;
  topCustomer: {
    name: string;
    totalAmount: number;
  };
  recentActivity: UserActivity[];
}

export interface UserActivity {
  id: string;
  type: ActivityType;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export type ActivityType =
  | "invoice_created"
  | "invoice_sent"
  | "invoice_paid"
  | "customer_added"
  | "payment_recorded"
  | "profile_updated"
  | "login"
  | "password_changed";

// User subscription and billing (for future premium features)
export interface UserSubscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: Date;
  endDate?: Date;
  autoRenew: boolean;
  // paymentMethod?: PaymentMethod
  createdAt: Date;
  updatedAt: Date;
  userStatus: UserSubscriptionStatus;
}

export interface UserSubscriptionStatus {
  subscriptionStatus: string;
  planId: string;
  trialEndsAt?: string;
  nextBillingDate?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  invoiceUsage: number;
  walletBalance: number;
}

export type SubscriptionPlan = "free" | "basic" | "pro" | "enterprise";
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "trial";

export interface SubscriptionFeatures {
  maxInvoicesPerMonth: number;
  maxCustomers: number;
  customTemplates: boolean;
  advancedReports: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  whiteLabel: boolean;
}

// User permissions and roles (for team features)
export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface UserWithRole extends User {
  role: UserRole;
  permissions: Permission[];
}

// Team and organization (for multi-user features)
export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  settings: OrganizationSettings;
  createdAt: Date;
  updatedAt: Date;
  members: OrganizationMember[];
}

export interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  role: UserRole;
  status: "active" | "invited" | "suspended";
  invitedBy?: string;
  joinedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

export interface OrganizationSettings {
  allowMemberInvites: boolean;
  requireApprovalForInvites: boolean;
  defaultRole: string;
  billingEmail: string;
  companyDetails: CompanyDetails;
}

// API response types
export interface UserApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UserProfileResponse extends UserApiResponse<UserProfile> {}
export interface UserStatsResponse extends UserApiResponse<UserStats> {}
export interface UserActivitiesResponse
  extends UserApiResponse<{
    activities: UserActivity[];
    total: number;
    page: number;
    pageSize: number;
  }> {}

// Form data types
export interface UserProfileFormData {
  name: string;
  email: string;
  phone: string;
  timezone: string;
  language: string;
}

export interface CompanyDetailsFormData {
  name: string;
  gstin: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  businessType: BusinessType;
  incorporationDate: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    branch: string;
    accountType: "savings" | "current";
  };
}

export interface UserPreferencesFormData {
  theme: "light" | "dark" | "system";
  currency: string;
  dateFormat: string;
  timezone: string;
  language: string;
  defaultGSTRate: number;
  autoGenerateNumber: boolean;
  numberPrefix: string;
  defaultDueDays: number;
  emailNotifications: {
    [K in keyof EmailNotificationSettings]: boolean;
  };
}

// Validation types
export interface UserValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface UserFormErrors {
  [key: string]: string | UserFormErrors;
}

// Hook return types
export interface UseUserReturn {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;

  // Profile management
  updateProfile: (data: UpdateUserProfileData) => Promise<boolean>;
  updateCompanyDetails: (data: UpdateCompanyDetailsData) => Promise<boolean>;
  updatePreferences: (data: UpdateUserPreferencesData) => Promise<boolean>;
  uploadAvatar: (file: File) => Promise<string | null>;

  // Statistics
  getStats: () => Promise<UserStats | null>;
  getActivities: (page?: number, pageSize?: number) => Promise<UserActivity[]>;

  // Utilities
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

// Component prop types
export interface UserProfileProps {
  user: UserProfile;
  onUpdate: (data: UpdateUserProfileData) => Promise<void>;
  loading?: boolean;
}

export interface CompanyDetailsProps {
  companyDetails: CompanyDetails;
  onUpdate: (data: UpdateCompanyDetailsData) => Promise<void>;
  loading?: boolean;
}

export interface UserPreferencesProps {
  preferences: UserPreferences;
  onUpdate: (data: UpdateUserPreferencesData) => Promise<void>;
  loading?: boolean;
}

export interface UserStatsProps {
  stats: UserStats;
  loading?: boolean;
}

// File upload types
export interface AvatarUploadData {
  file: File;
  userId: string;
}

export interface LogoUploadData {
  file: File;
  companyId: string;
}

export interface FileUploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

// Security and privacy
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginNotifications: boolean;
  sessionTimeout: number; // in minutes
  allowedIPs: string[];
  lastPasswordChange: Date;
  lastLogin: Date;
  failedLoginAttempts: number;
  accountLocked: boolean;
  lockedUntil?: Date;
}

export interface PrivacySettings {
  profileVisibility: "public" | "private";
  allowDataExport: boolean;
  allowDataDeletion: boolean;
  marketingEmails: boolean;
  analyticsTracking: boolean;
  cookiePreferences: CookiePreferences;
}

export interface CookiePreferences {
  necessary: boolean; // Always true, cannot be disabled
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

// Account management
export interface AccountDeletionRequest {
  userId: string;
  reason?: string;
  scheduledFor: Date;
  confirmationToken: string;
  createdAt: Date;
}

export interface DataExportRequest {
  userId: string;
  format: "json" | "csv";
  status: "pending" | "processing" | "completed" | "failed";
  downloadUrl?: string;
  expiresAt?: Date;
  createdAt: Date;
  completedAt?: Date;
}

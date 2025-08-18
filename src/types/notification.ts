export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  isRead: boolean;
  userId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export enum NotificationType {
  SUCCESS = "SUCCESS",
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
}

export enum NotificationCategory {
  INVOICE_CREATED = "INVOICE_CREATED",
  INVOICE_SENT = "INVOICE_SENT",
  INVOICE_PAID = "INVOICE_PAID",
  INVOICE_OVERDUE = "INVOICE_OVERDUE",
  PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  NEW_CUSTOMER = "NEW_CUSTOMER",
  CUSTOMER_UPDATED = "CUSTOMER_UPDATED",
  SYSTEM_UPDATE = "SYSTEM_UPDATE",
  SECURITY_ALERT = "SECURITY_ALERT",
}

export interface CreateNotificationData {
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  userId: string;
  metadata?: Record<string, any>;
}

export interface NotificationSettings {
  invoiceCreated: boolean;
  invoiceSent: boolean;
  invoicePaid: boolean;
  invoiceOverdue: boolean;
  paymentReceived: boolean;
  paymentFailed: boolean;
  newCustomer: boolean;
  customerUpdated: boolean;
  systemUpdates: boolean;
  securityAlerts: boolean;
  browserNotifications: boolean;
  emailNotifications: boolean;
}

export interface RealtimeNotificationEvent {
  type: 'notification';
  data: Notification;
}
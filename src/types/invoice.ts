export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  invoiceId: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  companyName: string;
  companyGSTIN?: string;
  companyAddress: string;
  companyPhone?: string;
  customerName: string;
  customerGSTIN?: string;
  customerAddress: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  sgstAmount: number;
  cgstAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
  userId: string;
  items: InvoiceItem[];
}

export enum InvoiceStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  PENDING = "PENDING",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
}

export interface CreateInvoiceRequest {
  invoiceNumber: string;
  companyName: string;
  companyGSTIN?: string;
  companyAddress: string;
  companyPhone?: string;
  customerName: string;
  customerGSTIN?: string;
  customerAddress: string;
  invoiceDate: string;
  dueDate: string;
  items: CreateInvoiceItem[];
}

export interface CreateInvoiceItem {
  description: string;
  quantity: number;
  rate: number;
}

export interface InvoiceResponse {
  invoice: Invoice;
}

export interface InvoicesResponse {
  invoices: Invoice[];
}

export interface InvoiceFilters {
  searchTerm?: string;
  status?: InvoiceStatus | "ALL";
  dateFrom?: string;
  dateTo?: string;
}

export interface InvoiceSummary {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
}

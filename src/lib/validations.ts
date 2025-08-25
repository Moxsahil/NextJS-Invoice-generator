import { z } from "zod";

export const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive("Quantity must be positive"),
  rate: z.number().positive("Rate must be positive"),
});

export const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  companyName: z.string().min(1, "Company name is required"),
  companyGSTIN: z.string().optional(),
  companyAddress: z.string().min(1, "Company address is required"),
  companyPhone: z.string().optional(),
  customerName: z.string().min(1, "Customer name is required"),
  customerGSTIN: z.string().optional(),
  customerAddress: z.string().min(1, "Customer address is required"),
  invoiceDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid invoice date",
  }),
  dueDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid due date",
  }),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "PENDING", "PAID", "OVERDUE"]),
});

export type UserInput = z.infer<typeof userSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
export type UpdateInvoiceStatusInput = z.infer<
  typeof updateInvoiceStatusSchema
>;

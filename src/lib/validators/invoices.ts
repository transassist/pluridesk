import { z } from "zod";

export const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive("Quantity must be positive"),
  rate: z.number().positive("Rate must be positive"),
  amount: z.number(),
});

export const invoiceFormSchema = z.object({
  client_id: z.string().uuid("Please select a client"),
  invoice_number: z.string().min(1, "Invoice number is required"),
  date: z.string().optional(),
  due_date: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  subtotal: z.number(),
  tax_amount: z.number().optional().or(z.literal(0)),
  total: z.number(),
  currency: z.enum(["USD", "EUR", "CAD", "MAD", "GBP"]).default("USD"),
  notes: z.string().optional(),
  status: z.enum(["draft", "sent", "paid", "overdue"]).default("draft"),
});

export type InvoiceFormData = z.infer<typeof invoiceFormSchema>;
export type InvoiceItem = z.infer<typeof invoiceItemSchema>;


import { z } from "zod";

export const outsourcingFormSchema = z.object({
  job_id: z.string().uuid("Please select a job"),
  supplier_id: z.string().uuid("Please select a supplier"),
  supplier_rate: z.number().positive("Rate must be positive").optional().or(z.literal(0)),
  supplier_currency: z.enum(["USD", "EUR", "CAD", "MAD", "GBP"]).default("USD"),
  supplier_total: z.number().positive("Total must be positive").optional().or(z.literal(0)),
  paid: z.boolean().default(false),
  supplier_invoice_url: z.string().optional(),
  notes: z.string().optional(),
  // New fields
  service_type: z.string().optional(),
  unit: z.string().optional(),
  quantity: z.number().optional(),
  source_language: z.string().optional(),
  target_language: z.string().optional(),
  start_date: z.string().optional(),
  due_date: z.string().optional(),
  delivery_date: z.string().optional(),
  status: z.enum(["pending", "assigned", "in_progress", "delivered", "completed", "cancelled"]).default("pending"),
});

export type OutsourcingFormData = z.infer<typeof outsourcingFormSchema>;

// Status options for UI dropdowns
export const OUTSOURCING_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

// Unit options for UI dropdowns
export const OUTSOURCING_UNITS = [
  { value: "word", label: "Word" },
  { value: "hour", label: "Hour" },
  { value: "page", label: "Page" },
  { value: "project", label: "Project" },
  { value: "file", label: "File" },
] as const;

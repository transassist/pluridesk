import { z } from "zod";

export const supplierFormSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  friendly_name: z.string().optional(),
  contact_name: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  secondary_email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  secondary_phone: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  vat_number: z.string().optional(),
  timezone: z.string().optional(),
  specialization: z.string().optional(),
  payment_method: z.string().optional(),
  payment_terms: z.string().optional(),
  default_currency: z.enum(["USD", "EUR", "CAD", "MAD", "GBP"]).default("USD"),
  currency: z.enum(["USD", "EUR", "CAD", "MAD", "GBP"]).optional(), // Supplier specific currency
  minimum_fee: z.number().min(0).optional().nullable(),
  tax_rate: z.number().min(0).optional().nullable(),
  po_filename_format: z.string().optional(),
  cat_tool: z.string().optional(),
  default_rate_word: z
    .number()
    .positive("Rate must be positive")
    .optional()
    .or(z.literal(0))
    .nullable(),
  default_rate_hour: z
    .number()
    .positive("Rate must be positive")
    .optional()
    .or(z.literal(0))
    .nullable(),
  default_rate_project: z
    .number()
    .positive("Rate must be positive")
    .optional()
    .or(z.literal(0))
    .nullable(),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().optional(),
});

export type SupplierFormData = z.infer<typeof supplierFormSchema>;


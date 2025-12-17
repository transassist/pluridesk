import { z } from "zod";

export const clientFormSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  contact_name: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  vat_number: z.string().optional(),
  tax_id: z.string().optional(),
  document_language: z.string().optional(),
  default_currency: z.enum(["USD", "EUR", "CAD", "MAD", "GBP"]).default("USD"),
  default_payment_terms: z.string().optional(),
  default_taxes: z.coerce.number().optional(),
  minimum_fee: z.coerce.number().optional(),
  default_file_naming: z.string().optional(),
  quote_validity: z.coerce.number().optional(),
  cat_tool_preferences: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  notes: z.string().optional(),
});

export type ClientFormData = z.infer<typeof clientFormSchema>;


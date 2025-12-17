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
});

export type OutsourcingFormData = z.infer<typeof outsourcingFormSchema>;


import { z } from "zod";

export const userSettingsFormSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  company_name: z.string().optional(),
  address: z.string().optional(),
  currency_default: z.enum(["USD", "EUR", "CAD", "MAD", "GBP"]).default("USD"),
  logo_url: z.string().optional(),
});

export type UserSettingsFormData = z.infer<typeof userSettingsFormSchema>;


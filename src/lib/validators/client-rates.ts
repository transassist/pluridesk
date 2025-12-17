import { z } from "zod";

export const rateFormSchema = z.object({
    service_type: z.string().min(1, "Service type is required"),
    source_language: z.string().optional(),
    target_language: z.string().optional(),
    unit: z.string().min(1, "Unit is required"),
    rate: z.coerce.number().min(0, "Rate must be positive"),
    currency: z.string().min(1, "Currency is required"),
});

export type RateFormValues = z.infer<typeof rateFormSchema>;

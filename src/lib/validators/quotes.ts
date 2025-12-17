import { z } from "zod";

export const quoteItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive("Quantity must be positive"),
  rate: z.number().positive("Rate must be positive"),
  amount: z.number(),
});

export const quoteFormSchema = z.object({
  client_id: z.string().uuid("Please select a client"),
  quote_number: z.string().min(1, "Quote number is required"),
  date: z.string().optional(),
  expiry_date: z.string().optional(),
  items: z.array(quoteItemSchema).min(1, "At least one item is required"),
  currency: z.enum(["USD", "EUR", "CAD", "MAD", "GBP"]).default("USD"),
  notes: z.string().optional(),
  status: z.enum(["draft", "sent", "accepted", "rejected"]).default("draft"),
});

export type QuoteFormData = z.infer<typeof quoteFormSchema>;
export type QuoteItem = z.infer<typeof quoteItemSchema>;


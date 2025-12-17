import { z } from "zod";

export const expenseFormSchema = z.object({
  date: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  amount: z.number().positive("Amount must be positive"),
  currency: z.enum(["USD", "EUR", "CAD", "MAD", "GBP"]).default("USD"),
  supplier_name: z.string().optional(),
  supplier_id: z.string().optional(),
  file_url: z.string().optional(),
  id: z.string().optional(),
  notes: z.string().optional(),
});

export type ExpenseFormData = z.infer<typeof expenseFormSchema>;

export const EXPENSE_CATEGORIES = [
  "Software",
  "Hardware",
  "Office Supplies",
  "Marketing",
  "Travel",
  "Training",
  "Legal",
  "Accounting",
  "Insurance",
  "Utilities",
  "Rent",
  "Other",
] as const;


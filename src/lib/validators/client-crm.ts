import { z } from "zod";

export const contactFormSchema = z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    phone: z.string().optional(),
    role: z.string().optional(),
    is_primary: z.boolean().default(false),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

export const activityFormSchema = z.object({
    type: z.enum(["call", "email", "meeting", "note"]),
    subject: z.string().min(1, "Subject is required"),
    description: z.string().optional(),
    date: z.string().optional(), // ISO string
    status: z.enum(["done", "todo"]).default("done"),
});

export type ActivityFormValues = z.infer<typeof activityFormSchema>;

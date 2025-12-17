import { z } from "zod";

const serverSchema = z.object({
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    SUPABASE_JWT_SECRET: z.string().min(1),
    SUPABASE_DB_PASSWORD: z.string().min(1),
    PLURIDESK_OWNER_ID: z.string().uuid(),
});

export const serverEnv = serverSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
    SUPABASE_DB_PASSWORD: process.env.SUPABASE_DB_PASSWORD,
    PLURIDESK_OWNER_ID: process.env.PLURIDESK_OWNER_ID,
});

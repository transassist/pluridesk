"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./types";
import { clientEnv } from "@/lib/env.client";

export const createSupabaseBrowserClient = () =>
  createBrowserClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );


export const createClient = createSupabaseBrowserClient;

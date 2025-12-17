import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env.server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", serverEnv.PLURIDESK_OWNER_ID)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("users")
    .update(body)
    .eq("id", serverEnv.PLURIDESK_OWNER_ID)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}


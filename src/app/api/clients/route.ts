import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env.server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*, jobs(count)")
    .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ clients: data });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const supabase = createServiceRoleClient();
  const body = {
    ...payload,
    owner_id: serverEnv.PLURIDESK_OWNER_ID,
  };
  const { data, error } = await supabase.from("clients").insert(body).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ client: data }, { status: 201 });
}


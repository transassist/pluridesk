import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env.server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ suppliers: data });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const supabase = createServiceRoleClient();

  // Process payload to convert specialization string to array
  const { specialization, ...rest } = payload;
  const processedPayload = { ...rest };

  if (typeof specialization === 'string') {
    processedPayload.specialization = specialization.split(',').map((s: string) => s.trim()).filter(Boolean);
  } else if (Array.isArray(specialization)) {
    processedPayload.specialization = specialization;
  }

  const body = {
    ...processedPayload,
    owner_id: serverEnv.PLURIDESK_OWNER_ID,
  };
  const { data, error } = await supabase
    .from("suppliers")
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ supplier: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const payload = await request.json();
  const supabase = createServiceRoleClient();

  // Process payload to convert specialization string to array
  const { specialization, ...rest } = payload;
  const processedPayload = { ...rest };

  if (typeof specialization === 'string') {
    processedPayload.specialization = specialization.split(',').map((s: string) => s.trim()).filter(Boolean);
  } else if (Array.isArray(specialization)) {
    processedPayload.specialization = specialization;
  }

  const { data, error } = await supabase
    .from("suppliers")
    .update(processedPayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ supplier: data });
}


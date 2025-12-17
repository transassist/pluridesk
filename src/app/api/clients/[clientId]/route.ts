import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env.server";
import { createServiceRoleClient } from "@/lib/supabase/server";



const OWNER_FILTER = { column: "owner_id", value: serverEnv.PLURIDESK_OWNER_ID };

export async function GET(_request: Request, props: { params: Promise<{ clientId: string }> }) {
  const params = await props.params;
  const supabase = createServiceRoleClient();
  const { clientId } = params;

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .eq(OWNER_FILTER.column, OWNER_FILTER.value)
    .single();

  if (clientError) {
    const status = clientError.message === "Row not found" ? 404 : 500;
    return NextResponse.json({ error: clientError.message }, { status });
  }

  const [jobsResult, invoicesResult, quotesResult] = await Promise.all([
    supabase
      .from("jobs")
      .select("*")
      .eq("client_id", clientId)
      .eq(OWNER_FILTER.column, OWNER_FILTER.value)
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("*")
      .eq("client_id", clientId)
      .eq(OWNER_FILTER.column, OWNER_FILTER.value)
      .order("date", { ascending: false }),
    supabase
      .from("quotes")
      .select("*")
      .eq("client_id", clientId)
      .eq(OWNER_FILTER.column, OWNER_FILTER.value)
      .order("date", { ascending: false }),
  ]);

  if (jobsResult.error || invoicesResult.error || quotesResult.error) {
    const message =
      jobsResult.error?.message ||
      invoicesResult.error?.message ||
      quotesResult.error?.message ||
      "Unable to load client relations";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({
    client,
    jobs: jobsResult.data ?? [],
    invoices: invoicesResult.data ?? [],
    quotes: quotesResult.data ?? [],
  });
}

export async function PATCH(request: Request, props: { params: Promise<{ clientId: string }> }) {
  const params = await props.params;
  const supabase = createServiceRoleClient();
  const { clientId } = params;
  const payload = await request.json();

  const { data, error } = await supabase
    .from("clients")
    .update({
      ...payload,
      owner_id: OWNER_FILTER.value,
    })
    .eq("id", clientId)
    .eq(OWNER_FILTER.column, OWNER_FILTER.value)
    .select()
    .single();

  if (error) {
    const status = error.message === "Row not found" ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ client: data });
}

export async function DELETE(_request: Request, props: { params: Promise<{ clientId: string }> }) {
  const params = await props.params;
  const supabase = createServiceRoleClient();
  const { clientId } = params;

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId)
    .eq(OWNER_FILTER.column, OWNER_FILTER.value);

  if (error) {
    const status = error.message === "Row not found" ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ success: true });
}



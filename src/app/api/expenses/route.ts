import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env.server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "10");
  const category = searchParams.get("category");
  const supplierId = searchParams.get("supplier_id");
  const fromDate = searchParams.get("from");
  const toDate = searchParams.get("to");
  const search = searchParams.get("search");

  const supabase = createServiceRoleClient();
  let query = supabase
    .from("expenses")
    .select("*", { count: "exact" })
    .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID);

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  if (supplierId && supplierId !== "all") {
    query = query.eq("supplier_id", supplierId);
  }

  if (fromDate) {
    query = query.gte("date", fromDate);
  }

  if (toDate) {
    query = query.lte("date", toDate);
  }

  if (search) {
    query = query.or(`notes.ilike.%${search}%,supplier_name.ilike.%${search}%`);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query
    .order("date", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    expenses: data,
    meta: {
      page,
      limit,
      total: count,
      totalPages: count ? Math.ceil(count / limit) : 0,
    },
  });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const supabase = createServiceRoleClient();
  const body = {
    ...payload,
    owner_id: serverEnv.PLURIDESK_OWNER_ID,
  };
  const { data, error } = await supabase.from("expenses").insert(body).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ expense: data }, { status: 201 });
}


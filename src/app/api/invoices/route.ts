
import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env.server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "all";
  // const sort = searchParams.get("sort") ?? "date";
  // const order = searchParams.get("order") ?? "desc";

  const supabase = createServiceRoleClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("invoices") as any)
    .select("*", { count: "exact" })
    .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID);

  // Apply filters
  if (status && status !== "all") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = query.eq("status", status as any);
  }

  if (search) {
    // Search by invoice number or client name
    // First, find clients matching the search term
    const { data: matchingClients } = await supabase
      .from("clients")
      .select("id")
      .ilike("name", `% ${search}% `);

    const clientIds = matchingClients?.map((c) => c.id) || [];

    if (clientIds.length > 0) {
      query = query.or(`invoice_number.ilike.% ${search}%, client_id.in.(${clientIds.join(",")})`);
    } else {
      query = query.ilike("invoice_number", `% ${search}% `);
    }
  }

  // Apply sorting
  query = query.order("invoice_number", { ascending: false });

  // Apply pagination
  query = query.range(from, to);

  const { data: invoices, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Calculate summaries (separate query to get totals across all pages)
  // We need to respect the same filters but without pagination
  let summaryQuery = supabase
    .from("invoices")
    .select("total, status, currency")
    .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID);

  if (status && status !== "all") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    summaryQuery = summaryQuery.eq("status", status as any);
  }
  if (search) {
    // Same search logic for summary
    const { data: matchingClients } = await supabase
      .from("clients")
      .select("id")
      .ilike("name", `% ${search}% `);

    const clientIds = matchingClients?.map((c) => c.id) || [];

    if (clientIds.length > 0) {
      summaryQuery = summaryQuery.or(`invoice_number.ilike.% ${search}%, client_id.in.(${clientIds.join(",")})`);
    } else {
      summaryQuery = summaryQuery.ilike("invoice_number", `% ${search}% `);
    }
  }

  const { data: summaryData, error: summaryError } = await summaryQuery;

  if (summaryError) {
    console.error("Summary error:", summaryError);
    // Continue without summary if it fails, or handle error
  }

  // Aggregate summaries
  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / limit);

  const outstandingByCurrency: Record<string, number> = {};
  const collectedByCurrency: Record<string, number> = {};
  const draftByCurrency: Record<string, number> = {};

  summaryData?.forEach((inv) => {
    const currency = inv.currency ?? "USD";
    const amount = inv.total ?? 0;

    if (inv.status === "sent" || inv.status === "overdue") {
      outstandingByCurrency[currency] = (outstandingByCurrency[currency] ?? 0) + amount;
    }
    if (inv.status === "paid") {
      collectedByCurrency[currency] = (collectedByCurrency[currency] ?? 0) + amount;
    }
    if (inv.status === "draft") {
      draftByCurrency[currency] = (draftByCurrency[currency] ?? 0) + amount;
    }
  });

  return NextResponse.json({
    invoices,
    metadata: {
      page,
      limit,
      total: totalCount,
      totalPages,
    },
    summary: {
      outstanding: outstandingByCurrency,
      collected: collectedByCurrency,
      draft: draftByCurrency,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("invoices") as any)
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invoice: data }, { status: 201 });
}


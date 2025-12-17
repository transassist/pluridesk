import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env.server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = parseInt(searchParams.get("limit") ?? "20");
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "all";
  const clientId = searchParams.get("client_id") ?? "all";
  const outsourcing = searchParams.get("outsourcing") ?? "all";
  const sortColumn = searchParams.get("sort") ?? "created_at";
  const sortDirection = searchParams.get("order") ?? "desc";

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("jobs")
    .select("*, clients(name)", { count: "exact" })
    .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID);

  // Apply filters
  if (status !== "all") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = query.eq("status", status as any);
  }

  if (clientId !== "all") {
    query = query.eq("client_id", clientId);
  }

  if (outsourcing === "with_outsourcing") {
    query = query.eq("has_outsourcing", true);
  }

  if (search) {
    // Search in title or job_code
    query = query.or(`title.ilike.%${search}%,job_code.ilike.%${search}%`);
  }

  // Apply sorting
  // Handle special case for client name sorting if needed, but for now stick to job fields
  // or use a join-compatible sort if Supabase supports it easily (it's tricky with foreign tables).
  // For MVP, if sortColumn is 'client', we might default to created_at or handle it differently.
  // Let's stick to simple column sorting for now.
  if (sortColumn === "client") {
    // Client sorting is hard on server-side without a view or complex join order. 
    // Fallback to created_at for now or keep it simple.
    query = query.order("created_at", { ascending: sortDirection === "asc" });
  } else {
    query = query.order(sortColumn, { ascending: sortDirection === "asc" });
  }

  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    jobs: data,
    metadata: {
      page,
      limit: pageSize,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / pageSize)
    }
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = createServiceRoleClient();
  const payload = {
    ...body,
    owner_id: serverEnv.PLURIDESK_OWNER_ID,
  };
  const { data, error } = await supabase
    .from("jobs")
    .insert(payload)
    .select("*, clients(name)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ job: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // Remove client_id if it's not meant to be changed or handle it carefully
  // For now, we allow updating everything provided in body
  const { data, error } = await supabase
    .from("jobs")
    .update(body)
    .eq("id", id)
    .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID)
    .select("*, clients(name)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ job: data });
}


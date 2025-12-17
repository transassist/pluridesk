import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env.server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("outsourcing")
    .select("*, suppliers(name), jobs(job_code, title)")
    .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ outsourcing: data });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const supabase = createServiceRoleClient();
  const body = {
    ...payload,
    owner_id: serverEnv.PLURIDESK_OWNER_ID,
  };
  const { data, error } = await supabase
    .from("outsourcing")
    .insert(body)
    .select("*, suppliers(name), jobs(job_code, title)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update job has_outsourcing flag
  if (payload.job_id) {
    await supabase
      .from("jobs")
      .update({ has_outsourcing: true })
      .eq("id", payload.job_id);
  }

  return NextResponse.json({ outsourcing: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  const payload = await request.json();
  const supabase = createServiceRoleClient();

  // Remove fields that shouldn't be updated directly
  const { id: _id, owner_id: _owner, created_at: _created, ...updateData } = payload;

  const { data, error } = await supabase
    .from("outsourcing")
    .update(updateData)
    .eq("id", id)
    .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID)
    .select("*, suppliers(name), jobs(job_code, title)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ outsourcing: data });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // Get the job_id before deleting to check if we need to update has_outsourcing
  const { data: outsourcingRecord } = await supabase
    .from("outsourcing")
    .select("job_id")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("outsourcing")
    .delete()
    .eq("id", id)
    .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Check if there are any remaining outsourcing records for this job
  if (outsourcingRecord?.job_id) {
    const { count } = await supabase
      .from("outsourcing")
      .select("*", { count: "exact", head: true })
      .eq("job_id", outsourcingRecord.job_id);

    // If no more outsourcing records, update job flag
    if (count === 0) {
      await supabase
        .from("jobs")
        .update({ has_outsourcing: false })
        .eq("id", outsourcingRecord.job_id);
    }
  }

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/env.server";
import { createServiceRoleClient } from "@/lib/supabase/server";

// GET: Fetch all notifications
export async function GET() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notifications: data });
}

// PATCH: Mark notification as read
export async function PATCH(request: NextRequest) {
  const { id, read } = await request.json();

  if (!id) {
    return NextResponse.json(
      { error: "Notification id is required" },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("notifications")
    .update({ read: read ?? true })
    .eq("id", id)
    .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notification: data });
}

// DELETE: Delete notification
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Notification id is required" },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id)
    .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}


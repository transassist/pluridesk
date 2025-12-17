import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env.server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function DELETE(request: Request) {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "Invalid request: ids array required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const { error } = await supabase
        .from("jobs")
        .delete()
        .in("id", ids)
        .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
    const body = await request.json();
    const { ids, status } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0 || !status) {
        return NextResponse.json({ error: "Invalid request: ids array and status required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const { error } = await supabase
        .from("jobs")
        .update({ status })
        .in("id", ids)
        .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

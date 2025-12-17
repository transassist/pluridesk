import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env.server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("id", id)
        .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ expense: data });
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const payload = await request.json();
    const supabase = createServiceRoleClient();

    // Prevent updating owner_id
    delete payload.owner_id;
    delete payload.id;
    delete payload.created_at;

    const { data, error } = await supabase
        .from("expenses")
        .update(payload)
        .eq("id", id)
        .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ expense: data });
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = createServiceRoleClient();
    const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id)
        .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

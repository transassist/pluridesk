import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env.server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = createServiceRoleClient();

    const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .select("*, clients(*), owner:users!quotes_owner_id_fkey(*)")
        .eq("id", id)
        .single();

    if (quoteError) {
        return NextResponse.json({ error: quoteError.message }, { status: 500 });
    }

    const { data: items, error: itemsError } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("quote_items" as any)
        .select("*")
        .eq("quote_id", id);

    if (itemsError) {
        return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    return NextResponse.json({ quote, items });
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();
    const supabase = createServiceRoleClient();

    const { error } = await supabase
        .from("quotes")
        .update(body)
        .eq("id", id)
        .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = createServiceRoleClient();

    const { error } = await supabase
        .from("quotes")
        .delete()
        .eq("id", id)
        .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

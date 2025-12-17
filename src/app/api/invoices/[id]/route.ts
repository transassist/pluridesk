import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";


export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = createServiceRoleClient();

    const { data: invoice, error } = await supabase
        .from("invoices")
        .select(`
      *,
      clients (*),
      payments (*)
    `)
        .eq("id", id)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invoice });
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const payload = await request.json();
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
        .from("invoices")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invoice: data });
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = createServiceRoleClient();

    const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}


import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env.server";

export async function GET(
    request: Request,
    props: { params: Promise<{ supplierId: string }> }
) {
    try {
        const params = await props.params;
        const supabase = createServiceRoleClient();
        const { supplierId } = params;

        const { data, error } = await supabase
            .from("supplier_domains")
            .select("*")
            .eq("supplier_id", supplierId)
            .order("created_at", { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ domains: data });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    props: { params: Promise<{ supplierId: string }> }
) {
    try {
        const params = await props.params;
        const supabase = createServiceRoleClient();
        const { supplierId } = params;
        const payload = await request.json();

        const ownerId = serverEnv.PLURIDESK_OWNER_ID;

        const { error } = await supabase
            .from("supplier_domains")
            .insert({
                domain: payload.domain,
                supplier_id: supplierId,
                owner_id: ownerId,
            });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request
) {
    try {
        const supabase = createServiceRoleClient();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing id" }, { status: 400 });
        }

        const { error } = await supabase
            .from("supplier_domains")
            .delete()
            .eq("id", id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

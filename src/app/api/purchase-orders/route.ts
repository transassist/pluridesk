import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env.server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const supplierId = searchParams.get("supplier_id");
    const search = searchParams.get("search");

    const supabase = createServiceRoleClient();
    let query = supabase
        .from("purchase_orders")
        .select("*, jobs(job_code, title), outsourcing(*)", { count: "exact" })
        .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID);

    if (supplierId && supplierId !== "all") {
        query = query.eq("supplier_id", supplierId);
    }

    if (search) {
        query = query.or(`number.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        purchase_orders: data,
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
    const { outsourcing_ids, ...poData } = payload;
    const supabase = createServiceRoleClient();
    const body = {
        ...poData,
        owner_id: serverEnv.PLURIDESK_OWNER_ID,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: po, error: poError } = await (supabase.from("purchase_orders") as any)
        .insert(body)
        .select()
        .single();

    if (poError) {
        return NextResponse.json({ error: poError.message }, { status: 500 });
    }

    if (outsourcing_ids && Array.isArray(outsourcing_ids) && outsourcing_ids.length > 0) {
        // Link outsourcing items to this PO
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: linkError } = await (supabase.from("outsourcing") as any)
            .update({ purchase_order_id: po.id })
            .in("id", outsourcing_ids);

        if (linkError) {
            // Note: PO is created but linking failed. We might want to rollback or just warn.
            // For now, returning error.
            return NextResponse.json({ error: "PO created but failed to link jobs: " + linkError.message, purchase_order: po }, { status: 500 });
        }
    }

    return NextResponse.json({ purchase_order: po }, { status: 201 });
}

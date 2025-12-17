import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env.server";

export async function POST(request: Request) {
    const payload = await request.json();
    const supabase = createServiceRoleClient();

    // Validate ownership of the invoice before adding payment
    const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select("id")
        .eq("id", payload.invoice_id)
        .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID)
        .single();

    if (invoiceError || !invoice) {
        return NextResponse.json(
            { error: "Invoice not found or access denied" },
            { status: 404 }
        );
    }

    const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("payments" as any)
        .insert(payload)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ payment: data }, { status: 201 });
}

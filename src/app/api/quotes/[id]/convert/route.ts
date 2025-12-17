import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env.server";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = createServiceRoleClient();

    // 1. Fetch Quote & Items
    const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .select("*")
        .eq("id", id)
        .single();

    if (quoteError || !quote) {
        return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // 2. Create Job
    const { data: job, error: jobError } = await supabase
        .from("jobs")
        .insert({
            owner_id: serverEnv.PLURIDESK_OWNER_ID,
            client_id: quote.client_id,
            title: `Job from Quote ${quote.quote_number}`,
            job_code: `JOB-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`, // Simple auto-gen
            status: "created",
            currency: quote.currency,
            total_amount: quote.total,
            service_type: "translation", // Default or needs to be inferred
            pricing_type: "flat_fee", // Default or needs to be inferred
            notes: `Converted from Quote ${quote.quote_number}\n\n${quote.notes || ""}`,
        })
        .select()
        .single();

    if (jobError) {
        return NextResponse.json({ error: jobError.message }, { status: 500 });
    }

    // 3. Update Quote Status
    await supabase
        .from("quotes")
        .update({ status: "accepted" })
        .eq("id", id);

    return NextResponse.json({ job });
}

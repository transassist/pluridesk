import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env.server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const supabase = createServiceRoleClient();
        const { id } = params;

        const { data, error } = await supabase
            .from("outsourcing")
            .select("*, suppliers(name, email), jobs(job_code, title, status, client_id)")
            .eq("id", id)
            .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ error: "Outsourcing record not found" }, { status: 404 });
        }

        return NextResponse.json({ outsourcing: data });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const supabase = createServiceRoleClient();
        const { id } = params;
        const payload = await request.json();

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
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const supabase = createServiceRoleClient();
        const { id } = params;

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
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

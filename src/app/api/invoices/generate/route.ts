import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env.server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type JobRecord = Database["public"]["Tables"]["jobs"]["Row"];

export async function POST(request: Request) {
    try {
        const { job_ids, client_id } = await request.json();

        if (!job_ids || !Array.isArray(job_ids) || job_ids.length === 0) {
            return NextResponse.json(
                { error: "No jobs selected" },
                { status: 400 }
            );
        }

        if (!client_id) {
            return NextResponse.json(
                { error: "Client ID is required" },
                { status: 400 }
            );
        }

        const supabase = createServiceRoleClient();

        // 1. Fetch selected jobs to validate and calculate totals
        const { data: rawJobs, error: jobsError } = await supabase
            .from("jobs")
            .select("*")
            .in("id", job_ids)
            .eq("owner_id", serverEnv.PLURIDESK_OWNER_ID);

        if (jobsError || !rawJobs) {
            return NextResponse.json(
                { error: "Failed to fetch jobs" },
                { status: 500 }
            );
        }

        if (rawJobs.length !== job_ids.length) {
            return NextResponse.json(
                { error: "Some jobs could not be found or you don't have access to them" },
                { status: 400 }
            );
        }

        // Cast to JobRecord[] to satisfy TypeScript
        const jobs = rawJobs as JobRecord[];

        // 2. Validate consistency (same client, same currency)
        const firstJob = jobs[0];
        const currency = firstJob.currency;

        const hasDifferentClient = jobs.some((job) => job.client_id !== client_id);
        if (hasDifferentClient) {
            return NextResponse.json(
                { error: "All jobs must belong to the same client" },
                { status: 400 }
            );
        }

        const hasDifferentCurrency = jobs.some((job) => job.currency !== currency);
        if (hasDifferentCurrency) {
            return NextResponse.json(
                { error: "All jobs must have the same currency" },
                { status: 400 }
            );
        }

        // 3. Create Invoice Items from Jobs
        const invoiceItems = jobs.map((job) => ({
            description: `${job.job_code ? `[${job.job_code}] ` : ""}${job.title}`,
            quantity: job.quantity || 1,
            rate: job.rate || 0,
            amount: job.total_amount || 0,
        }));

        const totalAmount = jobs.reduce((sum, job) => sum + (job.total_amount || 0), 0);

        // 4. Create Invoice
        const { data: invoice, error: invoiceError } = await supabase
            .from("invoices")
            .insert({
                owner_id: serverEnv.PLURIDESK_OWNER_ID,
                client_id: client_id,
                date: new Date().toISOString(),
                due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days
                currency: currency,
                items: invoiceItems,
                subtotal: totalAmount,
                total: totalAmount,
                status: "draft",
            })
            .select()
            .single();

        if (invoiceError) {
            return NextResponse.json(
                { error: invoiceError.message },
                { status: 500 }
            );
        }

        // 5. Update Jobs with invoice_id and status
        const { error: updateError } = await supabase
            .from("jobs")
            .update({
                invoice_id: invoice.id,
                status: "invoiced",
            })
            .in("id", job_ids);

        if (updateError) {
            // Note: In a real app, we might want to rollback the invoice creation here
            console.error("Failed to update jobs with invoice_id", updateError);
            return NextResponse.json(
                { error: "Invoice created but failed to update jobs status" },
                { status: 500 }
            );
        }

        return NextResponse.json({ invoice });
    } catch (error) {
        console.error("Generate invoice error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

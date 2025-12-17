/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
    req: Request,
    props: { params: Promise<{ supplierId: string }> }
) {
    try {
        const params = await props.params;
        const supabase = await createSupabaseServerClient();

        // 1. Fetch Outsourcing Data (Jobs)

        const { data: outsourcing, error: jobsError } = await (supabase
            .from("outsourcing")
            .select("supplier_total, jobs(status, due_date, delivery_date)") as any)
            .eq("supplier_id", params.supplierId);

        if (jobsError) {
            console.error("Error fetching jobs:", jobsError);
            return new NextResponse("Failed to fetch jobs data", { status: 500 });
        }

        // 2. Fetch Evaluations (Ratings)
        const { data: evaluations, error: ratingsError } = await supabase
            .from("supplier_evaluations")
            .select("rating")
            .eq("supplier_id", params.supplierId);

        if (ratingsError) {
            console.error("Error fetching ratings:", ratingsError);
            return new NextResponse("Failed to fetch ratings data", { status: 500 });
        }

        // 3. Calculate Stats
        const totalJobs = outsourcing?.length || 0;
        const totalSpend = outsourcing?.reduce((sum: number, item: any) => sum + (item.supplier_total || 0), 0) || 0;

        const ratings = evaluations?.map((e: any) => e.rating) || [];
        const averageRating = ratings.length > 0
            ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
            : 0;

        // On-Time Delivery Calculation
        // Consider only completed/delivered jobs that have both due_date and delivery_date
        const completedJobs = outsourcing?.filter((item: any) =>
            item.jobs &&
            (item.jobs.status === "completed" || item.jobs.status === "delivered") &&
            item.jobs.due_date &&
            item.jobs.delivery_date
        ) || [];

        const onTimeJobs = completedJobs.filter((item: any) => {
            const due = new Date(item.jobs.due_date);
            const delivery = new Date(item.jobs.delivery_date);
            return delivery <= due;
        });

        const onTimeDeliveryRate = completedJobs.length > 0
            ? (onTimeJobs.length / completedJobs.length) * 100
            : 0; // Default to 0 if no data, or maybe null? Let's say 0 for now.

        return NextResponse.json({
            totalJobs,
            totalSpend,
            averageRating,
            onTimeDeliveryRate,
            ratingCount: ratings.length,
            completedJobsCount: completedJobs.length
        });

    } catch (error) {
        console.error("Error calculating stats:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

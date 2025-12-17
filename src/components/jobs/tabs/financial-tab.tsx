"use client";

import { useQuery } from "@tanstack/react-query";
import { DollarSign, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Database } from "@/lib/supabase/types";

type JobRecord = Database["public"]["Tables"]["jobs"]["Row"];

interface FinancialTabProps {
    job: JobRecord;
}

export function FinancialTab({ job }: FinancialTabProps) {
    const supabase = createClient();

    // Fetch outsourcing cost
    const { data: outsourcingCost = 0 } = useQuery({
        queryKey: ["job-outsourcing-cost", job.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("outsourcing")
                .select("supplier_total")
                .eq("job_id", job.id);

            if (error) throw error;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return data.reduce((sum, item: any) => sum + (item.supplier_total || 0), 0);
        },
    });

    // Fetch time cost (if hourly)
    // This is a bit complex if we want to mix "per word" revenue with "hourly" internal cost.
    // For now, let's just show tracked time.
    const { data: timeStats } = useQuery({
        queryKey: ["job-time-stats", job.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("job_time_logs")
                .select("duration")
                .eq("job_id", job.id);

            if (error) throw error;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const totalSeconds = data.reduce((sum, item: any) => sum + (item.duration || 0), 0);
            return { hours: totalSeconds / 3600 };
        },
    });

    const revenue = job.total_amount || 0;
    const cost = outsourcingCost; // + internal time cost if we had an internal rate
    const profit = revenue - cost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    // Performance metrics
    const wordsPerHour = (job.quantity && timeStats?.hours) ? Math.round(job.quantity / timeStats.hours) : 0;

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Revenue</CardDescription>
                        <CardTitle className="text-2xl">{formatCurrency(revenue, job.currency)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">
                            Based on {job.pricing_type === 'per_word' ? `${job.quantity} words` : job.pricing_type === 'per_hour' ? `${job.quantity} hours` : 'Flat fee'}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Costs (Outsourcing)</CardDescription>
                        <CardTitle className="text-2xl text-red-600 dark:text-red-400">
                            {formatCurrency(cost, job.currency)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">
                            Direct supplier costs
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Net Profit</CardDescription>
                        <CardTitle className={`text-2xl ${profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600"}`}>
                            {formatCurrency(profit, job.currency)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Progress value={margin} className="h-2" />
                            <span className="text-xs font-medium">{margin.toFixed(1)}%</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" /> Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Effective Hourly Rate</span>
                            <span className="font-bold">
                                {timeStats?.hours ? formatCurrency(profit / timeStats.hours, job.currency) : "—"}/h
                            </span>
                        </div>
                        {job.pricing_type === 'per_word' && (
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Throughput</span>
                                <span className="font-bold">
                                    {wordsPerHour > 0 ? `${wordsPerHour} words/h` : "—"}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" /> Billing Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Invoiced</span>
                            {/* Placeholder: need to sum linked invoices */}
                            <span className="font-bold">{job.status === 'invoiced' ? formatCurrency(revenue, job.currency) : formatCurrency(0, job.currency)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Remaining to Invoice</span>
                            <span className="font-bold">{job.status === 'invoiced' ? formatCurrency(0, job.currency) : formatCurrency(revenue, job.currency)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

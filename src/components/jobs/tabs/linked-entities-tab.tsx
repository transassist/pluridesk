"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, Receipt, ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
type Quote = Database["public"]["Tables"]["quotes"]["Row"];

interface LinkedEntitiesTabProps {
    jobId: string;
}

export function LinkedEntitiesTab({ jobId }: LinkedEntitiesTabProps) {
    const supabase = createClient();

    // Fetch linked invoices
    const { data: invoices = [] } = useQuery({
        queryKey: ["job-invoices", jobId],
        queryFn: async () => {
            // First try the new junction table
            const { data: junctionData, error: junctionError } = await supabase
                .from("job_invoices")
                .select("invoice_id, invoices(*)")
                .eq("job_id", jobId);

            if (!junctionError && junctionData.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return junctionData.map((d: any) => d.invoices) as unknown as Invoice[];
            }

            // Fallback to legacy invoice_id on jobs table if no junction data
            const { data: jobData } = await supabase
                .from("jobs")
                .select("invoice_id, invoices(*)")
                .eq("id", jobId)
                .single();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((jobData as any)?.invoices) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return [(jobData as any).invoices] as unknown as Invoice[];
            }

            return [];
        },
    });

    // Fetch linked quotes
    const { data: quotes = [] } = useQuery({
        queryKey: ["job-quotes", jobId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("job_quotes")
                .select("quote_id, quotes(*)")
                .eq("job_id", jobId);

            if (error) throw error;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return data.map((d: any) => d.quotes) as unknown as Quote[];
        },
    });

    return (
        <div className="space-y-6">
            {/* Invoices Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <Receipt className="h-5 w-5" /> Invoices
                        </CardTitle>
                        <CardDescription>Invoices linked to this job</CardDescription>
                    </div>
                    {/* Future: Add "Link Invoice" button */}
                </CardHeader>
                <CardContent>
                    {invoices.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border-dashed border rounded-lg">
                            No invoices linked to this job.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {invoices.map((invoice) => (
                                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Link href={`/invoices/${invoice.id}`} className="font-semibold hover:underline flex items-center">
                                                {invoice.invoice_number}
                                                <ArrowUpRight className="ml-1 h-3 w-3 text-muted-foreground" />
                                            </Link>
                                            <Badge variant={
                                                invoice.status === 'paid' ? 'default' :
                                                    invoice.status === 'overdue' ? 'destructive' : 'secondary'
                                            }>
                                                {invoice.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {invoice.date ? formatDate(invoice.date) : "No date"}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{formatCurrency(invoice.total || 0, invoice.currency)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quotes Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" /> Quotes
                        </CardTitle>
                        <CardDescription>Quotes converted to this job</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {quotes.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border-dashed border rounded-lg">
                            No quotes linked to this job.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {quotes.map((quote) => (
                                <div key={quote.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Link href={`/quotes/${quote.id}`} className="font-semibold hover:underline flex items-center">
                                                {quote.quote_number}
                                                <ArrowUpRight className="ml-1 h-3 w-3 text-muted-foreground" />
                                            </Link>
                                            <Badge variant="outline">
                                                {quote.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {quote.date ? formatDate(quote.date) : "No date"}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{formatCurrency(quote.total || 0, quote.currency)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

"use client";


import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Check, X, Copy, Trash2, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { format } from "date-fns";

import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import type { Database } from "@/lib/supabase/types";

const QuotePDFDownloadButton = dynamic(
    () => import("@/components/quotes/quote-pdf-download-button"),
    { ssr: false, loading: () => <Button disabled>Loading PDF...</Button> }
);

type QuoteRecord = Database["public"]["Tables"]["quotes"]["Row"] & {
    clients: Database["public"]["Tables"]["clients"]["Row"] | null;
    owner: Database["public"]["Tables"]["users"]["Row"] | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QuoteItemRecord = any;

const fetchQuote = async (id: string): Promise<{ quote: QuoteRecord; items: QuoteItemRecord[] }> => {
    const response = await fetch(`/api/quotes/${id}`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error ?? "Unable to load quote");
    }
    return response.json();
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline" | "muted"> = {
    draft: "muted",
    sent: "secondary",
    accepted: "default",
    rejected: "destructive",
};

export default function QuoteDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const queryClient = useQueryClient();


    const {
        data,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["quote", id],
        queryFn: () => fetchQuote(id),
    });

    const updateStatusMutation = useMutation({
        mutationFn: async (status: string) => {
            const response = await fetch(`/api/quotes/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });

            if (!response.ok) {
                throw new Error("Failed to update status");
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["quote", id] });
            toast({ title: "Status updated" });
        },
        onError: () => {
            toast({ title: "Error updating status", variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`/api/quotes/${id}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Failed to delete quote");
        },
        onSuccess: () => {
            toast({ title: "Quote deleted" });
            router.push("/quotes");
        },
    });

    const convertToJobMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`/api/quotes/${id}/convert`, {
                method: "POST",
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to convert to job");
            }
            return response.json();
        },
        onSuccess: () => {
            toast({ title: "Quote converted to job" });
            router.push(`/jobs`); // Or redirect to the new job if ID is returned
        },
        onError: (error) => {
            toast({ title: "Error converting to job", description: error.message, variant: "destructive" });
        }
    });

    if (isLoading) {
        return (
            <WorkspaceShell title="Loading...">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin h-8 w-8 text-primary" />
                </div>
            </WorkspaceShell>
        );
    }

    if (isError || !data) {
        return (
            <WorkspaceShell title="Error">
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {(error as Error)?.message ?? "Quote not found"}
                    </AlertDescription>
                </Alert>
                <Button variant="outline" className="mt-4" onClick={() => router.push("/quotes")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Quotes
                </Button>
            </WorkspaceShell>
        );
    }

    const { quote, items } = data;

    return (
        <WorkspaceShell
            title={quote.quote_number}
            description="View and manage quote details"
            actions={
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push("/quotes")}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                Actions
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateStatusMutation.mutate("sent")}>
                                <Mail className="mr-2 h-4 w-4" /> Mark as Sent
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatusMutation.mutate("accepted")}>
                                <Check className="mr-2 h-4 w-4" /> Mark as Accepted
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatusMutation.mutate("rejected")}>
                                <X className="mr-2 h-4 w-4" /> Mark as Rejected
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => convertToJobMutation.mutate()}>
                                <Copy className="mr-2 h-4 w-4" /> Convert to Job
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                                if (confirm("Are you sure you want to delete this quote?")) {
                                    deleteMutation.mutate();
                                }
                            }} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <QuotePDFDownloadButton quote={quote} items={items} />
                </div>
            }
        >
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-bold">QUOTE</CardTitle>
                            <div className="text-sm text-muted-foreground">#{quote.quote_number}</div>
                        </div>
                        <Badge variant={statusVariants[quote.status] ?? "secondary"} className="text-lg px-4 py-1">
                            {quote.status}
                        </Badge>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {/* Header Info */}
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <h3 className="font-semibold text-muted-foreground mb-2">From</h3>
                                <div className="text-sm">
                                    <div className="font-medium">{quote.owner?.company_name || quote.owner?.name}</div>
                                    <div className="whitespace-pre-wrap text-muted-foreground">{quote.owner?.address}</div>
                                    <div className="text-muted-foreground">{quote.owner?.email}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <h3 className="font-semibold text-muted-foreground mb-2">Prepared For</h3>
                                <div className="text-sm">
                                    <div className="font-medium">{quote.clients?.name}</div>
                                    <div className="whitespace-pre-wrap text-muted-foreground">{quote.clients?.address}</div>
                                    <div className="text-muted-foreground">{quote.clients?.email}</div>
                                </div>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-8 border-t border-b py-6">
                            <div>
                                <div className="text-sm text-muted-foreground">Date</div>
                                <div className="font-medium">
                                    {quote.date ? format(new Date(quote.date), "MMM dd, yyyy") : "—"}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-muted-foreground">Valid Until</div>
                                <div className="font-medium">
                                    {quote.expiry_date ? format(new Date(quote.expiry_date), "MMM dd, yyyy") : "—"}
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div>
                            <div className="grid grid-cols-12 gap-4 mb-4 text-sm font-medium text-muted-foreground">
                                <div className="col-span-6">Description</div>
                                <div className="col-span-2 text-right">Qty</div>
                                <div className="col-span-2 text-right">Rate</div>
                                <div className="col-span-2 text-right">Amount</div>
                            </div>
                            <div className="space-y-4">
                                {items.map((item, i) => (
                                    <div key={i} className="grid grid-cols-12 gap-4 text-sm border-b pb-4 last:border-0">
                                        <div className="col-span-6 font-medium">{item.description}</div>
                                        <div className="col-span-2 text-right">{item.quantity}</div>
                                        <div className="col-span-2 text-right">
                                            {formatCurrency(item.rate ?? 0, quote.currency)}
                                        </div>
                                        <div className="col-span-2 text-right">
                                            {formatCurrency(item.amount ?? 0, quote.currency)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="flex flex-col items-end space-y-2 pt-4 border-t">
                            <div className="flex justify-between w-48 text-lg font-bold pt-2">
                                <span>Total</span>
                                <span>{formatCurrency(quote.total ?? 0, quote.currency)}</span>
                            </div>
                        </div>

                        {/* Notes */}
                        {quote.notes && (
                            <div className="pt-6 border-t">
                                <h3 className="font-semibold text-muted-foreground mb-2">Notes</h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quote.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </WorkspaceShell>
    );
}



"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { InvoiceBuilder } from "@/components/invoices/invoice-builder";
import type { Database } from "@/lib/supabase/types";

type InvoiceWithDetails = Database["public"]["Tables"]["invoices"]["Row"] & {
    clients: Database["public"]["Tables"]["clients"]["Row"] | null;
};

export default function EditInvoicePage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();

    const { data: invoice, isLoading, error } = useQuery<InvoiceWithDetails>({
        queryKey: ["invoice", id],
        queryFn: async () => {
            const res = await fetch(`/api/invoices/${id}`);
            if (!res.ok) throw new Error("Failed to fetch invoice");
            const data = await res.json();
            return data.invoice;
        },
    });

    if (isLoading) {
        return (
            <WorkspaceShell>
                <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </WorkspaceShell>
        );
    }

    if (error || !invoice) {
        return (
            <WorkspaceShell>
                <div className="flex flex-col items-center justify-center gap-4 py-10">
                    <p className="text-destructive">Failed to load invoice</p>
                    <Button variant="outline" onClick={() => router.push("/invoices")}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
                    </Button>
                </div>
            </WorkspaceShell>
        );
    }

    // Transform invoice data to match form values
    const initialData = {
        id: invoice.id,
        client_id: invoice.client_id,
        invoice_number: invoice.invoice_number,
        date: invoice.date || new Date().toISOString().split("T")[0],
        due_date: invoice.due_date || new Date().toISOString().split("T")[0],
        currency: invoice.currency || "USD",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: (invoice.items as any[]) || [],
        notes: invoice.notes || undefined,
        status: invoice.status as "draft" | "sent",
    };

    return (
        <WorkspaceShell>
            <InvoiceBuilder initialData={initialData} />
        </WorkspaceShell>
    );
}

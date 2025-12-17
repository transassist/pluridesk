"use client";

import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { InvoiceBuilder } from "@/components/invoices/invoice-builder";

export default function NewInvoicePage() {
    return (
        <WorkspaceShell>
            <div className="mx-auto max-w-5xl py-6">
                <InvoiceBuilder />
            </div>
        </WorkspaceShell>
    );
}

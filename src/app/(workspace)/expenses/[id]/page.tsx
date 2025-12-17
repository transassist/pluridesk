"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Edit, Loader2, Paperclip } from "lucide-react";
import Link from "next/link";

import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExpenseFormSheet } from "@/components/expenses/expense-form-sheet";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";
import { useState } from "react";

type ExpenseRecord = Database["public"]["Tables"]["expenses"]["Row"];

async function fetchExpense(id: string): Promise<ExpenseRecord> {
    const response = await fetch(`/api/expenses/${id}`);
    if (!response.ok) {
        throw new Error("Failed to fetch expense");
    }
    const data = await response.json();
    return data.expense;
}

export default function ExpenseDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const [showEditSheet, setShowEditSheet] = useState(false);

    const { data: expense, isLoading } = useQuery({
        queryKey: ["expense", id],
        queryFn: () => fetchExpense(id),
    });

    if (isLoading) {
        return (
            <WorkspaceShell
                title="Loading..."
                description="Fetching expense details"
                actions={
                    <Link href="/expenses">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                }
            >
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </WorkspaceShell>
        );
    }

    if (!expense) {
        return (
            <WorkspaceShell
                title="Not Found"
                description="This expense could not be found"
                actions={
                    <Link href="/expenses">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                }
            >
                <Card>
                    <CardContent className="py-10 text-center text-muted-foreground">
                        <p>The expense you&apos;re looking for doesn&apos;t exist.</p>
                    </CardContent>
                </Card>
            </WorkspaceShell>
        );
    }

    return (
        <>
            <ExpenseFormSheet
                open={showEditSheet}
                onOpenChange={setShowEditSheet}
                expenseToEdit={expense}
            />

            <WorkspaceShell
                title="Expense Details"
                description={`View and manage expense details`}
                actions={
                    <div className="flex items-center gap-2">
                        <Link href="/expenses">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        </Link>
                        <Button size="sm" onClick={() => setShowEditSheet(true)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Expense
                        </Button>
                    </div>
                }
            >
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>General Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">
                                    Date
                                </div>
                                <div className="text-base">
                                    {expense.date ? formatDate(expense.date) : "—"}
                                </div>
                            </div>

                            <div>
                                <div className="text-sm font-medium text-muted-foreground">
                                    Category
                                </div>
                                <div className="text-base">
                                    <Badge variant="secondary">{expense.category}</Badge>
                                </div>
                            </div>

                            <div>
                                <div className="text-sm font-medium text-muted-foreground">
                                    Amount
                                </div>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(
                                        expense.amount ?? 0,
                                        expense.currency ?? "USD"
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="text-sm font-medium text-muted-foreground">
                                    Supplier
                                </div>
                                <div className="text-base">
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {(expense as any).supplier_id ? (
                                        <Link
                                            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                                            href={`/suppliers/${(expense as any).supplier_id}`}
                                            className="text-blue-600 hover:underline"
                                        >
                                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                            {(expense as any).supplier_name || "—"}
                                        </Link>
                                        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                                    ) : (expense as any).supplier_name ? (
                                        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                                        <span>{(expense as any).supplier_name}</span>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Additional Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">
                                    Notes
                                </div>
                                <div className="text-base">
                                    {expense.notes || (
                                        <span className="text-muted-foreground">No notes</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="text-sm font-medium text-muted-foreground">
                                    Receipt
                                </div>
                                <div className="text-base">
                                    {expense.file_url ? (
                                        <a
                                            href={expense.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                                        >
                                            <Paperclip className="h-4 w-4" />
                                            View Receipt
                                        </a>
                                    ) : (
                                        <span className="text-muted-foreground">
                                            No receipt attached
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="text-sm font-medium text-muted-foreground">
                                    Created
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {formatDate(expense.created_at)}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </WorkspaceShell>
        </>
    );
}

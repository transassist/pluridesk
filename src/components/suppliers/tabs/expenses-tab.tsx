"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, Loader2, Plus, Receipt } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

interface ExpensesTabProps {
    supplierId: string;
}

export function ExpensesTab({ supplierId }: ExpensesTabProps) {
    const [page] = useState(1);
    const limit = 10;

    const { data, isLoading } = useQuery({
        queryKey: ["expenses", supplierId, page],
        queryFn: async () => {
            const res = await fetch(
                `/api/expenses?supplier_id=${supplierId}&page=${page}&limit=${limit}`
            );
            if (!res.ok) throw new Error("Failed to fetch expenses");
            return res.json();
        },
    });

    if (isLoading) {
        return (
            <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const expenses = data?.expenses || [];

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle>Expenses</CardTitle>
                    <CardDescription>
                        Track expenses related to this supplier.
                    </CardDescription>
                </div>
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                </Button>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Notes</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No expenses found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                expenses.map((expense: any) => (
                                    <TableRow key={expense.id}>
                                        <TableCell>
                                            {expense.date
                                                ? format(new Date(expense.date), "MMM d, yyyy")
                                                : "-"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Receipt className="h-4 w-4 text-muted-foreground" />
                                                <span className="capitalize">{expense.category}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate">
                                            {expense.notes || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {formatCurrency(expense.amount, expense.currency)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {expense.file_url && (
                                                <Button variant="ghost" size="sm" asChild>
                                                    <a
                                                        href={expense.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                        <span className="sr-only">Download Receipt</span>
                                                    </a>
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

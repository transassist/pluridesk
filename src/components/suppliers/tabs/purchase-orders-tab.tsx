"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, FileText, Loader2, Plus } from "lucide-react";

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

interface PurchaseOrdersTabProps {
    supplierId: string;
}

export function PurchaseOrdersTab({ supplierId }: PurchaseOrdersTabProps) {
    const [page] = useState(1);
    const limit = 10;

    const { data, isLoading } = useQuery({
        queryKey: ["purchase-orders", supplierId, page],
        queryFn: async () => {
            const res = await fetch(
                `/api/purchase-orders?supplier_id=${supplierId}&page=${page}&limit=${limit}`
            );
            if (!res.ok) throw new Error("Failed to fetch purchase orders");
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

    const purchaseOrders = data?.purchase_orders || [];

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle>Purchase Orders</CardTitle>
                    <CardDescription>
                        Manage purchase orders sent to this supplier.
                    </CardDescription>
                </div>
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Create PO
                </Button>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Number</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Job</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {purchaseOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No purchase orders found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                purchaseOrders.map((po: any) => (
                                    <TableRow key={po.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                {po.number}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(po.created_at), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            {po.jobs ? (
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{po.jobs.job_code}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {po.jobs.title}
                                                    </span>
                                                </div>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {po.amount
                                                ? formatCurrency(po.amount, po.currency)
                                                : "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <a href={po.file_url} target="_blank" rel="noopener noreferrer">
                                                    <Download className="h-4 w-4" />
                                                    <span className="sr-only">Download</span>
                                                </a>
                                            </Button>
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

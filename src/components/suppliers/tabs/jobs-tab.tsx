"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, FileText, CheckCircle2, Circle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import { CreatePODialog } from "../create-po-dialog";

interface JobsTabProps {
    supplierId: string;
}

export function JobsTab({ supplierId }: JobsTabProps) {
    const supabase = createClient();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isCreatePOOpen, setIsCreatePOOpen] = useState(false);

    const { data: jobs, isLoading, refetch } = useQuery({
        queryKey: ["supplier-jobs", supplierId],
        queryFn: async () => {

            const { data, error } = await (supabase
                .from("outsourcing")
                .select("*, jobs(id, job_code, title, status, due_date), purchase_orders(id, number)")
                .eq("supplier_id", supplierId)
                .order("created_at", { ascending: false })) as any;

            if (error) throw error;
            return data;
        },
    });

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            // Only select items that don't have a PO yet
            const selectableIds = jobs
                ?.filter((job: any) => !job.purchase_order_id)
                .map((job: any) => job.id) || [];
            setSelectedIds(selectableIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelect = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds((prev) => [...prev, id]);
        } else {
            setSelectedIds((prev) => prev.filter((item) => item !== id));
        }
    };

    const selectedTotal = jobs
        ?.filter((job: any) => selectedIds.includes(job.id))
        .reduce((sum: number, job: any) => sum + (job.supplier_total || 0), 0) || 0;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                    {jobs?.length || 0} jobs found
                </div>
                <Button
                    onClick={() => setIsCreatePOOpen(true)}
                    disabled={selectedIds.length === 0}
                >
                    <FileText className="mr-2 h-4 w-4" />
                    Create PO ({selectedIds.length})
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={
                                        jobs?.length > 0 &&
                                        jobs?.filter((j: any) => !j.purchase_order_id).length > 0 &&
                                        selectedIds.length === jobs?.filter((j: any) => !j.purchase_order_id).length
                                    }
                                    onCheckedChange={handleSelectAll}
                                    disabled={!jobs?.some((j: any) => !j.purchase_order_id)}
                                />
                            </TableHead>
                            <TableHead>Job</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Deadline</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>PO Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : jobs?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No jobs found.
                                </TableCell>
                            </TableRow>
                        ) : (

                            jobs?.map((item: any) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.includes(item.id)}
                                            onCheckedChange={(checked) => handleSelect(item.id, checked as boolean)}
                                            disabled={!!item.purchase_order_id}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <Link
                                                href={`/jobs/${item.jobs?.id}`}
                                                className="font-medium hover:underline text-primary"
                                            >
                                                {item.jobs?.job_code}
                                            </Link>
                                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                {item.jobs?.title}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{item.service_type || "-"}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {item.jobs?.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {item.jobs?.due_date ? format(new Date(item.jobs.due_date), "MMM d, yyyy") : "-"}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {item.supplier_total?.toFixed(2)} {item.supplier_currency}
                                    </TableCell>
                                    <TableCell>
                                        {item.purchase_order_id ? (
                                            <div className="flex items-center text-green-600 text-xs">
                                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                                <span>PO #{item.purchase_orders?.number}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-muted-foreground text-xs">
                                                <Circle className="mr-1 h-3 w-3" />
                                                <span>Pending</span>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <CreatePODialog
                open={isCreatePOOpen}
                onOpenChange={setIsCreatePOOpen}
                supplierId={supplierId}
                selectedIds={selectedIds}
                totalAmount={selectedTotal}
                onSuccess={() => {
                    setSelectedIds([]);
                    refetch();
                }}
            />
        </div>
    );
}

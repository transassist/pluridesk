"use client";

import {
    FileText,
    Receipt,
    Copy,
    Archive,
    Trash2,
    Calendar,
    Globe,
    Clock
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import { JobLabels } from "./job-labels";
import type { Database } from "@/lib/supabase/types";

type JobRecord = Database["public"]["Tables"]["jobs"]["Row"];

interface JobSidebarProps {
    job: JobRecord;
    onDelete: () => void;
}

export function JobSidebar({ job, onDelete }: JobSidebarProps) {
    const router = useRouter();

    return (
        <div className="space-y-6">
            {/* Actions Panel */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                    <Button className="w-full justify-start" variant="outline" onClick={() => router.push(`/invoices/new?job_id=${job.id}`)}>
                        <Receipt className="mr-2 h-4 w-4" /> Create Invoice
                    </Button>
                    <Button className="w-full justify-start" variant="outline" onClick={() => router.push(`/quotes/new?job_id=${job.id}`)}>
                        <FileText className="mr-2 h-4 w-4" /> Create Quote
                    </Button>

                    <Separator className="my-2" />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" className="w-full">
                                More Actions
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Manage Job</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => alert("Duplicate not implemented yet")}>
                                <Copy className="mr-2 h-4 w-4" /> Duplicate Job
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => alert("Archive not implemented yet")}>
                                <Archive className="mr-2 h-4 w-4" /> Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Job
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardContent>
            </Card>

            {/* Metadata Panel */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Labels</p>
                        <JobLabels jobId={job.id} />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center">
                                <Calendar className="mr-2 h-4 w-4" /> Start Date
                            </span>
                            <span>{job.start_date ? formatDate(job.start_date) : "—"}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center">
                                <Clock className="mr-2 h-4 w-4" /> Delivery
                            </span>
                            <span>{job.delivery_date ? formatDate(job.delivery_date) : "—"}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center">
                                <Globe className="mr-2 h-4 w-4" /> Domain
                            </span>
                            <span>{job.domain || "—"}</span>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Source Lang</span>
                            <span className="font-medium">{job.language_pair_source || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Target Lang</span>
                            <span className="font-medium">{job.language_pair_target || "—"}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

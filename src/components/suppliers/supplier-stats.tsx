"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Star, Clock, DollarSign, Briefcase } from "lucide-react";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";

interface SupplierStatsProps {
    supplierId: string;
    currency?: string;
}

export function SupplierStats({ supplierId, currency = "USD" }: SupplierStatsProps) {
    const { data: stats, isLoading } = useQuery({
        queryKey: ["supplier-stats", supplierId],
        queryFn: async () => {
            const res = await fetch(`/api/suppliers/${supplierId}/stats`);
            if (!res.ok) throw new Error("Failed to fetch stats");
            return res.json();
        },
    });

    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {formatCurrency(stats?.totalSpend || 0, currency)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Lifetime outsourcing cost
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalJobs || 0}</div>
                    <p className="text-xs text-muted-foreground">
                        Completed and active jobs
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats?.averageRating ? stats.averageRating.toFixed(1) : "—"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Based on {stats?.ratingCount || 0} evaluations
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats?.onTimeDeliveryRate ? `${stats.onTimeDeliveryRate.toFixed(0)}%` : "—"}
                    </div>
                    <Progress
                        value={stats?.onTimeDeliveryRate || 0}
                        className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        {stats?.completedJobsCount || 0} completed jobs tracked
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

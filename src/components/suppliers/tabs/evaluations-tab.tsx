"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
    Loader2,
    Plus,
    Star,
    Award,
    Briefcase,
    Trash2
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { clientEnv } from "@/lib/env.client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import type { Database } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Evaluation = Database["public"]["Tables"]["supplier_evaluations"]["Row"];

interface EvaluationsTabProps {
    supplierId: string;
}

export function EvaluationsTab({ supplierId }: EvaluationsTabProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const supabase = createBrowserClient<Database>(
        clientEnv.NEXT_PUBLIC_SUPABASE_URL,
        clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form State
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [selectedJobId, setSelectedJobId] = useState<string | "none">("none");

    // Fetch Evaluations
    const { data: evaluations, isLoading } = useQuery({
        queryKey: ["supplier-evaluations", supplierId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("supplier_evaluations")
                .select(`
                    *,
                    jobs (
                        id,
                        job_code,
                        title
                    )
                `)
                .eq("supplier_id", supplierId)
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data as (Evaluation & { jobs: { id: string; job_code: string; title: string } | null })[];
        },
    });

    // Fetch Supplier Jobs (for linking)
    const { data: jobs } = useQuery({
        queryKey: ["supplier-jobs", supplierId],
        queryFn: async () => {
            // We need to find jobs where this supplier is outsourced to.
            // This is a bit complex with the current schema, assuming 'outsourcing' table links jobs and suppliers.
            const { data, error } = await supabase
                .from("outsourcing")
                .select(`
                    job_id,
                    jobs (
                        id,
                        job_code,
                        title
                    )
                `)
                .eq("supplier_id", supplierId);

            if (error) throw error;
            // Deduplicate jobs if multiple outsourcing entries exist
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const uniqueJobs = Array.from(new Map((data as any[]).map(item => [item.jobs?.id, item.jobs])).values()).filter(Boolean) as { id: string; job_code: string; title: string }[];
            return uniqueJobs;
        },
    });

    // Delete Evaluation Mutation
    const deleteEvaluationMutation = useMutation({
        mutationFn: async (id: string) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await supabase.from("supplier_evaluations").delete().eq("id", id as any);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["supplier-evaluations"] });
            toast({ title: "Success", description: "Evaluation deleted" });
        },
        onError: () => {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete evaluation",
            });
        },
    });

    // Add Evaluation Mutation
    const addEvaluationMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { error } = await supabase.from("supplier_evaluations").insert({
                supplier_id: supplierId,
                owner_id: user.id,
                rating,
                comment,
                job_id: selectedJobId || null,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["supplier-evaluations"] });
            setIsDialogOpen(false);
            resetForm();
            toast({ title: "Success", description: "Evaluation added" });
        },
        onError: () => {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to add evaluation",
            });
        },
    });

    const resetForm = () => {
        setRating(5);
        setComment("");
        setSelectedJobId("none");
    };

    const averageRating = evaluations?.length
        ? (evaluations.reduce((acc, curr) => acc + curr.rating, 0) / evaluations.length).toFixed(1)
        : "N/A";

    return (
        <div className="space-y-4">
            {/* Summary Card */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium">Quality Score</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-4xl font-bold">{averageRating}</span>
                            {averageRating !== "N/A" && (
                                <div className="flex text-yellow-500">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={cn(
                                                "h-5 w-5",
                                                star <= Math.round(Number(averageRating)) ? "fill-current" : "text-muted"
                                            )}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Based on {evaluations?.length || 0} evaluations
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Evaluations List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Award className="h-5 w-5" />
                            <div>
                                <CardTitle>Evaluations</CardTitle>
                                <CardDescription>Performance reviews and ratings</CardDescription>
                            </div>
                        </div>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Evaluation
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Evaluation</DialogTitle>
                                    <DialogDescription>
                                        Rate this supplier&apos;s performance.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Rating</label>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setRating(star)}
                                                    className="focus:outline-none"
                                                >
                                                    <Star
                                                        className={cn(
                                                            "h-8 w-8 transition-colors",
                                                            star <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                                                        )}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Link to Job (Optional)</label>
                                        <Select
                                            value={selectedJobId}
                                            onValueChange={setSelectedJobId}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a job..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No specific job</SelectItem>
                                                {jobs?.map((job) => (
                                                    <SelectItem key={job.id} value={job.id}>
                                                        {job.job_code} - {job.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Comment</label>
                                        <Textarea
                                            placeholder="Feedback..."
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => addEvaluationMutation.mutate()}
                                        disabled={addEvaluationMutation.isPending}
                                    >
                                        {addEvaluationMutation.isPending && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Save Evaluation
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : evaluations?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
                            <p className="mb-2">No evaluations yet.</p>
                            <div className="flex items-center gap-1">
                                <p className="text-sm text-muted-foreground">
                                    Don&apos;t see the evaluation you need?
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {(evaluations as any[])?.map((evaluation) => (
                                <Card key={evaluation.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`h-4 w-4 ${i < evaluation.rating ? "fill-primary text-primary" : "text-muted-foreground"
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-sm font-medium">
                                                    {evaluation.rating}/5
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => deleteEvaluationMutation.mutate(evaluation.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        {evaluation.jobs && (
                                            <CardDescription className="flex items-center gap-1 text-xs">
                                                <Briefcase className="h-3 w-3" />
                                                Job: {evaluation.jobs.title}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">
                                            {evaluation.comment}
                                        </p>
                                        <div className="mt-2 text-xs text-muted-foreground">
                                            {format(new Date(evaluation.created_at), "MMM d, yyyy")}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

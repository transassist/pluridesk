"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Database } from "@/lib/supabase/types";

type Label = Database["public"]["Tables"]["labels"]["Row"];

interface JobLabelsProps {
    jobId: string;
}

export function JobLabels({ jobId }: JobLabelsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [newLabelName, setNewLabelName] = useState("");
    const supabase = createClient();
    const queryClient = useQueryClient();

    // Fetch all available labels
    const { data: allLabels = [] } = useQuery({
        queryKey: ["labels"],
        queryFn: async () => {
            const { data, error } = await supabase.from("labels").select("*").order("name");
            if (error) throw error;
            return data as Label[];
        },
    });

    // Fetch labels assigned to this job
    const { data: jobLabels = [] } = useQuery({
        queryKey: ["job-labels", jobId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("job_labels")
                .select("label_id, labels(*)")
                .eq("job_id", jobId);

            if (error) throw error;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return data.map((d: any) => d.labels) as Label[];
        },
    });

    const assignLabelMutation = useMutation({
        mutationFn: async (labelId: string) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase.from("job_labels") as any).insert({
                job_id: jobId,
                label_id: labelId,
                owner_id: user.id
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["job-labels", jobId] });
        },
    });

    const createAndAssignLabelMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // 1. Create label
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: label, error: createError } = await (supabase.from("labels") as any)
                .insert({
                    name: newLabelName,
                    color: "#64748b", // Default color
                    owner_id: user.id,
                })
                .select()
                .single();

            if (createError) throw createError;

            // 2. Assign to job
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: assignError } = await (supabase.from("job_labels") as any)
                .insert({
                    job_id: jobId,
                    label_id: label.id,
                    owner_id: user.id
                });

            if (assignError) throw assignError;
        },
        onSuccess: () => {
            setNewLabelName("");
            queryClient.invalidateQueries({ queryKey: ["labels"] });
            queryClient.invalidateQueries({ queryKey: ["job-labels", jobId] });
        },
    });

    const removeLabelMutation = useMutation({
        mutationFn: async (labelId: string) => {
            const { error } = await supabase
                .from("job_labels")
                .delete()
                .eq("job_id", jobId)
                .eq("label_id", labelId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["job-labels", jobId] });
        },
    });

    const unassignedLabels = allLabels.filter(
        (l) => !jobLabels.find((jl) => jl.id === l.id)
    );

    return (
        <div className="flex flex-wrap gap-2 items-center">
            {jobLabels.map((label) => (
                <Badge key={label.id} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                    {label.name}
                    <button
                        onClick={() => removeLabelMutation.mutate(label.id)}
                        className="hover:bg-muted rounded-full p-0.5"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            ))}

            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                        <Plus className="mr-1 h-3 w-3" /> Label
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0" align="start">
                    <div className="p-2 border-b">
                        <Input
                            placeholder="Search or create..."
                            className="h-8 text-xs"
                            value={newLabelName}
                            onChange={(e) => setNewLabelName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && newLabelName) {
                                    createAndAssignLabelMutation.mutate();
                                }
                            }}
                        />
                    </div>
                    <ScrollArea className="h-48">
                        <div className="p-1">
                            {unassignedLabels.map((label) => (
                                <Button
                                    key={label.id}
                                    variant="ghost"
                                    className="w-full justify-start h-8 text-xs"
                                    onClick={() => assignLabelMutation.mutate(label.id)}
                                >
                                    <Tag className="mr-2 h-3 w-3" />
                                    {label.name}
                                </Button>
                            ))}
                            {unassignedLabels.length === 0 && !newLabelName && (
                                <div className="p-2 text-xs text-muted-foreground text-center">
                                    No more labels
                                </div>
                            )}
                            {newLabelName && !unassignedLabels.find(l => l.name.toLowerCase() === newLabelName.toLowerCase()) && (
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start h-8 text-xs"
                                    onClick={() => createAndAssignLabelMutation.mutate()}
                                >
                                    <Plus className="mr-2 h-3 w-3" />
                                    Create &quot;{newLabelName}&quot;
                                </Button>
                            )}
                        </div>
                    </ScrollArea>
                </PopoverContent>
            </Popover>
        </div>
    );
}

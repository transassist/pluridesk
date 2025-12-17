"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface ClientNotesProps {
    clientId: string;
    initialNotes: string | null;
}

export function ClientNotes({ clientId, initialNotes }: ClientNotesProps) {
    const [notes, setNotes] = useState(initialNotes || "");
    const [isDirty, setIsDirty] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const supabase = createSupabaseBrowserClient();

    useEffect(() => {
        setNotes(initialNotes || "");
        setIsDirty(false);
    }, [initialNotes]);

    const updateMutation = useMutation({
        mutationFn: async (newNotes: string) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase.from("clients") as any)
                .update({ notes: newNotes })
                .eq("id", clientId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["client", clientId] });
            toast({ title: "Notes saved" });
            setIsDirty(false);
        },
        onError: (error) => {
            toast({ variant: "destructive", title: "Error", description: error.message });
        },
    });

    const handleSave = () => {
        updateMutation.mutate(notes);
    };

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle>Internal Notes</CardTitle>
                    <CardDescription>
                        Private notes about this client. Not visible to them.
                    </CardDescription>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={!isDirty || updateMutation.isPending}
                    size="sm"
                >
                    {updateMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Changes
                </Button>
            </CardHeader>
            <CardContent className="pt-4">
                <Textarea
                    value={notes}
                    onChange={(e) => {
                        setNotes(e.target.value);
                        setIsDirty(true);
                    }}
                    className="min-h-[400px] resize-none font-mono text-sm leading-relaxed"
                    placeholder="Enter internal notes, preferences, or important details here..."
                />
            </CardContent>
        </Card>
    );
}

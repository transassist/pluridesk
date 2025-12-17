"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, StickyNote, Trash2, Pin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface NotesTabProps {
    jobId: string;
}

export function NotesTab({ jobId }: NotesTabProps) {
    const [newNote, setNewNote] = useState("");
    const supabase = createClient();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: notes = [] } = useQuery({
        queryKey: ["job-notes", jobId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("job_notes")
                .select("*")
                .eq("job_id", jobId)
                .order("is_pinned", { ascending: false })
                .order("created_at", { ascending: false });

            if (error) throw error;
            if (error) throw error;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return data as any[];
        },
    });

    const addNoteMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase.from("job_notes") as any).insert({
                job_id: jobId,
                owner_id: user.id,
                content: newNote,
            });
            if (error) throw error;
        },
        onSuccess: () => {
            setNewNote("");
            queryClient.invalidateQueries({ queryKey: ["job-notes", jobId] });
            toast({ title: "Note added" });
        },
    });

    const deleteNoteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("job_notes").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["job-notes", jobId] });
            toast({ title: "Note deleted" });
        },
    });

    const togglePinMutation = useMutation({
        mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase.from("job_notes") as any)
                .update({ is_pinned: !isPinned })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["job-notes", jobId] });
        },
    });

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Add Note</CardTitle>
                    <CardDescription>Add internal notes, instructions, or updates.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Textarea
                            placeholder="Type your note here..."
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            rows={3}
                        />
                        <div className="flex justify-end">
                            <Button
                                onClick={() => addNoteMutation.mutate()}
                                disabled={!newNote.trim() || addNoteMutation.isPending}
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add Note
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                {notes.map((note) => (
                    <Card key={note.id} className={note.is_pinned ? "border-primary/50 bg-primary/5" : ""}>
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                        <StickyNote className="h-3 w-3" />
                                        <span>{format(new Date(note.created_at), "MMM d, yyyy 'at' HH:mm")}</span>
                                        {note.is_pinned && (
                                            <span className="flex items-center text-primary font-medium">
                                                <Pin className="h-3 w-3 mr-1 fill-current" /> Pinned
                                            </span>
                                        )}
                                    </div>
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{note.content}</p>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground"
                                        onClick={() => togglePinMutation.mutate({ id: note.id, isPinned: note.is_pinned || false })}
                                    >
                                        <Pin className={`h-4 w-4 ${note.is_pinned ? "fill-current text-primary" : ""}`} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => {
                                            if (confirm("Delete this note?")) deleteNoteMutation.mutate(note.id)
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {notes.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                        No notes added yet.
                    </div>
                )}
            </div>
        </div>
    );
}

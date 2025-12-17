"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, Pause, Plus, Trash2, Loader2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface TimeTrackingTabProps {
    jobId: string;
    currency: string;
}

// Helper to format seconds into HH:MM:SS
const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export function TimeTrackingTab({ jobId }: TimeTrackingTabProps) {
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [manualTimeOpen, setManualTimeOpen] = useState(false);
    const [manualHours, setManualHours] = useState("");
    const [manualMinutes, setManualMinutes] = useState("");
    const [note, setNote] = useState("");

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const supabase = createClient();
    const queryClient = useQueryClient();

    // Fetch time logs
    const { data: logs = [], isLoading } = useQuery({
        queryKey: ["time-logs", jobId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("job_time_logs")
                .select("*")
                .eq("job_id", jobId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            if (error) throw error;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return data as any[];
        },
    });

    const addLogMutation = useMutation({
        mutationFn: async (duration: number) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase.from("job_time_logs") as any).insert({
                job_id: jobId,
                owner_id: user.id,
                duration: duration,
                description: note || (isTimerRunning ? "Timer session" : "Manual entry"),
                started_at: new Date().toISOString(), // Simplified
            });
            if (error) throw error;
        },
        onSuccess: () => {
            setElapsedTime(0);
            setNote("");
            setManualTimeOpen(false);
            setManualHours("");
            setManualMinutes("");
            queryClient.invalidateQueries({ queryKey: ["time-logs", jobId] });
            queryClient.invalidateQueries({ queryKey: ["job-time-stats", jobId] });
        },
    });

    const deleteLogMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("job_time_logs").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["time-logs", jobId] });
            queryClient.invalidateQueries({ queryKey: ["job-time-stats", jobId] });
        },
    });

    useEffect(() => {
        if (isTimerRunning) {
            timerRef.current = setInterval(() => {
                setElapsedTime((prev) => prev + 1);
            }, 1000);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isTimerRunning]);

    const handleStopTimer = () => {
        setIsTimerRunning(false);
        if (elapsedTime > 0) {
            addLogMutation.mutate(elapsedTime);
        }
    };

    const handleManualSubmit = () => {
        const h = parseInt(manualHours) || 0;
        const m = parseInt(manualMinutes) || 0;
        const totalSeconds = (h * 3600) + (m * 60);
        if (totalSeconds > 0) {
            addLogMutation.mutate(totalSeconds);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalSecondsLogged = logs.reduce((acc, log: any) => acc + (log.duration || 0), 0);

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                {/* Timer Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Stopwatch</CardTitle>
                        <CardDescription>Track time as you work</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center space-y-6 py-4">
                            <div className="text-5xl font-mono font-bold tracking-wider">
                                {formatTime(elapsedTime)}
                            </div>
                            <div className="flex gap-4">
                                {!isTimerRunning ? (
                                    <Button size="lg" className="w-32" onClick={() => setIsTimerRunning(true)}>
                                        <Play className="mr-2 h-5 w-5" /> Start
                                    </Button>
                                ) : (
                                    <Button size="lg" variant="destructive" className="w-32" onClick={handleStopTimer}>
                                        <Pause className="mr-2 h-5 w-5" /> Stop
                                    </Button>
                                )}
                            </div>
                            <Input
                                placeholder="Session note (optional)"
                                className="max-w-xs text-center"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                disabled={isTimerRunning}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Manual Entry Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Manual Entry</CardTitle>
                        <CardDescription>Add time manually</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-full pb-10">
                        <Dialog open={manualTimeOpen} onOpenChange={setManualTimeOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="lg" className="w-full max-w-xs h-24 flex flex-col gap-2">
                                    <Plus className="h-8 w-8" />
                                    <span>Add Time Manually</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Manual Time</DialogTitle>
                                    <DialogDescription>Enter the duration to log.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Hours</Label>
                                            <Input type="number" min="0" value={manualHours} onChange={(e) => setManualHours(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Minutes</Label>
                                            <Input type="number" min="0" max="59" value={manualMinutes} onChange={(e) => setManualMinutes(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Input placeholder="What did you work on?" value={note} onChange={(e) => setNote(e.target.value)} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleManualSubmit}>
                                        <Save className="mr-2 h-4 w-4" /> Save Log
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            </div>

            {/* Logs Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Time Logs</CardTitle>
                        <div className="text-sm font-medium text-muted-foreground">
                            Total: {formatTime(totalSecondsLogged)}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No time logs recorded yet.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Duration</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>{new Date(log.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell>{log.description || "—"}</TableCell>
                                        <TableCell className="text-right font-mono">{formatTime(log.duration)}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => deleteLogMutation.mutate(log.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

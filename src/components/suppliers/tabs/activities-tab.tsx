"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
    Loader2,
    Plus,
    Mail,
    Phone,
    Users,
    FileText,
    MoreHorizontal,
    Calendar
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { clientEnv } from "@/lib/env.client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type ActivityType = Database["public"]["Enums"]["activity_type"];
type Activity = Database["public"]["Tables"]["supplier_activities"]["Row"];

interface ActivitiesTabProps {
    supplierId: string;
}

const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
    email: <Mail className="h-4 w-4" />,
    call: <Phone className="h-4 w-4" />,
    meeting: <Users className="h-4 w-4" />,
    note: <FileText className="h-4 w-4" />,
    other: <MoreHorizontal className="h-4 w-4" />,
};

export function ActivitiesTab({ supplierId }: ActivitiesTabProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const supabase = createBrowserClient<Database>(
        clientEnv.NEXT_PUBLIC_SUPABASE_URL,
        clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form State
    const [type, setType] = useState<ActivityType>("note");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));

    // Fetch Activities
    const { data: activities, isLoading } = useQuery({
        queryKey: ["supplier-activities", supplierId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("supplier_activities")
                .select("*")
                .eq("supplier_id", supplierId)
                .order("date", { ascending: false });
            if (error) throw error;
            return data as Activity[];
        },
    });

    // Add Activity Mutation
    const addActivityMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { error } = await supabase.from("supplier_activities").insert({
                supplier_id: supplierId,
                owner_id: user.id,
                type,
                subject,
                description,
                date: new Date(date).toISOString(),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["supplier-activities"] });
            setIsDialogOpen(false);
            resetForm();
            toast({ title: "Success", description: "Activity logged" });
        },
        onError: () => {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to log activity",
            });
        },
    });

    const resetForm = () => {
        setType("note");
        setSubject("");
        setDescription("");
        setDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        <div>
                            <CardTitle>Activity Log</CardTitle>
                            <CardDescription>
                                Track interactions and notes
                            </CardDescription>
                        </div>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Log Activity
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Log Activity</DialogTitle>
                                <DialogDescription>
                                    Record a new interaction with this supplier.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Type</label>
                                    <Select
                                        value={type}
                                        onValueChange={(v) => setType(v as ActivityType)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="note">Note</SelectItem>
                                            <SelectItem value="email">Email</SelectItem>
                                            <SelectItem value="call">Call</SelectItem>
                                            <SelectItem value="meeting">Meeting</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Date & Time</label>
                                    <Input
                                        type="datetime-local"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Subject</label>
                                    <Input
                                        placeholder="Brief summary..."
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Description</label>
                                    <Textarea
                                        placeholder="Details..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
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
                                    onClick={() => addActivityMutation.mutate()}
                                    disabled={!subject || addActivityMutation.isPending}
                                >
                                    {addActivityMutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Save Activity
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
                ) : activities?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        No activities logged yet.
                    </div>
                ) : (
                    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                        {activities?.map((activity) => (
                            <div key={activity.id} className="relative flex items-start group">
                                <div className="absolute left-0 ml-5 -translate-x-1/2 translate-y-0.5">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-background shadow-sm">
                                        {ACTIVITY_ICONS[activity.type]}
                                    </div>
                                </div>
                                <div className="ml-16 w-full">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-semibold">{activity.subject}</h4>
                                        <time className="text-xs text-muted-foreground">
                                            {format(new Date(activity.date), "MMM d, yyyy h:mm a")}
                                        </time>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Don&apos;t see the activity type you need?
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

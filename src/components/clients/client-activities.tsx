"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Mail, MessageSquare, Phone, CheckCircle2, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { activityFormSchema, type ActivityFormValues } from "@/lib/validators/client-crm";

interface ClientActivitiesProps {
    clientId: string;
}

export function ClientActivities({ clientId }: ClientActivitiesProps) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const supabase = createSupabaseBrowserClient();

    const { data: activities, isLoading } = useQuery({
        queryKey: ["client-activities", clientId],
        queryFn: async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase.from("client_activities") as any)
                .select("*")
                .eq("client_id", clientId)
                .order("date", { ascending: false });

            if (error) throw error;
            return data;
        },
    });

    const form = useForm<ActivityFormValues>({
        resolver: zodResolver(activityFormSchema),
        defaultValues: {
            type: "call",
            subject: "",
            description: "",
            status: "done",
            date: new Date().toISOString().split('T')[0], // Default to today
        },
    });

    const createMutation = useMutation({
        mutationFn: async (values: ActivityFormValues) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase.from("client_activities") as any).insert({
                client_id: clientId,
                ...values,
                date: values.date ? new Date(values.date).toISOString() : new Date().toISOString(),
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["client-activities", clientId] });
            toast({ title: "Activity logged" });
            setIsFormOpen(false);
            form.reset();
        },
        onError: (error) => {
            toast({ variant: "destructive", title: "Error", description: error.message });
        },
    });

    const onSubmit = (values: ActivityFormValues) => {
        createMutation.mutate(values);
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "call":
                return <Phone className="h-4 w-4" />;
            case "email":
                return <Mail className="h-4 w-4" />;
            case "meeting":
                return <Calendar className="h-4 w-4" />;
            default:
                return <MessageSquare className="h-4 w-4" />;
        }
    };

    return (
        <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-medium">Activity Timeline</h3>
                    <Button onClick={() => setIsFormOpen(!isFormOpen)} size="sm" variant="outline">
                        {isFormOpen ? "Cancel" : "Log Activity"}
                    </Button>
                </div>

                {isFormOpen && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Log New Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Type</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select activity type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="call">Call</SelectItem>
                                                        <SelectItem value="email">Email</SelectItem>
                                                        <SelectItem value="meeting">Meeting</SelectItem>
                                                        <SelectItem value="note">Note</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="subject"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Subject</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Brief summary" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Textarea {...field} placeholder="Detailed notes..." />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={createMutation.isPending}>
                                            {createMutation.isPending ? "Saving..." : "Save Activity"}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Activity History</CardTitle>
                        <CardDescription>History of interactions with this client</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="py-8 text-center text-muted-foreground">Loading activities...</div>
                        ) : activities?.length === 0 ? (
                            <div className="py-10 text-center text-muted-foreground">
                                No activities logged yet.
                            </div>
                        ) : (
                            <div className="relative space-y-8 pl-6 before:absolute before:left-[11px] before:top-2 before:h-full before:w-[2px] before:bg-muted">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {activities?.map((activity: any) => (
                                    <div key={activity.id} className="relative">
                                        <div className="absolute -left-[30px] flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm">
                                            {getActivityIcon(activity.type)}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{activity.subject}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(activity.date), "MMM d, yyyy")}
                                                </span>
                                                {activity.status === "done" ? (
                                                    <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                                                        <CheckCircle2 className="h-3 w-3" /> Done
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                                                        <Clock className="h-3 w-3" /> To Do
                                                    </span>
                                                )}
                                            </div>
                                            {activity.description && (
                                                <p className="text-sm text-muted-foreground">{activity.description}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div>
                <Card>
                    <CardHeader>
                        <CardTitle>Log Activity</CardTitle>
                        <CardDescription>Record a new interaction</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="call">Call</SelectItem>
                                                    <SelectItem value="email">Email</SelectItem>
                                                    <SelectItem value="meeting">Meeting</SelectItem>
                                                    <SelectItem value="note">Note</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="subject"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Subject</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="e.g. Project kickoff" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Date</FormLabel>
                                            <FormControl>
                                                <Input {...field} type="date" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="done">Done</SelectItem>
                                                    <SelectItem value="todo">To Do</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} placeholder="Details about the interaction..." />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full">Log Activity</Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

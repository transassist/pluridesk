"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash, MoreVertical } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { serviceTypes } from "@/lib/constants/jobs";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { rateFormSchema, type RateFormValues } from "@/lib/validators/client-rates";
import { formatCurrency } from "@/lib/utils";

interface ClientRatesProps {
    clientId: string;
    defaultCurrency?: string;
}

export function ClientRates({ clientId, defaultCurrency = "USD" }: ClientRatesProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingRate, setEditingRate] = useState<any>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const supabase = createSupabaseBrowserClient();

    const { data: rates, isLoading } = useQuery({
        queryKey: ["client-rates", clientId],
        queryFn: async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase.from("client_rates") as any)
                .select("*")
                .eq("client_id", clientId)
                .order("service_type", { ascending: true });

            if (error) throw error;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return data as any[];
        },
    });

    const form = useForm<RateFormValues>({
        resolver: zodResolver(rateFormSchema),
        defaultValues: {
            service_type: "",
            source_language: "",
            target_language: "",
            unit: "word",
            rate: 0,
            currency: defaultCurrency,
        },
    });

    const createMutation = useMutation({
        mutationFn: async (values: RateFormValues) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase.from("client_rates") as any).insert({
                client_id: clientId,
                ...values,
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["client-rates", clientId] });
            toast({ title: "Rate added" });
            setIsDialogOpen(false);
            form.reset();
        },
        onError: (error) => {
            toast({ variant: "destructive", title: "Error", description: error.message });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (values: RateFormValues) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase.from("client_rates") as any)
                .update(values)
                .eq("id", editingRate.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["client-rates", clientId] });
            toast({ title: "Rate updated" });
            setIsDialogOpen(false);
            setEditingRate(null);
            form.reset();
        },
        onError: (error) => {
            toast({ variant: "destructive", title: "Error", description: error.message });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase.from("client_rates") as any).delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["client-rates", clientId] });
            toast({ title: "Rate deleted" });
        },
    });

    const onSubmit = (values: RateFormValues) => {
        if (editingRate) {
            updateMutation.mutate(values);
        } else {
            createMutation.mutate(values);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleEdit = (rate: any) => {
        setEditingRate(rate);
        form.reset({
            service_type: rate.service_type,
            source_language: rate.source_language || "",
            target_language: rate.target_language || "",
            unit: rate.unit,
            rate: rate.rate,
            currency: rate.currency,
        });
        setIsDialogOpen(true);
    };

    const handleAddNew = () => {
        setEditingRate(null);
        form.reset({
            service_type: "",
            source_language: "",
            target_language: "",
            unit: "word",
            rate: 0,
            currency: defaultCurrency,
        });
        setIsDialogOpen(true);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Rate Cards</CardTitle>
                    <CardDescription>Manage standard rates for this client</CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" onClick={handleAddNew}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Rate
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingRate ? "Edit Rate" : "Add Rate"}</DialogTitle>
                            <DialogDescription>
                                {editingRate ? "Update rate details." : "Define a new rate for a service."}
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="service_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Service Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select service type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {serviceTypes.map((type) => (
                                                        <SelectItem key={type} value={type}>
                                                            {type.replace("_", " ")}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="source_language"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Source Language</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="e.g. EN" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="target_language"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Target Language</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="e.g. FR" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="rate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Rate</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="number" step="0.01" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="currency"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Currency</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Currency" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="USD">USD</SelectItem>
                                                        <SelectItem value="EUR">EUR</SelectItem>
                                                        <SelectItem value="GBP">GBP</SelectItem>
                                                        <SelectItem value="CAD">CAD</SelectItem>
                                                        <SelectItem value="MAD">MAD</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="unit"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Unit</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Unit" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="word">Per Word</SelectItem>
                                                        <SelectItem value="hour">Per Hour</SelectItem>
                                                        <SelectItem value="page">Per Page</SelectItem>
                                                        <SelectItem value="flat">Flat Fee</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="submit">{editingRate ? "Save Changes" : "Create Rate"}</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="py-8 text-center text-muted-foreground">Loading rates...</div>
                ) : rates?.length === 0 ? (
                    <div className="py-10 text-center text-muted-foreground">
                        No rates defined yet.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Service</TableHead>
                                <TableHead>Languages</TableHead>
                                <TableHead>Rate</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rates?.map((rate) => (
                                <TableRow key={rate.id}>
                                    <TableCell className="font-medium">{rate.service_type}</TableCell>
                                    <TableCell>
                                        {rate.source_language && rate.target_language ? (
                                            <span className="flex items-center gap-1">
                                                <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                                                    {rate.source_language}
                                                </span>
                                                <span className="text-muted-foreground">→</span>
                                                <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                                                    {rate.target_language}
                                                </span>
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {formatCurrency(rate.rate, rate.currency)} / {rate.unit}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEdit(rate)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => {
                                                        if (confirm("Delete this rate?")) deleteMutation.mutate(rate.id);
                                                    }}
                                                >
                                                    <Trash className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

"use client";

import { useEffect } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Save, Send, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

const invoiceItemSchema = z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(0.01, "Quantity must be positive"),
    rate: z.number().min(0, "Rate must be positive"),
    amount: z.number(),
});

const invoiceSchema = z.object({
    client_id: z.string().min(1, "Client is required"),
    invoice_number: z.string().min(1, "Invoice number is required"),
    date: z.string().min(1, "Issue date is required"),
    due_date: z.string().min(1, "Due date is required"),
    currency: z.enum(["USD", "EUR", "GBP", "CAD", "MAD"]),
    items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
    notes: z.string().optional(),
    status: z.enum(["draft", "sent", "paid", "overdue"]),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceBuilderProps {
    initialData?: InvoiceFormValues & { id?: string };
}

export function InvoiceBuilder({ initialData }: InvoiceBuilderProps) {
    const router = useRouter();
    const { toast } = useToast();


    const { data: clients = [] } = useQuery<Database["public"]["Tables"]["clients"]["Row"][]>({
        queryKey: ["clients"],
        queryFn: async () => {
            const res = await fetch("/api/clients");
            if (!res.ok) throw new Error("Failed to fetch clients");
            const data = await res.json();
            return data.clients;
        },
    });

    const form = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: initialData || {
            invoice_number: "", // Will be populated
            date: new Date().toISOString().split("T")[0],
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            currency: "USD",
            items: [{ description: "", quantity: 1, rate: 0, amount: 0 }],
            status: "draft",
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    const watchItems = useWatch({
        control: form.control,
        name: "items",
    });

    const watchCurrency = useWatch({
        control: form.control,
        name: "currency",
    });

    // Auto-calculate item amounts and totals
    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (name?.includes("items")) {
                // Recalculate totals logic could go here if we wanted real-time updates on every keystroke
                // But we handle it in the render for totals
            }
        });
        return () => subscription.unsubscribe();
    }, [form]);

    // Fetch next invoice number only if not editing
    useEffect(() => {
        if (initialData) return;

        const fetchNextNumber = async () => {
            try {
                const res = await fetch("/api/invoices/next-number");
                if (res.ok) {
                    const data = await res.json();
                    form.setValue("invoice_number", data.nextNumber);
                }
            } catch (error) {
                console.error("Failed to fetch next invoice number", error);
            }
        };
        fetchNextNumber();
    }, [form, initialData]);

    const totals = watchItems.reduce(
        (acc, item) => {
            const amount = (item.quantity || 0) * (item.rate || 0);
            return {
                subtotal: acc.subtotal + amount,
                tax: 0, // Implement tax logic later if needed
                total: acc.subtotal + amount,
            };
        },
        { subtotal: 0, tax: 0, total: 0 }
    );

    const mutation = useMutation({
        mutationFn: async (values: InvoiceFormValues) => {
            const payload = {
                ...values,
                items: values.items.map(item => ({
                    ...item,
                    amount: item.quantity * item.rate
                })),
                subtotal: totals.subtotal,
                tax_amount: totals.tax,
                total: totals.total,
            };

            const url = initialData?.id
                ? `/api/invoices/${initialData.id}`
                : "/api/invoices";

            const method = initialData?.id ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to save invoice");
            }

            return res.json();
        },
        onSuccess: (data) => {
            toast({ title: initialData?.id ? "Invoice updated" : "Invoice created" });
            router.push(`/invoices/${data.invoice.id}`);
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const onSubmit = (values: InvoiceFormValues) => {
        mutation.mutate(values);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-2xl font-bold">{initialData ? "Edit Invoice" : "New Invoice"}</h1>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                form.setValue("status", "draft");
                                form.handleSubmit(onSubmit)();
                            }}
                            disabled={mutation.isPending}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Save Draft
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                form.setValue("status", "sent");
                                form.handleSubmit(onSubmit)();
                            }}
                            disabled={mutation.isPending}
                        >
                            <Send className="mr-2 h-4 w-4" />
                            Save & Send
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-6 md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Invoice Details</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="client_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Client</FormLabel>
                                            <Select
                                                onValueChange={(value) => {
                                                    field.onChange(value);
                                                    const client = clients.find((c) => c.id === value);
                                                    if (client?.default_currency) {
                                                        form.setValue("currency", client.default_currency);
                                                    }
                                                }}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select client" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {clients.map((client) => (
                                                        <SelectItem key={client.id} value={client.id}>
                                                            {client.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="invoice_number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Invoice Number</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
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
                                            <FormLabel>Issue Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="due_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Due Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
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
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select currency" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {["USD", "EUR", "GBP", "CAD", "MAD"].map((curr) => (
                                                        <SelectItem key={curr} value={curr}>
                                                            {curr}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Items</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex gap-4 items-start">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.description`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl>
                                                        <Input placeholder="Description" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.quantity`}
                                            render={({ field }) => (
                                                <FormItem className="w-24">
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            placeholder="Qty"
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.rate`}
                                            render={({ field }) => (
                                                <FormItem className="w-32">
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            placeholder="Rate"
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <div className="w-32 py-2 text-right font-medium">
                                            {formatCurrency(
                                                (watchItems[index]?.quantity || 0) * (watchItems[index]?.rate || 0),
                                                watchCurrency
                                            )}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => remove(index)}
                                            disabled={fields.length === 1}
                                        >
                                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ description: "", quantity: 1, rate: 0, amount: 0 })}
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add Item
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Payment instructions, thank you note, etc."
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatCurrency(totals.subtotal, watchCurrency)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Tax (0%)</span>
                                    <span>{formatCurrency(totals.tax, watchCurrency)}</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>{formatCurrency(totals.total, watchCurrency)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </Form>
    );
}

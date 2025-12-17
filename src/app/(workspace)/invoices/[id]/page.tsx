"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import {
    ArrowLeft,
    Download,
    Mail,
    Trash2,
    Pencil,
    Loader2,
    MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";
import { WorkspaceShell } from "@/components/layout/workspace-shell";

import type { Database } from "@/lib/supabase/types";
import { PaymentModal } from "@/components/invoices/payment-modal";
import { generateInvoicePDF } from "@/lib/pdf/generate-invoice";

type InvoiceWithDetails = Database["public"]["Tables"]["invoices"]["Row"] & {
    clients: Database["public"]["Tables"]["clients"]["Row"] | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payments: any[];
};

const statusVariants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline" | "muted"
> = {
    draft: "muted",
    sent: "secondary",
    paid: "default",
    overdue: "destructive",
};

export default function InvoiceDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const { toast } = useToast();


    const { data: invoice, isLoading, error } = useQuery<InvoiceWithDetails>({
        queryKey: ["invoice", id],
        queryFn: async () => {
            const res = await fetch(`/api/invoices/${id}`);
            if (!res.ok) throw new Error("Failed to fetch invoice");
            const data = await res.json();
            return data.invoice;
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/invoices/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete invoice");
        },
        onSuccess: () => {
            toast({ title: "Invoice deleted" });
            router.push("/invoices");
        },
        onError: (err) => {
            toast({
                title: "Error",
                description: err.message,
                variant: "destructive",
            });
        },
    });

    if (isLoading) {
        return (
            <WorkspaceShell>
                <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </WorkspaceShell>
        );
    }

    if (error || !invoice) {
        return (
            <WorkspaceShell>
                <div className="flex flex-col items-center justify-center gap-4 py-10">
                    <p className="text-destructive">Failed to load invoice</p>
                    <Button variant="outline" onClick={() => router.push("/invoices")}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
                    </Button>
                </div>
            </WorkspaceShell>
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (invoice.items as any[]) || [];
    const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const outstanding = (invoice.total || 0) - totalPaid;

    return (
        <WorkspaceShell
            title={
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/invoices")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex flex-col">
                        <span className="text-lg font-semibold">
                            Invoice {invoice.invoice_number}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Issued on {invoice.date ? format(new Date(invoice.date), "MMM d, yyyy") : "—"}
                        </span>
                    </div>
                    <Badge variant={statusVariants[invoice.status]}>
                        {invoice.status}
                    </Badge>
                </div>
            }
            actions={
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => generateInvoicePDF(invoice)}>
                        <Download className="mr-2 h-4 w-4" /> PDF
                    </Button>
                    <Button variant="outline" size="sm">
                        <Mail className="mr-2 h-4 w-4" /> Send
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/invoices/${id}/edit`)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                    if (confirm("Delete this invoice?")) deleteMutation.mutate();
                                }}
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            }
        >
            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Content */}
                <div className="space-y-6 md:col-span-2">
                    {/* Invoice Document */}
                    <Card>
                        <CardContent className="p-8">
                            <div className="mb-8 flex justify-between">
                                <div>
                                    <h3 className="font-semibold text-muted-foreground">From</h3>
                                    <div className="mt-2 text-sm">
                                        <p className="font-medium">PluriDesk Owner</p>
                                        <p>123 Business Rd</p>
                                        <p>City, Country</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h3 className="font-semibold text-muted-foreground">Bill To</h3>
                                    <div className="mt-2 text-sm">
                                        <p className="font-medium">{invoice.clients?.name}</p>
                                        <p className="whitespace-pre-wrap">{invoice.clients?.address}</p>
                                        <p>{invoice.clients?.email}</p>
                                    </div>
                                </div>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                        <TableHead className="text-right">Rate</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{item.description}</TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(item.rate, invoice.currency)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(item.amount, invoice.currency)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <div className="mt-6 flex justify-end">
                                <div className="w-1/2 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>{formatCurrency(invoice.subtotal || 0, invoice.currency)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Tax</span>
                                        <span>{formatCurrency(invoice.tax_amount || 0, invoice.currency)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-semibold">
                                        <span>Total</span>
                                        <span>{formatCurrency(invoice.total || 0, invoice.currency)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Amount Paid</span>
                                        <span>{formatCurrency(totalPaid, invoice.currency)}</span>
                                    </div>
                                    <div className="flex justify-between font-medium text-orange-600">
                                        <span>Balance Due</span>
                                        <span>{formatCurrency(outstanding, invoice.currency)}</span>
                                    </div>
                                </div>
                            </div>

                            {invoice.notes && (
                                <div className="mt-8">
                                    <h4 className="mb-2 text-sm font-semibold text-muted-foreground">
                                        Notes
                                    </h4>
                                    <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Issue Date</span>
                                <span>
                                    {invoice.date ? format(new Date(invoice.date), "MMM d, yyyy") : "—"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Due Date</span>
                                <span>
                                    {invoice.due_date
                                        ? format(new Date(invoice.due_date), "MMM d, yyyy")
                                        : "—"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Currency</span>
                                <span>{invoice.currency}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Payments</CardTitle>
                            {outstanding > 0 && (
                                <PaymentModal
                                    invoiceId={invoice.id}
                                    currency={invoice.currency}
                                    outstanding={outstanding}
                                />
                            )}
                        </CardHeader>
                        <CardContent>
                            {invoice.payments.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No payments recorded</p>
                            ) : (
                                <div className="space-y-4">
                                    {invoice.payments.map((payment) => (
                                        <div
                                            key={payment.id}
                                            className="flex items-center justify-between text-sm"
                                        >
                                            <div>
                                                <p className="font-medium">
                                                    {formatCurrency(payment.amount, invoice.currency)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(payment.date), "MMM d")} • {payment.method}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </WorkspaceShell>
    );
}

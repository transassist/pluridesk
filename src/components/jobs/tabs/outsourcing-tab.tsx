"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus, Trash2, Loader2, Check, ChevronsUpDown, Search,
    Calendar as CalendarIcon, TrendingUp, TrendingDown, DollarSign,
    Languages, FileText, Clock, CheckCircle2, Package, Zap
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { OUTSOURCING_STATUSES, OUTSOURCING_UNITS } from "@/lib/validators/outsourcing";
import type { Database } from "@/lib/supabase/types";

type Supplier = Database["public"]["Tables"]["suppliers"]["Row"];
type SupplierRate = Database["public"]["Tables"]["supplier_rates"]["Row"];
type Job = Database["public"]["Tables"]["jobs"]["Row"];

interface OutsourcingTabProps {
    jobId: string;
    job: Job;
}

// Status badge colors
const statusColors: Record<string, string> = {
    pending: "bg-slate-100 text-slate-700 border-slate-200",
    assigned: "bg-blue-100 text-blue-700 border-blue-200",
    in_progress: "bg-amber-100 text-amber-700 border-amber-200",
    delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
    completed: "bg-green-100 text-green-700 border-green-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
};

export function OutsourcingTab({ jobId, job }: OutsourcingTabProps) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const { toast } = useToast();

    // Form State - initialized from job data
    const [service, setService] = useState("");
    const [sourceLanguage, setSourceLanguage] = useState("");
    const [targetLanguage, setTargetLanguage] = useState("");
    const [unit, setUnit] = useState("");
    const [quantity, setQuantity] = useState("");
    const [selectedSupplier, setSelectedSupplier] = useState("");
    const [rate, setRate] = useState("");
    const [cost, setCost] = useState("");
    const [notes, setNotes] = useState("");
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
    const [status, setStatus] = useState("pending");

    // Supplier rates for auto-fill
    const [supplierRates, setSupplierRates] = useState<SupplierRate[]>([]);
    const [selectedRateId, setSelectedRateId] = useState("");

    // Combobox state
    const [openCombobox, setOpenCombobox] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Expense creation dialog state (triggered when marking as delivered)
    const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
    const [pendingDeliveryItem, setPendingDeliveryItem] = useState<{
        id: string;
        supplierName: string;
        supplierId: string;
        amount: number;
        currency: string;
        serviceType: string;
    } | null>(null);
    const [expenseMarkAsPaid, setExpenseMarkAsPaid] = useState(false);

    const supabase = createClient();
    const queryClient = useQueryClient();

    // Pre-fill form when dialog opens
    useEffect(() => {
        if (isAddOpen) {
            // Smart pre-fill from job data
            setService(job.service_type || "");
            setSourceLanguage(job.language_pair_source || "");
            setTargetLanguage(job.language_pair_target || "");
            setUnit(job.unit || "word");
            setQuantity(job.quantity?.toString() || "");
            if (job.due_date) {
                setDueDate(new Date(job.due_date));
            }
            // Reset other fields
            setSelectedSupplier("");
            setRate("");
            setCost("");
            setNotes("");
            setStartDate(undefined);
            setStatus("pending");
            setSupplierRates([]);
            setSelectedRateId("");
        }
    }, [isAddOpen, job]);

    // Fetch supplier rates when supplier is selected
    useEffect(() => {
        if (selectedSupplier) {
            fetchSupplierRates(selectedSupplier);
        } else {
            setSupplierRates([]);
            setRate("");
            setCost("");
        }
    }, [selectedSupplier]);

    // Auto-calculate cost when rate or quantity changes
    useEffect(() => {
        const rateNum = parseFloat(rate) || 0;
        const quantityNum = parseFloat(quantity) || 0;
        if (rateNum > 0 && quantityNum > 0) {
            setCost((rateNum * quantityNum).toFixed(2));
        }
    }, [rate, quantity]);

    const fetchSupplierRates = async (supplierId: string) => {
        try {
            const response = await fetch(`/api/suppliers/${supplierId}/rates`);
            if (response.ok) {
                const data = await response.json();
                setSupplierRates(data.rates || []);

                // Auto-match rate based on job service type
                const matchingRate = data.rates?.find(
                    (r: SupplierRate) => r.service_name?.toLowerCase() === job.service_type?.toLowerCase()
                );
                if (matchingRate) {
                    setRate(matchingRate.rate.toString());
                    setSelectedRateId(matchingRate.id);
                    toast({
                        title: "Rate Auto-Applied",
                        description: `${matchingRate.service_name}: ${formatCurrency(matchingRate.rate, matchingRate.currency)}/${matchingRate.unit}`,
                    });
                }
            }
        } catch (error) {
            console.error("Error fetching supplier rates:", error);
        }
    };

    // Fetch outsourcing data
    const { data: outsourcing = [], isLoading } = useQuery({
        queryKey: ["job-outsourcing", jobId],
        queryFn: async () => {
            const response = await fetch(`/api/outsourcing`);
            if (!response.ok) throw new Error("Failed to fetch");
            const data = await response.json();
            // Filter for this job only
            return (data.outsourcing || []).filter((o: { job_id: string }) => o.job_id === jobId);
        },
    });

    // Fetch suppliers for dropdown (using API route to bypass RLS)
    const { data: suppliers = [] } = useQuery({
        queryKey: ["suppliers"],
        queryFn: async () => {
            const response = await fetch("/api/suppliers");
            if (!response.ok) throw new Error("Failed to fetch suppliers");
            const data = await response.json();
            return (data.suppliers || []) as Supplier[];
        },
    });

    const addOutsourcingMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch("/api/outsourcing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    job_id: jobId,
                    supplier_id: selectedSupplier,
                    supplier_total: parseFloat(cost) || 0,
                    supplier_rate: parseFloat(rate) || 0,
                    supplier_currency: job.currency,
                    notes: notes || null,
                    service_type: service || null,
                    unit: unit || null,
                    quantity: quantity ? parseFloat(quantity) : null,
                    source_language: sourceLanguage || null,
                    target_language: targetLanguage || null,
                    start_date: startDate ? startDate.toISOString().split("T")[0] : null,
                    due_date: dueDate ? dueDate.toISOString().split("T")[0] : null,
                    status: status,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error?.error ?? "Failed to create outsourcing");
            }

            return response.json();
        },
        onSuccess: () => {
            setIsAddOpen(false);
            queryClient.invalidateQueries({ queryKey: ["job-outsourcing", jobId] });
            queryClient.invalidateQueries({ queryKey: ["jobs", jobId] });
            toast({
                title: "Success",
                description: "Outsourcing task created successfully",
            });
        },
        onError: (error: Error) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        },
    });

    const deleteOutsourcingMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/outsourcing?id=${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error?.error ?? "Failed to delete outsourcing");
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["job-outsourcing", jobId] });
            queryClient.invalidateQueries({ queryKey: ["jobs", jobId] });
            toast({
                title: "Deleted",
                description: "Outsourcing record removed",
            });
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
            const response = await fetch(`/api/outsourcing?id=${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) throw new Error("Failed to update status");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["job-outsourcing", jobId] });
            toast({ title: "Status Updated" });
        },
    });

    // Handle status change - show expense dialog when marking as delivered
    const handleStatusChange = (item: {
        id: string;
        suppliers?: { name: string } | null;
        supplier_id?: string;
        supplier_total?: number | null;
        supplier_currency?: string;
        service_type?: string | null;
    }, newStatus: string) => {
        if (newStatus === "delivered") {
            // Show expense creation dialog
            setPendingDeliveryItem({
                id: item.id,
                supplierName: item.suppliers?.name || "Unknown Supplier",
                supplierId: item.supplier_id || "",
                amount: item.supplier_total || 0,
                currency: item.supplier_currency || job.currency,
                serviceType: item.service_type || "Outsourcing",
            });
            setExpenseMarkAsPaid(false);
            setIsExpenseDialogOpen(true);
        } else {
            updateStatusMutation.mutate({ id: item.id, newStatus });
        }
    };

    // Create expense mutation
    const createExpenseMutation = useMutation({
        mutationFn: async () => {
            if (!pendingDeliveryItem) throw new Error("No item selected");

            // First update the outsourcing status to delivered
            await fetch(`/api/outsourcing?id=${pendingDeliveryItem.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: "delivered",
                    paid: expenseMarkAsPaid,
                }),
            });

            // Then create the expense
            const response = await fetch("/api/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: pendingDeliveryItem.amount,
                    category: "Outsourcing",
                    currency: pendingDeliveryItem.currency,
                    date: new Date().toISOString().split("T")[0],
                    supplier_id: pendingDeliveryItem.supplierId,
                    supplier_name: pendingDeliveryItem.supplierName,
                    notes: `${pendingDeliveryItem.serviceType} for Job ${job.job_code || job.title}`,
                }),
            });

            if (!response.ok) throw new Error("Failed to create expense");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["job-outsourcing", jobId] });
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
            setIsExpenseDialogOpen(false);
            setPendingDeliveryItem(null);
            toast({
                title: "Delivered & Expense Created",
                description: `Expense of ${formatCurrency(pendingDeliveryItem?.amount || 0, pendingDeliveryItem?.currency || "USD")} added for ${pendingDeliveryItem?.supplierName}`,
            });
        },
        onError: (error: Error) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        },
    });

    const togglePaidMutation = useMutation({
        mutationFn: async ({ id, paid }: { id: string; paid: boolean }) => {
            const response = await fetch(`/api/outsourcing?id=${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paid }),
            });

            if (!response.ok) throw new Error("Failed to update");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["job-outsourcing", jobId] });
            toast({ title: "Payment status updated" });
        },
    });

    // Calculate profitability metrics
    const totalOutsourced = useMemo(() =>
        outsourcing.reduce((sum: number, item: { supplier_total?: number }) => sum + (item.supplier_total || 0), 0),
        [outsourcing]
    );

    const profitMargin = useMemo(() => {
        const revenue = job.total_amount || 0;
        if (revenue === 0) return 0;
        return ((revenue - totalOutsourced) / revenue) * 100;
    }, [job.total_amount, totalOutsourced]);

    const profitColor = profitMargin >= 30 ? "text-green-600" : profitMargin >= 10 ? "text-amber-600" : "text-red-600";

    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedSupplierName = suppliers.find(s => s.id === selectedSupplier)?.name;

    return (
        <div className="space-y-6">
            {/* Profitability Dashboard */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Job Revenue
                        </CardDescription>
                        <CardTitle className="text-xl">
                            {formatCurrency(job.total_amount || 0, job.currency)}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-l-4 border-l-amber-500">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            Total Outsourced
                        </CardDescription>
                        <CardTitle className="text-xl">
                            {formatCurrency(totalOutsourced, job.currency)}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1">
                            {profitMargin >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            Net Profit
                        </CardDescription>
                        <CardTitle className="text-xl">
                            {formatCurrency((job.total_amount || 0) - totalOutsourced, job.currency)}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className={cn("border-l-4", profitMargin >= 30 ? "border-l-green-500" : profitMargin >= 10 ? "border-l-amber-500" : "border-l-red-500")}>
                    <CardHeader className="pb-2">
                        <CardDescription>Profit Margin</CardDescription>
                        <CardTitle className={cn("text-xl", profitColor)}>
                            {profitMargin.toFixed(1)}%
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Main Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Outsourced Tasks</CardTitle>
                        <CardDescription>
                            {outsourcing.length} task{outsourcing.length !== 1 ? "s" : ""} outsourced for this job
                        </CardDescription>
                    </div>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Zap className="h-4 w-4" />
                                Quick Outsource
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-amber-500" />
                                    Smart Outsource
                                </DialogTitle>
                                <DialogDescription>
                                    Pre-filled from job data. Select a supplier to auto-match rates.
                                </DialogDescription>
                            </DialogHeader>

                            {/* Job Data Preview */}
                            <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Service:</span>
                                    <Badge variant="secondary">{job.service_type}</Badge>
                                </div>
                                {job.language_pair_source && job.language_pair_target && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Languages:</span>
                                        <span className="font-medium">{job.language_pair_source} → {job.language_pair_target}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Quantity:</span>
                                    <span className="font-medium">{job.quantity?.toLocaleString()} {job.unit}</span>
                                </div>
                            </div>

                            <div className="space-y-4 py-2">
                                {/* Supplier Selection */}
                                <div className="space-y-2">
                                    <Label>Supplier</Label>
                                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openCombobox}
                                                className="w-full justify-between"
                                            >
                                                {selectedSupplierName || "Select supplier..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0" align="start">
                                            <div className="p-2">
                                                <div className="flex items-center gap-2 px-2 pb-2">
                                                    <Search className="h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Search suppliers..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="h-8 border-0 focus-visible:ring-0"
                                                    />
                                                </div>
                                                <ScrollArea className="h-[200px]">
                                                    {filteredSuppliers.length === 0 ? (
                                                        <div className="py-6 text-center text-sm text-muted-foreground">
                                                            No suppliers found.
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            {filteredSuppliers.map((supplier) => (
                                                                <Button
                                                                    key={supplier.id}
                                                                    variant="ghost"
                                                                    className="w-full justify-start font-normal"
                                                                    onClick={() => {
                                                                        setSelectedSupplier(supplier.id);
                                                                        setOpenCombobox(false);
                                                                        setSearchQuery("");
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            selectedSupplier === supplier.id
                                                                                ? "opacity-100"
                                                                                : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {supplier.name}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </ScrollArea>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Rate Selection (if supplier has rates) */}
                                {supplierRates.length > 0 && (
                                    <div className="space-y-2">
                                        <Label>Supplier Rate Card</Label>
                                        <Select value={selectedRateId} onValueChange={(value) => {
                                            setSelectedRateId(value);
                                            const selectedRate = supplierRates.find(r => r.id === value);
                                            if (selectedRate) {
                                                setRate(selectedRate.rate.toString());
                                                setUnit(selectedRate.unit);
                                            }
                                        }}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select rate..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {supplierRates.map((rateItem) => (
                                                    <SelectItem key={rateItem.id} value={rateItem.id}>
                                                        {rateItem.service_name}: {formatCurrency(rateItem.rate, rateItem.currency)}/{rateItem.unit}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* Service & Languages (editable) */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Service</Label>
                                        <Input
                                            value={service}
                                            onChange={(e) => setService(e.target.value)}
                                            placeholder="Translation, Editing..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Unit</Label>
                                        <Select value={unit} onValueChange={setUnit}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {OUTSOURCING_UNITS.map((u) => (
                                                    <SelectItem key={u.value} value={u.value}>
                                                        {u.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Source Language</Label>
                                        <Input
                                            value={sourceLanguage}
                                            onChange={(e) => setSourceLanguage(e.target.value)}
                                            placeholder="EN, FR..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Target Language</Label>
                                        <Input
                                            value={targetLanguage}
                                            onChange={(e) => setTargetLanguage(e.target.value)}
                                            placeholder="FR, DE..."
                                        />
                                    </div>
                                </div>

                                {/* Quantity, Rate, Total */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-2">
                                        <Label>Quantity</Label>
                                        <Input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Rate</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={rate}
                                            onChange={(e) => setRate(e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Total ({job.currency})</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={cost}
                                            onChange={(e) => setCost(e.target.value)}
                                            className="font-semibold"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Start Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {startDate ? formatDate(startDate.toISOString()) : "Pick date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Due Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {dueDate ? formatDate(dueDate.toISOString()) : "Pick date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={dueDate} onSelect={setDueDate} />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <Label>Notes</Label>
                                    <Textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Instructions for supplier..."
                                        rows={2}
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => addOutsourcingMutation.mutate()}
                                    disabled={!selectedSupplier || addOutsourcingMutation.isPending}
                                >
                                    {addOutsourcingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Outsourcing
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>

                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : outsourcing.length === 0 ? (
                        <div className="py-10 text-center space-y-4">
                            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-medium">No outsourcing yet</p>
                                <p className="text-sm text-muted-foreground">
                                    Click &quot;Quick Outsource&quot; to assign this job to a supplier
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {outsourcing.map((item: {
                                id: string;
                                suppliers?: { name: string } | null;
                                service_type?: string | null;
                                source_language?: string | null;
                                target_language?: string | null;
                                quantity?: number | null;
                                unit?: string | null;
                                supplier_rate?: number | null;
                                supplier_total?: number | null;
                                supplier_currency?: string;
                                status?: string | null;
                                paid?: boolean;
                                start_date?: string | null;
                                due_date?: string | null;
                            }) => (
                                <div
                                    key={item.id}
                                    className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-2">
                                            {/* Header */}
                                            <div className="flex items-center gap-3">
                                                <span className="font-semibold text-lg">
                                                    {item.suppliers?.name || "Unknown Supplier"}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className={cn("capitalize", statusColors[item.status || "pending"])}
                                                >
                                                    {item.status?.replace("_", " ") || "pending"}
                                                </Badge>
                                                {item.paid && (
                                                    <Badge variant="default" className="bg-green-600">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        Paid
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                                {item.service_type && (
                                                    <span className="flex items-center gap-1">
                                                        <FileText className="h-3 w-3" />
                                                        {item.service_type}
                                                    </span>
                                                )}
                                                {item.source_language && item.target_language && (
                                                    <span className="flex items-center gap-1">
                                                        <Languages className="h-3 w-3" />
                                                        {item.source_language} → {item.target_language}
                                                    </span>
                                                )}
                                                {item.quantity && (
                                                    <span>
                                                        {item.quantity.toLocaleString()} {item.unit || "units"}
                                                    </span>
                                                )}
                                                {(item.start_date || item.due_date) && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {item.start_date && formatDate(item.start_date)}
                                                        {item.start_date && item.due_date && " → "}
                                                        {item.due_date && formatDate(item.due_date)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Cost & Actions */}
                                        <div className="text-right space-y-2">
                                            <div>
                                                {item.supplier_rate && (
                                                    <p className="text-sm text-muted-foreground">
                                                        @ {formatCurrency(item.supplier_rate, item.supplier_currency || job.currency)}/{item.unit || "unit"}
                                                    </p>
                                                )}
                                                <p className="text-lg font-bold">
                                                    {formatCurrency(item.supplier_total || 0, item.supplier_currency || job.currency)}
                                                </p>
                                            </div>
                                            <div className="flex gap-1 justify-end">
                                                <Select
                                                    value={item.status || "pending"}
                                                    onValueChange={(value) => handleStatusChange(item, value)}
                                                >
                                                    <SelectTrigger className="h-8 w-[130px] text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {OUTSOURCING_STATUSES.map((s) => (
                                                            <SelectItem key={s.value} value={s.value}>
                                                                {s.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    variant={item.paid ? "secondary" : "outline"}
                                                    size="sm"
                                                    className="h-8"
                                                    onClick={() => togglePaidMutation.mutate({ id: item.id, paid: !item.paid })}
                                                >
                                                    {item.paid ? "Unpay" : "Pay"}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    onClick={() => {
                                                        if (confirm("Delete this outsourcing record?")) {
                                                            deleteOutsourcingMutation.mutate(item.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Expense Creation Dialog (shown when marking as delivered) */}
            <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            Create Expense for Delivery
                        </DialogTitle>
                        <DialogDescription>
                            The supplier delivered the work. Create an expense record to track this cost.
                        </DialogDescription>
                    </DialogHeader>

                    {pendingDeliveryItem && (
                        <div className="space-y-4 py-4">
                            {/* Expense Details */}
                            <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Supplier:</span>
                                    <span className="font-medium">{pendingDeliveryItem.supplierName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Service:</span>
                                    <span className="font-medium">{pendingDeliveryItem.serviceType}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Amount:</span>
                                    <span className="font-bold text-lg">
                                        {formatCurrency(pendingDeliveryItem.amount, pendingDeliveryItem.currency)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Date:</span>
                                    <span className="font-medium">{formatDate(new Date().toISOString())}</span>
                                </div>
                            </div>

                            {/* Mark as Paid Toggle */}
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div>
                                    <p className="font-medium">Mark as Paid</p>
                                    <p className="text-sm text-muted-foreground">
                                        Has this expense been paid already?
                                    </p>
                                </div>
                                <Button
                                    variant={expenseMarkAsPaid ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setExpenseMarkAsPaid(!expenseMarkAsPaid)}
                                    className={expenseMarkAsPaid ? "bg-green-600 hover:bg-green-700" : ""}
                                >
                                    {expenseMarkAsPaid ? (
                                        <>
                                            <CheckCircle2 className="mr-1 h-4 w-4" />
                                            Paid
                                        </>
                                    ) : (
                                        "Not Paid"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => {
                            setIsExpenseDialogOpen(false);
                            setPendingDeliveryItem(null);
                        }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => createExpenseMutation.mutate()}
                            disabled={createExpenseMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {createExpenseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm & Create Expense
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

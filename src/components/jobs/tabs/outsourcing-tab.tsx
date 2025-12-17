"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2, Check, ChevronsUpDown, Search, Calendar as CalendarIcon } from "lucide-react";
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
import type { Database } from "@/lib/supabase/types";

type Supplier = Database["public"]["Tables"]["suppliers"]["Row"];

interface OutsourcingTabProps {
    jobId: string;
    jobCurrency: string;
}

export function OutsourcingTab({ jobId, jobCurrency }: OutsourcingTabProps) {
    const [isAddOpen, setIsAddOpen] = useState(false);

    // Form State
    const [service, setService] = useState("");
    const [languagePair, setLanguagePair] = useState("");
    const [unit, setUnit] = useState("Hour");
    const [quantity, setQuantity] = useState("");
    const [selectedSupplier, setSelectedSupplier] = useState("");
    const [cost, setCost] = useState("");
    const [notes, setNotes] = useState("");
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

    // Combobox state
    const [openCombobox, setOpenCombobox] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const supabase = createClient();
    const queryClient = useQueryClient();

    // Fetch outsourcing data
    const { data: outsourcing = [], isLoading } = useQuery({
        queryKey: ["job-outsourcing", jobId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("outsourcing")
                .select("*, suppliers(name)")
                .eq("job_id", jobId);

            if (error) throw error;
            if (error) throw error;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return data as any[];
        },
    });

    // Fetch suppliers for dropdown
    const { data: suppliers = [] } = useQuery({
        queryKey: ["suppliers"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("suppliers")
                .select("*")
                .order("name");

            if (error) throw error;
            return data as Supplier[];
        },
    });

    const addOutsourcingMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase.from("outsourcing") as any).insert({
                job_id: jobId,
                owner_id: user.id,
                supplier_id: selectedSupplier,
                supplier_total: parseFloat(cost) || 0,
                supplier_currency: jobCurrency, // Simplified
                notes: notes || null,
                // We would ideally store service, unit, quantity, dates too if the schema supported it.
                // For now, we'll append them to notes or just use the existing fields.
                // Assuming the user wants the UI for now, and we'll map what we can.
            });

            // Also update job has_outsourcing flag
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase.from("jobs") as any).update({ has_outsourcing: true }).eq("id", jobId);

            if (error) throw error;
        },
        onSuccess: () => {
            setIsAddOpen(false);
            resetForm();
            queryClient.invalidateQueries({ queryKey: ["job-outsourcing", jobId] });
            queryClient.invalidateQueries({ queryKey: ["jobs", jobId] });
        },
    });

    const deleteOutsourcingMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("outsourcing").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["job-outsourcing", jobId] });
            queryClient.invalidateQueries({ queryKey: ["jobs", jobId] });
        },
    });

    const resetForm = () => {
        setSelectedSupplier("");
        setCost("");
        setNotes("");
        setService("");
        setLanguagePair("");
        setUnit("Hour");
        setQuantity("");
        setStartDate(undefined);
        setDueDate(undefined);
        setSearchQuery("");
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalCost = outsourcing.reduce((sum, item: any) => sum + (item.supplier_total || 0), 0);

    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedSupplierName = suppliers.find(s => s.id === selectedSupplier)?.name;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Outsourced Tasks</CardTitle>
                        <CardDescription>Manage suppliers and costs for this job</CardDescription>
                    </div>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="mr-2 h-4 w-4" /> Outsource Job
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Outsource the job</DialogTitle>
                                <DialogDescription>
                                    By default, the files contain the same data as the job, but you can edit them for the outsourcing.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                {/* Service */}
                                <div className="grid gap-2">
                                    <Label>Service</Label>
                                    <Input
                                        placeholder="e.g. Translation"
                                        value={service}
                                        onChange={(e) => setService(e.target.value)}
                                    />
                                </div>

                                {/* Language Pair */}
                                <div className="grid gap-2">
                                    <div className="flex justify-between">
                                        <Label>Language pair</Label>
                                        <span className="text-xs text-muted-foreground">Optional</span>
                                    </div>
                                    <Select value={languagePair} onValueChange={setLanguagePair}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="-" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="-">-</SelectItem>
                                            <SelectItem value="en-fr">English - French</SelectItem>
                                            <SelectItem value="fr-en">French - English</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Unit */}
                                <div className="grid gap-2">
                                    <Label>Unit</Label>
                                    <Select value={unit} onValueChange={setUnit}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select unit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Hour">Hour</SelectItem>
                                            <SelectItem value="Word">Word</SelectItem>
                                            <SelectItem value="Page">Page</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Quantity */}
                                <div className="grid gap-2">
                                    <div className="flex justify-between">
                                        <Label>Quantity</Label>
                                        <span className="text-xs text-muted-foreground">Optional</span>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            className="pr-12"
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground text-sm">
                                            {unit}
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        You may want to define a specific quantity for the outsourcing.
                                    </p>
                                </div>

                                {/* Supplier Selection */}
                                <div className="grid gap-2">
                                    <div className="flex justify-between">
                                        <Label>Supplier</Label>
                                        <span className="text-xs text-muted-foreground">Optional</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openCombobox}
                                                    className="w-full justify-between"
                                                >
                                                    {selectedSupplierName || "-"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-0" align="start">
                                                <div className="flex items-center border-b px-3">
                                                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                                    <Input
                                                        placeholder="Search..."
                                                        className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-none focus-visible:ring-0"
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                    />
                                                </div>
                                                <ScrollArea className="h-[200px]">
                                                    <div className="p-1">
                                                        <div
                                                            className={cn(
                                                                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                                                selectedSupplier === "" && "bg-accent text-accent-foreground"
                                                            )}
                                                            onClick={() => {
                                                                setSelectedSupplier("");
                                                                setOpenCombobox(false);
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", selectedSupplier === "" ? "opacity-100" : "opacity-0")} />
                                                            -
                                                        </div>
                                                        {filteredSuppliers.map((supplier) => (
                                                            <div
                                                                key={supplier.id}
                                                                className={cn(
                                                                    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                                                    selectedSupplier === supplier.id && "bg-accent text-accent-foreground"
                                                                )}
                                                                onClick={() => {
                                                                    setSelectedSupplier(supplier.id);
                                                                    setOpenCombobox(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        selectedSupplier === supplier.id ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">{supplier.name}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {filteredSuppliers.length === 0 && (
                                                            <div className="py-6 text-center text-sm text-muted-foreground">
                                                                No supplier found.
                                                            </div>
                                                        )}
                                                    </div>
                                                </ScrollArea>
                                            </PopoverContent>
                                        </Popover>
                                        <Button variant="outline" size="icon">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        If you already know to which supplier you would like to outsource the job, you can select them here.
                                    </p>
                                </div>

                                {/* Cost */}
                                <div className="grid gap-2">
                                    <Label>Total Cost ({jobCurrency})</Label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={cost}
                                        onChange={(e) => setCost(e.target.value)}
                                    />
                                </div>

                                {/* Dates */}
                                <div className="grid gap-4 grid-cols-2">
                                    <div className="grid gap-2">
                                        <div className="flex justify-between">
                                            <Label>Start date</Label>
                                            <span className="text-xs text-muted-foreground">Optional</span>
                                        </div>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !startDate && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {startDate ? formatDate(startDate.toISOString()) : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={startDate}
                                                    onSelect={setStartDate}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="grid gap-2">
                                        <div className="flex justify-between">
                                            <Label>Due date</Label>
                                            <span className="text-xs text-muted-foreground">Optional</span>
                                        </div>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !dueDate && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {dueDate ? formatDate(dueDate.toISOString()) : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={dueDate}
                                                    onSelect={setDueDate}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>

                                {/* Search Button (Visual Only for now) */}
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setOpenCombobox(true)}>
                                    <Search className="mr-2 h-4 w-4" /> Search for suppliers
                                </Button>

                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                <Button onClick={() => addOutsourcingMutation.mutate()} disabled={!selectedSupplier && !cost}>Add</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                    ) : outsourcing.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No outsourcing records.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {outsourcing.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="space-y-1">
                                        <p className="font-medium">{item.suppliers?.name || "Unknown Supplier"}</p>
                                        {item.notes && <p className="text-sm text-muted-foreground">{item.notes}</p>}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="font-bold">{formatCurrency(item.supplier_total, item.supplier_currency)}</p>
                                            <Badge variant={item.paid ? "default" : "secondary"}>
                                                {item.paid ? "Paid" : "Unpaid"}
                                            </Badge>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                if (confirm("Remove this supplier assignment?")) deleteOutsourcingMutation.mutate(item.id)
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            <div className="flex justify-end pt-4 border-t">
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Total Outsourcing Cost</p>
                                    <p className="text-xl font-bold">{formatCurrency(totalCost, jobCurrency)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { nanoid } from "nanoid";

interface CreatePODialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    supplierId: string;
    selectedIds: string[];
    totalAmount: number;
    onSuccess: () => void;
}

export function CreatePODialog({
    open,
    onOpenChange,
    supplierId,
    selectedIds,
    totalAmount,
    onSuccess,
}: CreatePODialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Generate a temporary PO number
    const [number, setNumber] = useState(`PO-${new Date().getFullYear()}-${nanoid(4).toUpperCase()}`);
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [notes, setNotes] = useState("");

    const createPOMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch("/api/purchase-orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    supplier_id: supplierId,
                    number,
                    created_at: new Date(date).toISOString(),
                    notes,
                    amount: totalAmount,
                    currency: "EUR", // Defaulting to EUR for now, should come from supplier or jobs
                    outsourcing_ids: selectedIds,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create PO");
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["supplier-jobs", supplierId] });
            queryClient.invalidateQueries({ queryKey: ["supplier-purchase-orders", supplierId] });
            toast({ title: "Success", description: "Purchase Order created successfully" });
            onOpenChange(false);
            onSuccess();
            // Reset form
            setNumber(`PO-${new Date().getFullYear()}-${nanoid(4).toUpperCase()}`);
            setNotes("");
        },
        onError: (error: Error) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Purchase Order</DialogTitle>
                    <DialogDescription>
                        Create a PO for {selectedIds.length} selected job(s). Total: {totalAmount.toFixed(2)}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">PO Number</label>
                        <Input
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                            placeholder="PO-2024-XXXX"
                        />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Date</label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Notes</label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Internal notes..."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => createPOMutation.mutate()}
                        disabled={!number || createPOMutation.isPending}
                    >
                        {createPOMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create PO
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { SupplierForm } from "@/components/suppliers/supplier-form";
import type { SupplierFormData } from "@/lib/validators/suppliers";
import type { Database } from "@/lib/supabase/types";

type SupplierRecord = Database["public"]["Tables"]["suppliers"]["Row"];

interface EditSupplierDialogProps {
    supplier: SupplierRecord;
}

export function EditSupplierDialog({ supplier }: EditSupplierDialogProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const updateMutation = useMutation({
        mutationFn: async (data: SupplierFormData) => {
            const response = await fetch(`/api/suppliers?id=${supplier.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || "Failed to update supplier");
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["suppliers", supplier.id] });
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            setOpen(false);
            toast({
                title: "Success",
                description: "Supplier updated successfully",
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

    const defaultValues: Partial<SupplierFormData> = {
        name: supplier.name,
        friendly_name: supplier.friendly_name || undefined,
        contact_name: supplier.contact_name || undefined,
        email: supplier.email || undefined,
        secondary_email: supplier.secondary_email || undefined,
        phone: supplier.phone || undefined,
        secondary_phone: supplier.secondary_phone || undefined,
        country: supplier.country || undefined,
        region: supplier.region || undefined,
        vat_number: supplier.vat_number || undefined,
        payment_method: supplier.payment_method || undefined,
        address: supplier.address || undefined,
        default_currency: supplier.default_currency || "USD",
        timezone: supplier.timezone || undefined,
        minimum_fee: supplier.minimum_fee || undefined,
        payment_terms: supplier.payment_terms || undefined,
        po_filename_format: supplier.po_filename_format || undefined,
        cat_tool: supplier.cat_tool || undefined,
        default_rate_word: supplier.default_rate_word || undefined,
        default_rate_hour: supplier.default_rate_hour || undefined,
        default_rate_project: supplier.default_rate_project || undefined,
        specialization: Array.isArray(supplier.specialization)
            ? supplier.specialization.join(", ")
            : supplier.specialization || undefined,
        notes: supplier.notes || undefined,
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Supplier</DialogTitle>
                    <DialogDescription>
                        Update supplier details and default rates.
                    </DialogDescription>
                </DialogHeader>
                <SupplierForm
                    defaultValues={defaultValues}
                    onSubmit={async (data) => {
                        await updateMutation.mutateAsync(data);
                    }}
                    isSubmitting={updateMutation.isPending}
                />
            </DialogContent>
        </Dialog>
    );
}

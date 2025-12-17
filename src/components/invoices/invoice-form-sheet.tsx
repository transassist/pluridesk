"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import { InvoiceForm } from "./invoice-form";
import type { InvoiceFormData } from "@/lib/validators/invoices";

interface InvoiceFormSheetProps {
  clients: Array<{ id: string; name: string; default_currency?: string | null }>;
}

export function InvoiceFormSheet({ clients }: InvoiceFormSheetProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error ?? "Failed to create invoice");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setOpen(false);
      toast({
        title: "Success",
        description: "Invoice created successfully",
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create invoice
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>Create invoice</SheetTitle>
          <SheetDescription>
            Generate a new invoice for your client.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <InvoiceForm
            clients={clients}
            onSubmit={(data) => createMutation.mutateAsync(data)}
            isSubmitting={createMutation.isPending}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}


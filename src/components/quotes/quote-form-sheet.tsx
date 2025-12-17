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
import { QuoteForm } from "./quote-form";
import type { QuoteFormData } from "@/lib/validators/quotes";

interface QuoteFormSheetProps {
  clients: Array<{ id: string; name: string; default_currency?: string | null }>;
}

export function QuoteFormSheet({ clients }: QuoteFormSheetProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: QuoteFormData) => {
      // Calculate total from items
      const total = data.items.reduce((sum, item) => sum + item.amount, 0);
      const payload = {
        ...data,
        total,
      };

      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error ?? "Failed to create quote");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      setOpen(false);
      toast({
        title: "Success",
        description: "Quote created successfully",
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
          Create quote
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>Create quote</SheetTitle>
          <SheetDescription>
            Generate a new quote with itemized services for your client.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <QuoteForm
            clients={clients}
            onSubmit={(data) => createMutation.mutateAsync(data)}
            isSubmitting={createMutation.isPending}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}


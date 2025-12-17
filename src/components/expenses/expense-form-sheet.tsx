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
import { ExpenseForm } from "./expense-form";
import type { ExpenseFormData } from "@/lib/validators/expenses";
import type { Database } from "@/lib/supabase/types";

interface ExpenseFormSheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  expenseToEdit?: Database["public"]["Tables"]["expenses"]["Row"];
}

export function ExpenseFormSheet({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  expenseToEdit,
}: ExpenseFormSheetProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const mutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const url = expenseToEdit
        ? `/api/expenses/${expenseToEdit.id}`
        : "/api/expenses";
      const method = expenseToEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error ?? "Failed to save expense");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setOpen(false);
      toast({
        title: "Success",
        description: `Expense ${expenseToEdit ? "updated" : "created"} successfully`,
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

  const defaultValues: Partial<ExpenseFormData> | undefined = expenseToEdit
    ? {
      date: expenseToEdit.date ?? undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      category: expenseToEdit.category as any,
      amount: expenseToEdit.amount,
      currency: expenseToEdit.currency,
      supplier_name: expenseToEdit.supplier_name ?? undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supplier_id: (expenseToEdit as any).supplier_id ?? undefined,
      notes: expenseToEdit.notes ?? undefined,
      file_url: expenseToEdit.file_url ?? undefined,
    }
    : undefined;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <SheetTrigger asChild>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add expense
          </Button>
        </SheetTrigger>
      )}
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{expenseToEdit ? "Edit expense" : "Add expense"}</SheetTitle>
          <SheetDescription>
            {expenseToEdit
              ? "Update the details of this expense."
              : "Record a business expense for tracking and reporting."}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <ExpenseForm
            onSubmit={(data) => mutation.mutateAsync(data)}
            defaultValues={defaultValues}
            isSubmitting={mutation.isPending}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}


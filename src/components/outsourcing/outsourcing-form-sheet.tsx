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
import { OutsourcingForm } from "./outsourcing-form";
import type { OutsourcingFormData } from "@/lib/validators/outsourcing";

interface OutsourcingFormSheetProps {
  jobs: Array<{ id: string; job_code: string; title: string }>;
  suppliers: Array<{
    id: string;
    name: string;
    default_rate_word?: number | null;
    default_rate_hour?: number | null;
  }>;
}

export function OutsourcingFormSheet({ jobs, suppliers }: OutsourcingFormSheetProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: OutsourcingFormData) => {
      const response = await fetch("/api/outsourcing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error ?? "Failed to create outsourcing");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outsourcing"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setOpen(false);
      toast({
        title: "Success",
        description: "Outsourcing record created successfully",
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
          Add outsourcing
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Add outsourcing</SheetTitle>
          <SheetDescription>
            Link a job to a supplier and track outsourcing costs.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <OutsourcingForm
            jobs={jobs}
            suppliers={suppliers}
            onSubmit={(data) => createMutation.mutateAsync(data)}
            isSubmitting={createMutation.isPending}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}


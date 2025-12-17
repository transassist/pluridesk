"use client";

import { ReactNode, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, PencilLine, Plus } from "lucide-react";

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
import { ClientForm } from "./client-form";
import type { ClientFormData } from "@/lib/validators/clients";
import type { Database } from "@/lib/supabase/types";

type ClientRecord = Database["public"]["Tables"]["clients"]["Row"];

type ClientFormSheetProps = {
  client?: ClientRecord;
  trigger?: ReactNode;
};

export function ClientFormSheet({ client, trigger }: ClientFormSheetProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = Boolean(client);

  const defaultValues = useMemo(() => {
    if (!client) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = client as any;
    return {
      name: client.name,
      contact_name: client.contact_name ?? "",
      email: client.email ?? "",
      phone: client.phone ?? "",
      address: client.address ?? "",
      country: c.country ?? "",
      vat_number: c.vat_number ?? "",
      tax_id: c.tax_id ?? "",
      document_language: c.document_language ?? "",
      default_payment_terms: c.default_payment_terms ?? "",
      default_taxes: c.default_taxes ?? undefined,
      minimum_fee: c.minimum_fee ?? undefined,
      default_file_naming: c.default_file_naming ?? "",
      quote_validity: c.quote_validity ?? undefined,
      cat_tool_preferences: c.cat_tool_preferences ?? "",
      website: c.website ?? "",
      notes: client.notes ?? "",
      default_currency: (client.default_currency as ClientFormData["default_currency"]) ?? "USD",
    };
  }, [client]);

  const createMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const endpoint = client ? `/api/clients/${client.id}` : "/api/clients";
      const method = client ? "PATCH" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error ?? "Failed to save client");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      if (client) {
        queryClient.invalidateQueries({ queryKey: ["client", client.id] });
      }
      setOpen(false);
      toast({
        title: client ? "Client updated" : "Client created",
        description: client
          ? "The client profile was saved successfully."
          : "Client created successfully.",
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
        {trigger ?? (
          <Button size="sm">
            {isEditing ? (
              <>
                <PencilLine className="mr-2 h-4 w-4" />
                Edit client
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create client
              </>
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Update client" : "Create client"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Edit the client information and keep your CRM accurate."
              : "Add a new client to your CRM. All fields except name are optional."}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <ClientForm
            defaultValues={defaultValues}
            onSubmit={(data) => createMutation.mutateAsync(data)}
            isSubmitting={createMutation.isPending}
          />
          {createMutation.isPending && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving client…
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}


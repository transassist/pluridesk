"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { z } from "zod";

import { jobStatuses, pricingOptions, serviceTypes } from "@/lib/constants/jobs";

import { currencies } from "@/utils/currencies";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

const jobSchema = z.object({
  title: z.string().min(2, "Title is required"),
  client_id: z.string().uuid("Client is required"),
  service_type: z.string().min(2),
  pricing_type: z.enum(["per_word", "per_hour", "flat_fee"]),
  quantity: z.coerce.number().nonnegative().optional(),
  rate: z.coerce.number().positive(),
  currency: z.enum(["USD", "EUR", "CAD", "MAD", "GBP"]),
  status: z.enum([
    "created",
    "in_progress",
    "finished",
    "invoiced",
    "cancelled",
    "on_hold",
  ]),
  purchase_order_ref: z.string().optional(),
  due_date: z.string().optional(),
  start_date: z.string().optional(),
  notes: z.string().optional(),
  has_outsourcing: z.boolean().default(false),
});

export type JobFormValues = z.infer<typeof jobSchema>;

type ClientOption = {
  id: string;
  name: string;
  default_currency?: string | null;
};

type JobFormProps = {
  clients: ClientOption[];
  initialData?: JobFormValues & { id: string };
  onSuccess?: () => void;
};

export const JobForm = ({ clients, initialData, onSuccess }: JobFormProps) => {
  const queryClient = useQueryClient();
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      client_id: initialData?.client_id ?? clients[0]?.id ?? "",
      service_type: initialData?.service_type ?? serviceTypes[0],
      pricing_type: initialData?.pricing_type ?? "per_word",
      quantity: initialData?.quantity ?? 1000,
      rate: initialData?.rate ?? 0.12,
      currency: (initialData?.currency ?? clients[0]?.default_currency) as JobFormValues["currency"] ?? "USD",
      status: initialData?.status ?? "created",
      has_outsourcing: initialData?.has_outsourcing ?? false,
      purchase_order_ref: initialData?.purchase_order_ref ?? "",
      due_date: initialData?.due_date ?? "",
      start_date: initialData?.start_date ?? "",
      notes: initialData?.notes ?? "",
    },
  });

  useEffect(() => {
    if (initialData) return; // Don't override if editing
    if (clients.length === 0) return;
    const currentClient = form.getValues("client_id");
    if (!currentClient) {
      form.setValue("client_id", clients[0].id);
      if (clients[0].default_currency) {
        form.setValue(
          "currency",
          (clients[0].default_currency as JobFormValues["currency"]) ?? "USD",
        );
      }
    }
  }, [clients, form, initialData]);

  const supabase = createSupabaseBrowserClient();
  const clientId = form.watch("client_id");
  const serviceType = form.watch("service_type");

  useEffect(() => {
    const fetchRate = async () => {
      if (!clientId || !serviceType) return;

      // Don't overwrite if editing an existing job and values haven't changed
      if (
        initialData &&
        clientId === initialData.client_id &&
        serviceType === initialData.service_type
      ) {
        return;
      }

      const { data } = await supabase
        .from("client_rates")
        .select("*")
        .eq("client_id", clientId)
        .eq("service_type", serviceType)
        .single();

      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rateData = data as any;
        form.setValue("rate", Number(rateData.rate));

        // Map unit to pricing_type
        let pricingType: JobFormValues["pricing_type"] = "per_word";
        if (rateData.unit === "hour") pricingType = "per_hour";
        else if (rateData.unit === "flat") pricingType = "flat_fee";

        form.setValue("pricing_type", pricingType);

        // Only set currency if it matches one of the allowed values
        const allowedCurrencies = ["USD", "EUR", "CAD", "MAD", "GBP"];
        if (allowedCurrencies.includes(rateData.currency)) {
          form.setValue("currency", rateData.currency as JobFormValues["currency"]);
        }
      }
    };

    fetchRate();
  }, [clientId, serviceType, supabase, form, initialData]);

  const pricingType = form.watch("pricing_type");
  const quantity = form.watch("quantity") ?? 0;
  const rate = form.watch("rate") ?? 0;

  const computedTotal = useMemo(() => {
    if (pricingType === "flat_fee") {
      return rate;
    }
    return Number((quantity * rate).toFixed(2));
  }, [pricingType, quantity, rate]);

  const mutation = useMutation({
    mutationFn: async (values: JobFormValues) => {
      const url = initialData ? `/api/jobs?id=${initialData.id}` : "/api/jobs";
      const method = initialData ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          start_date: values.start_date === "" ? null : values.start_date,
          due_date: values.due_date === "" ? null : values.due_date,
          total_amount: computedTotal,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error ?? `Unable to ${initialData ? "update" : "create"} job`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      if (initialData) {
        queryClient.invalidateQueries({ queryKey: ["jobs", initialData.id] });
      }

      toast({
        title: initialData ? "Job updated" : "Job created",
        description: initialData
          ? "The job details have been updated."
          : "The job has been added to your pipeline.",
      });

      if (!initialData) {
        form.reset({
          ...form.getValues(),
          title: "",
          notes: "",
          purchase_order_ref: "",
        });
      }
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: `Failed to ${initialData ? "update" : "create"} job`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: JobFormValues) => {
    mutation.mutate(values);
  };

  const isSubmitting = mutation.isPending;

  const handleClientChange = (value: string) => {
    form.setValue("client_id", value, { shouldValidate: true });
    // Only auto-set currency if creating new job
    if (!initialData) {
      const client = clients.find((item) => item.id === value);
      if (client?.default_currency) {
        form.setValue(
          "currency",
          (client.default_currency as JobFormValues["currency"]) ?? "USD",
        );
      }
    }
  };

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" placeholder="e.g. EN>FR Life Sciences" {...form.register("title")} />
        {form.formState.errors.title && (
          <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Client</Label>
        <Select value={form.watch("client_id")} onValueChange={handleClientChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {clients.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Add a client first to link this job.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Service</Label>
          <Select
            value={form.watch("service_type")}
            onValueChange={(value) => form.setValue("service_type", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent>
              {serviceTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={form.watch("status")}
            onValueChange={(value) =>
              form.setValue("status", value as JobFormValues["status"])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {jobStatuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Pricing type</Label>
          <Select
            value={form.watch("pricing_type")}
            onValueChange={(value) =>
              form.setValue("pricing_type", value as JobFormValues["pricing_type"])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Pricing" />
            </SelectTrigger>
            <SelectContent>
              {pricingOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            step="1"
            min="0"
            disabled={pricingType === "flat_fee"}
            {...form.register("quantity", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rate">Rate</Label>
          <Input
            id="rate"
            type="number"
            step="0.01"
            min="0"
            {...form.register("rate", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Currency</Label>
          <Select
            value={form.watch("currency")}
            onValueChange={(value) =>
              form.setValue("currency", value as JobFormValues["currency"])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.code} — {currency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="start_date">Start date</Label>
          <Input id="start_date" type="date" {...form.register("start_date")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="due_date">Due date</Label>
          <Input id="due_date" type="date" {...form.register("due_date")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="purchase_order_ref">Purchase order reference</Label>
        <Input
          id="purchase_order_ref"
          placeholder="PO-12345"
          {...form.register("purchase_order_ref")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={4}
          placeholder="Reference files, linguistic assets, instructions..."
          {...form.register("notes")}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="has_outsourcing"
          checked={form.watch("has_outsourcing")}
          onCheckedChange={(checked) =>
            form.setValue("has_outsourcing", Boolean(checked))
          }
        />
        <Label htmlFor="has_outsourcing">Has outsourcing / supplier hand-off</Label>
      </div>

      <div className="rounded-md border bg-muted/30 p-3 text-sm">
        <p className="text-muted-foreground">Total preview</p>
        <p className="text-2xl font-semibold">
          {formatCurrency(computedTotal, form.watch("currency"))}
        </p>
      </div>

      <Button type="submit" disabled={isSubmitting || clients.length === 0} className="w-full">
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {initialData ? "Update job" : "Save job"}
      </Button>
    </form>
  );
};


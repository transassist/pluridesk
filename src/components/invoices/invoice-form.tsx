"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";

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
import { invoiceFormSchema, type InvoiceFormData } from "@/lib/validators/invoices";
import { invoiceStatuses } from "@/lib/constants/invoices";
import { CURRENCIES } from "@/utils/currencies";
import { formatCurrency } from "@/lib/utils";

interface InvoiceFormProps {
  onSubmit: (data: InvoiceFormData) => Promise<void>;
  clients: Array<{ id: string; name: string; default_currency?: string | null }>;
  defaultValues?: Partial<InvoiceFormData>;
  isSubmitting?: boolean;
}

export function InvoiceForm({
  onSubmit,
  clients,
  defaultValues,
  isSubmitting = false,
}: InvoiceFormProps) {
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      status: "draft",
      currency: "USD",
      tax_amount: 0,
      items: [{ description: "", quantity: 1, rate: 0, amount: 0 }],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const selectedClientId = watch("client_id");
  const selectedCurrency = watch("currency");
  const selectedStatus = watch("status");
  const taxAmount = watch("tax_amount");
  const items = watch("items");

  // Auto-set currency when client changes
  useEffect(() => {
    if (selectedClientId && clients.length > 0) {
      const client = clients.find((c) => c.id === selectedClientId);
      if (client?.default_currency) {
        setValue("currency", client.default_currency as InvoiceFormData["currency"]);
      }
    }
  }, [selectedClientId, clients, setValue]);

  // Calculate totals
  useEffect(() => {
    let sum = 0;
    items.forEach((item, index) => {
      const itemTotal = (item.quantity || 0) * (item.rate || 0);
      setValue(`items.${index}.amount`, itemTotal);
      sum += itemTotal;
    });
    setSubtotal(sum);
    setValue("subtotal", sum);

    const totalWithTax = sum + (taxAmount || 0);
    setTotal(totalWithTax);
    setValue("total", totalWithTax);
  }, [items, taxAmount, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Client & Basic Info */}
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="client_id">
              Client <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedClientId}
              onValueChange={(value) => setValue("client_id", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="client_id">
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
            {errors.client_id && (
              <p className="text-sm text-destructive">{errors.client_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice_number">
              Invoice number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="invoice_number"
              {...register("invoice_number")}
              placeholder="2025-0001"
              disabled={isSubmitting}
            />
            {errors.invoice_number && (
              <p className="text-sm text-destructive">{errors.invoice_number.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="date">Issue date</Label>
            <Input
              id="date"
              type="date"
              {...register("date")}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Due date</Label>
            <Input
              id="due_date"
              type="date"
              {...register("due_date")}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={selectedCurrency}
              onValueChange={(value) =>
                setValue("currency", value as InvoiceFormData["currency"])
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code} - {currency.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={selectedStatus}
            onValueChange={(value) =>
              setValue("status", value as InvoiceFormData["status"])
            }
            disabled={isSubmitting}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {invoiceStatuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Line Items */}
      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">Line items</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ description: "", quantity: 1, rate: 0, amount: 0 })
            }
            disabled={isSubmitting}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add item
          </Button>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid gap-2 sm:grid-cols-[2fr,1fr,1fr,1fr,auto]">
              <div className="space-y-1">
                <Input
                  {...register(`items.${index}.description`)}
                  placeholder="Description"
                  disabled={isSubmitting}
                />
                {errors.items?.[index]?.description && (
                  <p className="text-xs text-destructive">
                    {errors.items[index]?.description?.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Input
                  type="number"
                  step="0.01"
                  {...register(`items.${index}.quantity`, {
                    setValueAs: (v) => parseFloat(v) || 0,
                  })}
                  placeholder="Qty"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1">
                <Input
                  type="number"
                  step="0.01"
                  {...register(`items.${index}.rate`, {
                    setValueAs: (v) => parseFloat(v) || 0,
                  })}
                  placeholder="Rate"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex items-center text-sm font-semibold">
                {formatCurrency(items[index]?.amount || 0, selectedCurrency)}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
                disabled={isSubmitting || fields.length === 1}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-end pt-4 border-t space-y-2">
          <div className="flex justify-between w-64">
            <span className="text-sm text-muted-foreground">Subtotal</span>
            <span className="text-sm font-semibold">
              {formatCurrency(subtotal, selectedCurrency)}
            </span>
          </div>

          <div className="flex items-center justify-between w-64 gap-2">
            <Label htmlFor="tax_amount" className="text-sm text-muted-foreground">
              Tax
            </Label>
            <Input
              id="tax_amount"
              type="number"
              step="0.01"
              {...register("tax_amount", {
                setValueAs: (v) => (v === "" ? 0 : parseFloat(v)),
              })}
              placeholder="0.00"
              className="w-32 h-8"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-between w-64 pt-2 border-t">
            <span className="text-base font-medium">Total</span>
            <span className="text-xl font-bold">
              {formatCurrency(total, selectedCurrency)}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          placeholder="Payment terms, additional notes..."
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {defaultValues ? "Update invoice" : "Create invoice"}
        </Button>
      </div>
    </form>
  );
}


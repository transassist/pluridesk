"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { outsourcingFormSchema, type OutsourcingFormData } from "@/lib/validators/outsourcing";
import { CURRENCIES } from "@/utils/currencies";


interface OutsourcingFormProps {
  onSubmit: (data: OutsourcingFormData) => Promise<void>;
  jobs: Array<{ id: string; job_code: string; title: string }>;
  suppliers: Array<{
    id: string;
    name: string;
    default_rate_word?: number | null;
    default_rate_hour?: number | null;
  }>;
  defaultValues?: Partial<OutsourcingFormData>;
  isSubmitting?: boolean;
}

export function OutsourcingForm({
  onSubmit,
  jobs,
  suppliers,
  defaultValues,
  isSubmitting = false,
}: OutsourcingFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OutsourcingFormData>({
    resolver: zodResolver(outsourcingFormSchema),
    defaultValues: {
      supplier_currency: "USD",
      paid: false,
      ...defaultValues,
    },
  });

  const selectedJobId = watch("job_id");
  const selectedSupplierId = watch("supplier_id");
  const selectedCurrency = watch("supplier_currency");
  const isPaid = watch("paid");

  // Auto-fill supplier rate when supplier changes
  useEffect(() => {
    if (selectedSupplierId && suppliers.length > 0) {
      const supplier = suppliers.find((s) => s.id === selectedSupplierId);
      if (supplier?.default_rate_word) {
        setValue("supplier_rate", supplier.default_rate_word);
      }
    }
  }, [selectedSupplierId, suppliers, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="job_id">
              Job <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedJobId}
              onValueChange={(value) => setValue("job_id", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="job_id">
                <SelectValue placeholder="Select job" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.job_code} - {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.job_id && (
              <p className="text-sm text-destructive">{errors.job_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier_id">
              Supplier <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedSupplierId}
              onValueChange={(value) => setValue("supplier_id", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="supplier_id">
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.supplier_id && (
              <p className="text-sm text-destructive">{errors.supplier_id.message}</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border p-4 space-y-4">
          <h4 className="font-medium text-sm">Supplier payment details</h4>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="supplier_rate">Rate</Label>
              <Input
                id="supplier_rate"
                type="number"
                step="0.01"
                {...register("supplier_rate", {
                  setValueAs: (v) => (v === "" ? 0 : parseFloat(v)),
                })}
                placeholder="0.08"
                disabled={isSubmitting}
              />
              {errors.supplier_rate && (
                <p className="text-sm text-destructive">
                  {errors.supplier_rate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier_currency">Currency</Label>
              <Select
                value={selectedCurrency}
                onValueChange={(value) =>
                  setValue("supplier_currency", value as OutsourcingFormData["supplier_currency"])
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id="supplier_currency">
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

            <div className="space-y-2">
              <Label htmlFor="supplier_total">Total amount</Label>
              <Input
                id="supplier_total"
                type="number"
                step="0.01"
                {...register("supplier_total", {
                  setValueAs: (v) => (v === "" ? 0 : parseFloat(v)),
                })}
                placeholder="500.00"
                disabled={isSubmitting}
              />
              {errors.supplier_total && (
                <p className="text-sm text-destructive">
                  {errors.supplier_total.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier_invoice_url">Supplier invoice URL</Label>
            <Input
              id="supplier_invoice_url"
              {...register("supplier_invoice_url")}
              placeholder="https://..."
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="paid"
              checked={isPaid}
              onCheckedChange={(checked) => setValue("paid", Boolean(checked))}
              disabled={isSubmitting}
            />
            <label
              htmlFor="paid"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Marked as paid
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            {...register("notes")}
            placeholder="Additional details about this outsourcing..."
            rows={3}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {defaultValues ? "Update outsourcing" : "Create outsourcing"}
        </Button>
      </div>
    </form>
  );
}


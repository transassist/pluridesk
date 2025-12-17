"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Building2, DollarSign, Tag } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { supplierFormSchema, type SupplierFormData } from "@/lib/validators/suppliers";

interface SupplierFormProps {
  onSubmit: (data: SupplierFormData) => Promise<void>;
  defaultValues?: Partial<SupplierFormData>;
  isSubmitting?: boolean;
}

const SPECIALIZATION_OPTIONS = [
  "Translation - General",
  "Translation - Legal",
  "Translation - Medical",
  "Translation - Technical",
  "Translation - Marketing",
  "Translation - Financial",
  "Localization",
  "Transcreation",
  "Editing & Proofreading",
  "Desktop Publishing",
  "LQA (Linguistic QA)",
  "Subtitling",
  "Interpretation",
  "Voice-over",
];

const PAYMENT_METHODS = ["Wise", "PayPal", "Bank Transfer", "Check", "Other"];

export function SupplierForm({
  onSubmit,
  defaultValues,
  isSubmitting = false,
}: SupplierFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      default_currency: "USD",
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Building2 className="h-4 w-4" />
          <span>Basic Information</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">
              Supplier/Agency name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Translation Agency Inc."
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="friendly_name">Friendly Name (Internal)</Label>
            <Input
              id="friendly_name"
              {...register("friendly_name")}
              placeholder="Short name or nickname"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_name">Contact person</Label>
          <Input
            id="contact_name"
            {...register("contact_name")}
            placeholder="John Smith"
            disabled={isSubmitting}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="contact@supplier.com"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary_email">Secondary Email</Label>
            <Input
              id="secondary_email"
              type="email"
              {...register("secondary_email")}
              placeholder="accounting@supplier.com"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="+1 (555) 987-6543"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary_phone">Secondary Phone</Label>
            <Input
              id="secondary_phone"
              {...register("secondary_phone")}
              placeholder="Mobile or Alt"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              {...register("country")}
              placeholder="United States"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="region">Region / State</Label>
            <Input
              id="region"
              {...register("region")}
              placeholder="California"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vat_number">VAT / Tax ID</Label>
            <Input
              id="vat_number"
              {...register("vat_number")}
              placeholder="US123456789"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Payment method</Label>
            <Controller
              name="payment_method"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            {...register("address")}
            placeholder="456 Supplier Blvd, City, State 67890"
            rows={2}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <Separator />

      {/* Rates Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <DollarSign className="h-4 w-4" />
          <span>Default Rates</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Set default rates for quick outsourcing calculations
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="default_currency">Default currency</Label>
            <Controller
              name="default_currency"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="CAD">CAD ($)</SelectItem>
                    <SelectItem value="MAD">MAD (د.م.)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              {...register("timezone")}
              placeholder="UTC+1"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="minimum_fee">Minimum Fee</Label>
            <Input
              id="minimum_fee"
              type="number"
              step="0.01"
              {...register("minimum_fee", {
                setValueAs: (v) => (v === "" ? null : parseFloat(v)),
              })}
              placeholder="0.00"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_terms">Payment Terms</Label>
            <Input
              id="payment_terms"
              {...register("payment_terms")}
              placeholder="Net 30"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="po_filename_format">PO Filename Format</Label>
            <Input
              id="po_filename_format"
              {...register("po_filename_format")}
              placeholder="PO-{YYYY}-{MM}-{DD}"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat_tool">CAT Tool</Label>
            <Input
              id="cat_tool"
              {...register("cat_tool")}
              placeholder="Trados, MemoQ..."
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="default_rate_word">Per word</Label>
            <Input
              id="default_rate_word"
              type="number"
              step="0.001"
              {...register("default_rate_word", {
                setValueAs: (v) => (v === "" ? null : parseFloat(v)),
              })}
              placeholder="0.08"
              disabled={isSubmitting}
            />
            {errors.default_rate_word && (
              <p className="text-sm text-destructive">
                {errors.default_rate_word.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_rate_hour">Per hour</Label>
            <Input
              id="default_rate_hour"
              type="number"
              step="0.01"
              {...register("default_rate_hour", {
                setValueAs: (v) => (v === "" ? null : parseFloat(v)),
              })}
              placeholder="50.00"
              disabled={isSubmitting}
            />
            {errors.default_rate_hour && (
              <p className="text-sm text-destructive">
                {errors.default_rate_hour.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_rate_project">Per project</Label>
            <Input
              id="default_rate_project"
              type="number"
              step="0.01"
              {...register("default_rate_project", {
                setValueAs: (v) => (v === "" ? null : parseFloat(v)),
              })}
              placeholder="1500.00"
              disabled={isSubmitting}
            />
            {errors.default_rate_project && (
              <p className="text-sm text-destructive">
                {errors.default_rate_project.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Specialization */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Tag className="h-4 w-4" />
          <span>Specialization & Expertise</span>
        </div>

        <div className="space-y-2">
          <Label>Expertise areas</Label>
          <p className="text-xs text-muted-foreground">
            Select or type specializations (comma-separated)
          </p>
          <Textarea
            placeholder="e.g., Legal Translation, Medical Interpretation, EN→FR"
            rows={3}
            disabled={isSubmitting}
            {...register("specialization")}

          />
          <div className="flex flex-wrap gap-1 mt-2">
            {SPECIALIZATION_OPTIONS.slice(0, 6).map((spec) => (
              <button
                key={spec}
                type="button"
                className="text-xs rounded-full border px-2 py-1 hover:bg-muted"
                disabled={isSubmitting}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Internal notes</Label>
          <Textarea
            id="notes"
            {...register("notes")}
            placeholder="Performance notes, quality ratings, preferred job types..."
            rows={3}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {defaultValues ? "Update supplier" : "Create supplier"}
        </Button>
      </div>
    </form>
  );
}


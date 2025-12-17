"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

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
import { clientFormSchema, type ClientFormData } from "@/lib/validators/clients";
import { CURRENCIES } from "@/utils/currencies";

interface ClientFormProps {
  onSubmit: (data: ClientFormData) => Promise<void>;
  defaultValues?: Partial<ClientFormData>;
  isSubmitting?: boolean;
}

export function ClientForm({
  onSubmit,
  defaultValues,
  isSubmitting = false,
}: ClientFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      default_currency: "USD",
      ...defaultValues,
    },
  });

  const selectedCurrency = watch("default_currency");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Client name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Acme Corporation"
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contact_name">Contact person</Label>
            <Input
              id="contact_name"
              {...register("contact_name")}
              placeholder="John Doe"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="contact@acme.com"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="+1 (555) 123-4567"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              {...register("website")}
              placeholder="https://acme.com"
              disabled={isSubmitting}
            />
            {errors.website && (
              <p className="text-sm text-destructive">{errors.website.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="default_currency">Default currency</Label>
            <Select
              value={selectedCurrency}
              onValueChange={(value) =>
                setValue("default_currency", value as ClientFormData["default_currency"])
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="default_currency">
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
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              {...register("country")}
              placeholder="United States"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            {...register("address")}
            placeholder="123 Main St, Suite 100, City, State 12345"
            rows={2}
            disabled={isSubmitting}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="vat_number">VAT Number</Label>
            <Input
              id="vat_number"
              {...register("vat_number")}
              placeholder="US123456789"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax_id">Tax ID</Label>
            <Input
              id="tax_id"
              {...register("tax_id")}
              placeholder="12-3456789"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="default_payment_terms">Payment Terms</Label>
            <Input
              id="default_payment_terms"
              {...register("default_payment_terms")}
              placeholder="Net 30"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="default_taxes">Default Tax Rate (%)</Label>
            <Input
              id="default_taxes"
              type="number"
              step="0.01"
              {...register("default_taxes")}
              placeholder="0.00"
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
              {...register("minimum_fee")}
              placeholder="0.00"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quote_validity">Quote Validity (Days)</Label>
            <Input
              id="quote_validity"
              type="number"
              {...register("quote_validity")}
              placeholder="30"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="document_language">Document Language</Label>
          <Input
            id="document_language"
            {...register("document_language")}
            placeholder="English"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="default_file_naming">File Naming Convention</Label>
          <Input
            id="default_file_naming"
            {...register("default_file_naming")}
            placeholder="{Date}_{Project}_{Client}"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cat_tool_preferences">CAT Tool Preferences</Label>
          <Textarea
            id="cat_tool_preferences"
            {...register("cat_tool_preferences")}
            placeholder="Trados 2021, MemoQ 9.0..."
            rows={2}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Internal Notes</Label>
          <Textarea
            id="notes"
            {...register("notes")}
            placeholder="Internal notes about this client..."
            rows={3}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {defaultValues ? "Update client" : "Create client"}
        </Button>
      </div>
    </form>
  );
}


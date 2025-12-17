"use client";

import { useTransition } from "react";
import { currencies } from "@/utils/currencies";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";

export const CurrencySwitcher = () => {
  const [isPending, startTransition] = useTransition();

  const handleChange = (value: string) => {
    startTransition(async () => {
      await Promise.resolve(value);
    });
  };

  return (
    <div className="flex items-center gap-3 rounded-md border bg-card px-3 py-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">Currency</span>
        <div className="flex items-center gap-2">
          <Select defaultValue="USD" disabled={isPending} onValueChange={handleChange}>
            <SelectTrigger
              id="currency"
              className="h-auto w-auto border-none bg-transparent p-0 text-sm font-semibold focus:ring-0 focus:ring-offset-0"
            >
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.code} • {currency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">(Default)</span>
        </div>
      </div>
    </div>
  );
};


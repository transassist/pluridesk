"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CurrencySwitcher } from "@/components/navigation/currency-switcher";
import { NotificationBell } from "@/components/feedback/notification-bell";
import { UserMenu } from "@/components/navigation/user-menu";

export const Topbar = () => {
  return (
    <header className="flex flex-wrap items-center gap-4 border-b bg-background/75 px-6 py-4 backdrop-blur">
      <div className="flex flex-1 items-center gap-2 rounded-md border bg-card px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search jobs, clients, invoices…"
          className="h-8 border-none bg-transparent p-0 focus-visible:ring-0"
        />
        <Button variant="ghost" size="sm" className="text-xs">
          ⌘K
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <CurrencySwitcher />
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
};


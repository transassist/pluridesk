"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, ReceiptText, Users2, Factory, FileText, Wallet, BarChart3, Settings, Bell, Landmark } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/clients", label: "Clients", icon: Users2 },
  { href: "/suppliers", label: "Suppliers", icon: Factory },
  { href: "/quotes", label: "Quotes", icon: FileText },
  { href: "/invoices", label: "Invoices", icon: ReceiptText },
  { href: "/expenses", label: "Expenses", icon: Wallet },
  { href: "/purchase-orders", label: "Purchase Orders", icon: Landmark },
  { href: "/outsourcing", label: "Outsourcing", icon: Factory },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card/30 p-4">
      <div className="flex items-center gap-2 pb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground text-lg font-semibold">
          VP
        </div>
        <div>
          <p className="text-sm font-semibold text-muted-foreground">PluriDesk</p>
          <p className="text-xs text-muted-foreground">Single-user LSP HQ</p>
        </div>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-lg border bg-muted/60 p-3 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">Need help?</p>
        <p>Docs, migrations, and workflows live in the Knowledge Base.</p>
      </div>
    </aside>
  );
};


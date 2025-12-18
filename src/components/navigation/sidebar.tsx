"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, ReceiptText, Users2, Factory, FileText, Wallet, BarChart3, Settings, Bell, Landmark } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/jobs", label: "Jobs", icon: Briefcase, color: "text-blue-500" },
  { href: "/clients", label: "Clients", icon: Users2, color: "text-orange-500" },
  { href: "/suppliers", label: "Suppliers", icon: Factory, color: "text-emerald-500" },
  { href: "/quotes", label: "Quotes", icon: FileText, color: "text-indigo-500" },
  { href: "/invoices", label: "Invoices", icon: ReceiptText, color: "text-rose-500" },
  { href: "/expenses", label: "Expenses", icon: Wallet, color: "text-amber-500" },
  { href: "/purchase-orders", label: "Purchase Orders", icon: Landmark, color: "text-cyan-500" },
  { href: "/outsourcing", label: "Outsourcing", icon: Factory, color: "text-purple-500" },
  { href: "/reports", label: "Reports", icon: BarChart3, color: "text-primary" },
  { href: "/notifications", label: "Notifications", icon: Bell, color: "text-yellow-500" },
  { href: "/settings", label: "Settings", icon: Settings, color: "text-slate-500" },
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
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover-lift",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4 transition-colors", isActive ? "text-primary" : item.color)} />
              {item.label}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
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


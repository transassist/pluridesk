"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, DollarSign, Package } from "lucide-react";

import { WorkspaceShell } from "@/components/layout/workspace-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";
import { DashboardPieChart, DashboardBarChart } from "@/components/charts/chart-components";

type JobRecord = Database["public"]["Tables"]["jobs"]["Row"] & {
  clients: { name: string } | null;
};
type ExpenseRecord = Database["public"]["Tables"]["expenses"]["Row"];
type OutsourcingRecord = Database["public"]["Tables"]["outsourcing"]["Row"];
type InvoiceRecord = Database["public"]["Tables"]["invoices"]["Row"];

const fetchJobs = async (): Promise<JobRecord[]> => {
  const response = await fetch("/api/jobs");
  if (!response.ok) throw new Error("Unable to load jobs");
  const payload = await response.json();
  return payload.jobs;
};

const fetchExpenses = async (): Promise<ExpenseRecord[]> => {
  const response = await fetch("/api/expenses");
  if (!response.ok) throw new Error("Unable to load expenses");
  const payload = await response.json();
  return payload.expenses;
};

const fetchOutsourcing = async (): Promise<OutsourcingRecord[]> => {
  const response = await fetch("/api/outsourcing");
  if (!response.ok) throw new Error("Unable to load outsourcing");
  const payload = await response.json();
  return payload.outsourcing;
};

const fetchInvoices = async (): Promise<InvoiceRecord[]> => {
  const response = await fetch("/api/invoices");
  if (!response.ok) throw new Error("Unable to load invoices");
  const payload = await response.json();
  return payload.invoices;
};

export default function ReportsPage() {
  const { data: jobs = [], isLoading: isJobsLoading, isError: isJobsError } = useQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobs,
  });

  const { data: expenses = [], isLoading: isExpensesLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: fetchExpenses,
  });

  const { data: outsourcing = [], isLoading: isOutsourcingLoading } = useQuery({
    queryKey: ["outsourcing"],
    queryFn: fetchOutsourcing,
  });

  const { data: invoices = [], isLoading: isInvoicesLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: fetchInvoices,
  });

  // Revenue by currency
  const revenueByCurrency = useMemo(() => {
    return jobs.reduce<Record<string, number>>((acc, job) => {
      const currency = job.currency ?? "USD";
      acc[currency] = (acc[currency] ?? 0) + (job.total_amount ?? 0);
      return acc;
    }, {});
  }, [jobs]);

  // Expenses by currency
  const expensesByCurrency = useMemo(() => {
    return expenses.reduce<Record<string, number>>((acc, expense) => {
      const currency = expense.currency ?? "USD";
      acc[currency] = (acc[currency] ?? 0) + (expense.amount ?? 0);
      return acc;
    }, {});
  }, [expenses]);

  // Outsourcing costs by currency
  const outsourcingByCurrency = useMemo(() => {
    return outsourcing.reduce<Record<string, number>>((acc, record) => {
      const currency = record.supplier_currency ?? "USD";
      acc[currency] = (acc[currency] ?? 0) + (record.supplier_total ?? 0);
      return acc;
    }, {});
  }, [outsourcing]);

  // Outstanding invoices
  const outstandingInvoices = useMemo(() => {
    return invoices
      .filter((inv) => inv.status === "sent" || inv.status === "overdue")
      .reduce<Record<string, number>>((acc, inv) => {
        const currency = inv.currency ?? "USD";
        acc[currency] = (acc[currency] ?? 0) + (inv.total ?? 0);
        return acc;
      }, {});
  }, [invoices]);

  // Revenue by client
  const revenueByClient = useMemo(() => {
    const clientRevenue: Record<string, { name: string; amount: number }> = {};
    jobs.forEach((job) => {
      const clientId = job.client_id;
      const clientName = job.clients?.name ?? "Unknown";
      if (!clientRevenue[clientId]) {
        clientRevenue[clientId] = { name: clientName, amount: 0 };
      }
      clientRevenue[clientId].amount += job.total_amount ?? 0;
    });
    return Object.values(clientRevenue).sort((a, b) => b.amount - a.amount);
  }, [jobs]);

  const revenueByClientData = useMemo(() => {
    return revenueByClient.slice(0, 5).map(c => ({ name: c.name, value: c.amount }));
  }, [revenueByClient]);

  // Job status breakdown
  const jobsByStatusData = useMemo(() => {
    return Object.entries(
      jobs.reduce<Record<string, number>>((acc, job) => {
        acc[job.status] = (acc[job.status] ?? 0) + 1;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name: name.replace("_", " "), value }));
  }, [jobs]);

  // Monthly Revenue Data (simplified for demo/MVP)
  const monthlyRevenueData = useMemo(() => {
    const monthly: Record<string, number> = {};
    jobs.forEach(job => {
      if (!job.created_at) return;
      const month = new Date(job.created_at).toLocaleString('default', { month: 'short' });
      monthly[month] = (monthly[month] ?? 0) + (job.total_amount ?? 0);
    });
    return Object.entries(monthly).map(([name, value]) => ({ name, value }));
  }, [jobs]);

  const isLoading = isJobsLoading || isExpensesLoading || isOutsourcingLoading || isInvoicesLoading;
  const hasError = isJobsError;

  return (
    <WorkspaceShell
      title="Reports"
      description="Revenue, margin, expenses, and operational insights with multi-currency support."
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : hasError ? (
        <Alert variant="destructive">
          <AlertTitle>Error loading reports</AlertTitle>
          <AlertDescription>Please refresh the page to try again.</AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Revenue Overview */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="overflow-hidden border-none shadow-md hover-lift">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blue-500/5 pointer-events-none" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-bold uppercase tracking-wider">Total Jobs</CardTitle>
                <Package className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-gradient">{jobs.length}</div>
                <p className="text-xs text-muted-foreground font-medium">
                  Active pipeline
                </p>
              </CardContent>
            </Card>

            {Object.entries(revenueByCurrency).slice(0, 3).map(([currency, amount]) => (
              <Card key={currency} className="overflow-hidden border-none shadow-md hover-lift">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-emerald-500/5 pointer-events-none" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider">
                    Revenue ({currency})
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-emerald-600">
                    {formatCurrency(amount, currency)}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Gross earnings
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="glass-card border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Job Pipeline</CardTitle>
                <CardDescription>Status breakdown of all projects</CardDescription>
              </CardHeader>
              <CardContent>
                <DashboardPieChart data={jobsByStatusData} />
              </CardContent>
            </Card>

            <Card className="glass-card border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Revenue Trend</CardTitle>
                <CardDescription>Monthly growth overview</CardDescription>
              </CardHeader>
              <CardContent>
                <DashboardBarChart data={monthlyRevenueData} dataKey="value" xKey="name" />
              </CardContent>
            </Card>
          </div>

          {/* Expenses & Costs */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
                <CardDescription>Total business expenses</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.entries(expensesByCurrency).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(expensesByCurrency).map(([currency, amount]) => (
                      <div key={currency} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{currency}</span>
                        <span className="text-lg font-semibold">
                          {formatCurrency(amount, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No expenses recorded</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Outsourcing Costs</CardTitle>
                <CardDescription>Total supplier payments</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.entries(outsourcingByCurrency).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(outsourcingByCurrency).map(([currency, amount]) => (
                      <div key={currency} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{currency}</span>
                        <span className="text-lg font-semibold">
                          {formatCurrency(amount, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No outsourcing recorded
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="glass-card border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Top Clients</CardTitle>
                <CardDescription>Revenue share by client</CardDescription>
              </CardHeader>
              <CardContent>
                <DashboardPieChart data={revenueByClientData} />
              </CardContent>
            </Card>

            <Card className="glass-card border-none shadow-lg overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Outstanding Invoices</CardTitle>
                <CardDescription>Awaiting payment by currency</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="pl-6 font-bold">Currency</TableHead>
                      <TableHead className="text-right pr-6 font-bold">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(outstandingInvoices).length > 0 ? (
                      Object.entries(outstandingInvoices).map(([currency, amount]) => (
                        <TableRow key={currency} className="hover:bg-muted/30">
                          <TableCell className="pl-6 font-medium">{currency}</TableCell>
                          <TableCell className="text-right pr-6 text-orange-600 font-bold">
                            {formatCurrency(amount, currency)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-6 text-muted-foreground">
                          No outstanding invoices
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </WorkspaceShell>
  );
}


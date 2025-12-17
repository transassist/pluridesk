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

  // Job status breakdown
  const jobsByStatus = useMemo(() => {
    return jobs.reduce<Record<string, number>>((acc, job) => {
      acc[job.status] = (acc[job.status] ?? 0) + 1;
      return acc;
    }, {});
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{jobs.length}</div>
                <p className="text-xs text-muted-foreground">
                  {jobsByStatus.in_progress || 0} in progress
                </p>
              </CardContent>
            </Card>

            {Object.entries(revenueByCurrency).slice(0, 3).map(([currency, amount]) => (
              <Card key={currency}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Revenue ({currency})
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(amount, currency)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    From {jobs.length} jobs
                  </p>
                </CardContent>
              </Card>
            ))}
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

          {/* Client Revenue Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Top Clients by Revenue</CardTitle>
              <CardDescription>Ranked by total job value</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueByClient.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueByClient.slice(0, 10).map((client) => {
                      const totalRevenue = Object.values(revenueByCurrency).reduce(
                        (sum, val) => sum + val,
                        0
                      );
                      const percentage = ((client.amount / totalRevenue) * 100).toFixed(1);
                      return (
                        <TableRow key={client.name}>
                          <TableCell className="font-medium">{client.name}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(client.amount, "USD")}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {percentage}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No client data available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Outstanding Invoices */}
          {Object.keys(outstandingInvoices).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Outstanding Invoices</CardTitle>
                <CardDescription>Awaiting payment from clients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(outstandingInvoices).map(([currency, amount]) => (
                    <div key={currency} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{currency}</span>
                      <span className="text-xl font-bold text-orange-600">
                        {formatCurrency(amount, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </WorkspaceShell>
  );
}


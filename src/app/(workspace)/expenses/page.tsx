"use client";

import { useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCcw,
  Search,

  Paperclip,
} from "lucide-react";

import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExpenseFormSheet } from "@/components/expenses/expense-form-sheet";
import { ExpensesTableActions } from "@/components/expenses/expenses-table-actions";
import { EXPENSE_CATEGORIES } from "@/lib/validators/expenses";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type ExpenseRecord = Database["public"]["Tables"]["expenses"]["Row"];

type ExpensesResponse = {
  expenses: ExpenseRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export default function ExpensesPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const res = await fetch("/api/suppliers");
      if (!res.ok) throw new Error("Failed to fetch suppliers");
      const data = await res.json();
      return data.suppliers as { id: string; name: string }[];
    },
  });

  const fetchExpenses = async (): Promise<ExpensesResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (searchTerm) params.append("search", searchTerm);
    if (categoryFilter !== "all") params.append("category", categoryFilter);
    if (supplierFilter !== "all") params.append("supplier_id", supplierFilter);
    if (fromDate) params.append("from", fromDate);
    if (toDate) params.append("to", toDate);

    const response = await fetch(`/api/expenses?${params.toString()}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.error ?? "Unable to load expenses");
    }
    return response.json();
  };

  const {
    data,
    isLoading,
    isError,
    error,
    refetch: refetchExpenses,
    isPlaceholderData,
  } = useQuery({
    queryKey: [
      "expenses",
      page,
      limit,
      searchTerm,
      categoryFilter,
      supplierFilter,
      fromDate,
      toDate,
    ],
    queryFn: fetchExpenses,
    placeholderData: keepPreviousData,
  });

  const expenses = data?.expenses ?? [];
  const meta = data?.meta;

  const currencyTotals = useMemo(() => {
    // Note: This only calculates totals for the CURRENT PAGE.
    // For accurate global totals, we should fetch them from a separate API endpoint.
    // For now, we'll keep it as is but be aware of this limitation.
    // Ideally, the API should return global totals.
    return expenses.reduce<Record<string, number>>((acc, expense) => {
      const key = expense.currency ?? "USD";
      acc[key] = (acc[key] ?? 0) + (expense.amount ?? 0);
      return acc;
    }, {});
  }, [expenses]);

  const hasError = isError;
  const errorMessage = (error as Error)?.message ?? null;

  return (
    <WorkspaceShell
      title="Expenses"
      description="Track SaaS subscriptions, subcontractors, receipts, and reimbursements."
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchExpenses()}
            disabled={isLoading}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <ExpenseFormSheet />
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Object.entries(currencyTotals).map(([currency, amount]) => (
          <Card key={currency}>
            <CardHeader className="pb-2">
              <CardDescription>Total (Current Page)</CardDescription>
              <CardTitle className="text-3xl">
                {formatCurrency(amount, currency)}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
        {Object.keys(currencyTotals).length === 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total expenses</CardDescription>
              <CardTitle className="text-3xl text-muted-foreground">0</CardTitle>
            </CardHeader>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Filter expenses</CardTitle>
          <CardDescription>Search and filter your expenses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-md border px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                placeholder="Search notes..."
                className="h-8 border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>

            <Select
              value={categoryFilter}
              onValueChange={(val) => {
                setCategoryFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {EXPENSE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={supplierFilter}
              onValueChange={(val) => {
                setSupplierFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All suppliers</SelectItem>
                {suppliersData?.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">From:</span>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">To:</span>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="w-auto"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCategoryFilter("all");
                setSupplierFilter("all");
                setSearchTerm("");
                setFromDate("");
                setToDate("");
                setPage(1);
              }}
              className="ml-auto"
            >
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {hasError && (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Expenses ledger</CardTitle>
          <CardDescription>All recorded expenses with details</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No expenses found. Add one to get started.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {expenses.map((expense: any) => (
                    <TableRow
                      key={expense.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => window.location.href = `/expenses/${expense.id}`}
                    >
                      <TableCell>
                        {expense.date ? formatDate(expense.date) : "—"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {expense.category}
                      </TableCell>
                      <TableCell>
                        {expense.supplier_id ? (
                          <a
                            href={`/suppliers/${expense.supplier_id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {expense.supplier_name || "—"}
                          </a>
                        ) : expense.supplier_name ? (
                          <span>{expense.supplier_name}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {expense.notes || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-semibold">
                            {formatCurrency(
                              expense.amount ?? 0,
                              expense.currency ?? "USD"
                            )}
                          </span>
                          {expense.file_url && (
                            <a
                              href={expense.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                              title="View receipt"
                            >
                              <Paperclip className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ExpensesTableActions expense={expense} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between py-4">
                <div className="text-sm text-muted-foreground">
                  Page {meta?.page} of {meta?.totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) =>
                        meta?.totalPages ? Math.min(meta.totalPages, p + 1) : p
                      )
                    }
                    disabled={
                      page === (meta?.totalPages ?? 1) ||
                      isLoading ||
                      isPlaceholderData
                    }
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </WorkspaceShell>
  );
}

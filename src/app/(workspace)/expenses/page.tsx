"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCcw,
  Search,
  Paperclip,
  Trash2,
  CheckSquare,
  Square,
  X,
  DollarSign,
  Receipt,
  Clock,
  CheckCircle2,
  AlertCircle,
  Circle,
} from "lucide-react";
import Link from "next/link";

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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseFormSheet } from "@/components/expenses/expense-form-sheet";
import { ExpensesTableActions } from "@/components/expenses/expenses-table-actions";
import { useToast } from "@/components/ui/use-toast";
import { EXPENSE_CATEGORIES } from "@/lib/validators/expenses";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
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

// Category badge colors
const categoryColors: Record<string, string> = {
  "Outsourcing": "bg-blue-100 text-blue-700 border-blue-200",
  "Software": "bg-purple-100 text-purple-700 border-purple-200",
  "Office": "bg-amber-100 text-amber-700 border-amber-200",
  "Travel": "bg-green-100 text-green-700 border-green-200",
  "Marketing": "bg-pink-100 text-pink-700 border-pink-200",
  "Other": "bg-slate-100 text-slate-700 border-slate-200",
};

export default function ExpensesPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all"); // all, unpaid, paid, overdue
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  const allExpenses = data?.expenses ?? [];
  const meta = data?.meta;

  // Filter by payment status (client-side until API supports it)
  const expenses = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return allExpenses.filter((e) => {
      if (paymentFilter === "all") return true;
      if (paymentFilter === "paid") return e.paid === true;
      if (paymentFilter === "unpaid") return e.paid !== true;
      if (paymentFilter === "overdue") {
        return e.paid !== true && e.due_date && e.due_date < today;
      }
      return true;
    });
  }, [allExpenses, paymentFilter]);

  // Toggle paid mutation
  const togglePaidMutation = useMutation({
    mutationFn: async ({ id, paid }: { id: string; paid: boolean }) => {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid }),
      });
      if (!response.ok) throw new Error("Failed to update");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: "Payment status updated" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status" });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.all(
        ids.map((id) => fetch(`/api/expenses/${id}`, { method: "DELETE" }))
      );
      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        throw new Error(`Failed to delete ${failed.length} expense(s)`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setSelectedIds(new Set());
      toast({ title: "Deleted", description: `${selectedIds.size} expense(s) deleted` });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  // Bulk mark as paid mutation
  const bulkMarkPaidMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.all(
        ids.map((id) =>
          fetch(`/api/expenses/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paid: true }),
          })
        )
      );
      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) throw new Error(`Failed to update ${failed.length} expense(s)`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setSelectedIds(new Set());
      toast({ title: "Marked as Paid", description: `${selectedIds.size} expense(s) marked as paid` });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  // Selection helpers
  const isAllSelected = expenses.length > 0 && expenses.every((e) => selectedIds.has(e.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(expenses.map((e) => e.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Calculate summary totals
  const today = new Date().toISOString().split("T")[0];

  const unpaidTotal = useMemo(() => {
    return allExpenses
      .filter((e) => e.paid !== true)
      .reduce((sum, e) => sum + (e.amount ?? 0), 0);
  }, [allExpenses]);

  const overdueTotal = useMemo(() => {
    return allExpenses
      .filter((e) => e.paid !== true && e.due_date && e.due_date < today)
      .reduce((sum, e) => sum + (e.amount ?? 0), 0);
  }, [allExpenses, today]);

  const totalAmount = useMemo(() => {
    return allExpenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);
  }, [allExpenses]);

  const selectedTotal = useMemo(() => {
    return expenses
      .filter((e) => selectedIds.has(e.id))
      .reduce((sum, e) => sum + (e.amount ?? 0), 0);
  }, [expenses, selectedIds]);

  // Check if expense is overdue
  const isOverdue = (expense: ExpenseRecord) => {
    return expense.paid !== true && expense.due_date && expense.due_date < today;
  };

  const hasError = isError;
  const errorMessage = (error as Error)?.message ?? null;

  // Get primary currency for display
  const primaryCurrency = allExpenses[0]?.currency ?? "USD";

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
      {/* Payment Status Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card
          className={cn(
            "cursor-pointer transition-all hover:shadow-md border-l-4",
            paymentFilter === "unpaid" ? "ring-2 ring-primary border-l-red-500" : "border-l-red-500"
          )}
          onClick={() => setPaymentFilter(paymentFilter === "unpaid" ? "all" : "unpaid")}
        >
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Not Paid
            </CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {formatCurrency(unpaidTotal, primaryCurrency)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card
          className={cn(
            "cursor-pointer transition-all hover:shadow-md border-l-4",
            paymentFilter === "overdue" ? "ring-2 ring-primary border-l-amber-500" : "border-l-amber-500"
          )}
          onClick={() => setPaymentFilter(paymentFilter === "overdue" ? "all" : "overdue")}
        >
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Overdue
            </CardDescription>
            <CardTitle className="text-2xl text-amber-600">
              {formatCurrency(overdueTotal, primaryCurrency)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Total (This Page)
            </CardDescription>
            <CardTitle className="text-2xl text-emerald-600">
              {formatCurrency(totalAmount, primaryCurrency)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Payment Status Tabs */}
      <Tabs value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            All
            <Badge variant="secondary" className="ml-1">{allExpenses.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="unpaid" className="gap-2">
            <Circle className="h-3 w-3 text-red-500 fill-red-500" />
            Not Paid
          </TabsTrigger>
          <TabsTrigger value="overdue" className="gap-2">
            <AlertCircle className="h-3 w-3 text-amber-500" />
            Overdue
          </TabsTrigger>
          <TabsTrigger value="paid" className="gap-2">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            Paid
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-md border px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                placeholder="Search notes or supplier..."
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
              <SelectTrigger className="w-[150px]">
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
              <SelectTrigger className="w-[150px]">
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

            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="w-[140px]"
              />
              <span className="text-muted-foreground">→</span>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="w-[140px]"
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCategoryFilter("all");
                setSupplierFilter("all");
                setPaymentFilter("all");
                setSearchTerm("");
                setFromDate("");
                setToDate("");
                setPage(1);
              }}
            >
              Reset
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

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-4 rounded-lg border bg-background/95 backdrop-blur shadow-lg px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              <span className="font-medium">{selectedIds.size} selected</span>
              <Badge variant="secondary" className="ml-2">
                {formatCurrency(selectedTotal, primaryCurrency)}
              </Badge>
            </div>
            <div className="h-6 w-px bg-border" />
            <Button
              variant="default"
              size="sm"
              onClick={() => bulkMarkPaidMutation.mutate(Array.from(selectedIds))}
              disabled={bulkMarkPaidMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {bulkMarkPaidMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Mark as Paid
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm(`Delete ${selectedIds.size} expense(s)?`)) {
                  bulkDeleteMutation.mutate(Array.from(selectedIds));
                }
              }}
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              <X className="mr-1 h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Expenses Ledger</CardTitle>
              <CardDescription>
                Showing {expenses.length} of {meta?.total ?? 0} expenses
              </CardDescription>
            </div>
            {expenses.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className="gap-2"
              >
                {isAllSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                {isAllSelected ? "Deselect All" : "Select All"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Receipt className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No expenses found</p>
                <p className="text-sm text-muted-foreground">
                  {paymentFilter !== "all" ? "Try changing the filter or " : ""}Add your first expense to start tracking costs.
                </p>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="w-[50px]">Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow
                      key={expense.id}
                      className={cn(
                        "transition-colors",
                        selectedIds.has(expense.id) && "bg-primary/5",
                        isOverdue(expense) && "bg-red-50/50"
                      )}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(expense.id)}
                          onCheckedChange={() => toggleSelect(expense.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => togglePaidMutation.mutate({ id: expense.id, paid: !expense.paid })}
                          title={expense.paid ? "Mark as unpaid" : "Mark as paid"}
                        >
                          {expense.paid ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : isOverdue(expense) ? (
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-red-400" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        {expense.date ? formatDate(expense.date) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "capitalize",
                            categoryColors[expense.category] || categoryColors["Other"]
                          )}
                        >
                          {expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {expense.supplier_id ? (
                          <Link
                            href={`/suppliers/${expense.supplier_id}`}
                            className="text-primary hover:underline"
                          >
                            {expense.supplier_name || "—"}
                          </Link>
                        ) : expense.supplier_name ? (
                          <span>{expense.supplier_name}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="truncate text-sm text-muted-foreground">
                          {expense.notes || "—"}
                        </p>
                      </TableCell>
                      <TableCell>
                        {expense.due_date ? (
                          <span className={cn(
                            "text-sm",
                            isOverdue(expense) && "text-red-600 font-medium"
                          )}>
                            {formatDate(expense.due_date)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-semibold">
                            {formatCurrency(expense.amount ?? 0, expense.currency ?? "USD")}
                          </span>
                          {expense.file_url && (
                            <a
                              href={expense.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80"
                              title="View receipt"
                              onClick={(e) => e.stopPropagation()}
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

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4 border-t mt-4">
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
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) => meta?.totalPages ? Math.min(meta.totalPages, p + 1) : p)
                    }
                    disabled={page === (meta?.totalPages ?? 1) || isLoading || isPlaceholderData}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
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

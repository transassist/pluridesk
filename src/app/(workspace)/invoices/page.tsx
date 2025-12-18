"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCcw, Search, ChevronDown, Trash2, Download, Plus, MoreVertical, Eye, Pencil } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { StatusDropdown } from "@/components/ui/status-dropdown";

import { invoiceStatuses } from "@/lib/constants/invoices";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useDebounce } from "@/lib/hooks/use-debounce";
import type { Database } from "@/lib/supabase/types";
import { generateInvoicePDF } from "@/lib/pdf/generate-invoice";

type InvoiceRecord = Database["public"]["Tables"]["invoices"]["Row"] & {
  clients: { name: string } | null;
};



type InvoicesResponse = {
  invoices: InvoiceRecord[];
  metadata: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    outstanding: Record<string, number>;
    collected: Record<string, number>;
    draft: Record<string, number>;
  };
};

const fetchInvoices = async ({
  page = 1,
  limit = 50,
  search = "",
  status = "all",
}: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
} = {}): Promise<InvoicesResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search,
    status,
  });
  const response = await fetch(`/api/invoices?${params}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error ?? "Unable to load invoices");
  }
  return response.json();
};



const INVOICE_STATUS_COLORS: Record<string, string> = {
  draft: "border-slate-400/50 bg-slate-50 text-slate-800 dark:border-slate-400/40 dark:bg-slate-500/15 dark:text-slate-100",
  sent: "border-blue-400/50 bg-blue-50 text-blue-800 dark:border-blue-400/40 dark:bg-blue-500/15 dark:text-blue-100",
  paid: "border-emerald-400/50 bg-emerald-50 text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-500/15 dark:text-emerald-50",
  overdue: "border-red-400/50 bg-red-50 text-red-800 dark:border-red-400/40 dark:bg-red-500/15 dark:text-red-50",
};

export default function InvoicesPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    setSelectedInvoices(new Set());
  }, [debouncedSearch, statusFilter]);

  const {
    data,
    isLoading: isInvoicesLoading,
    isError: isInvoicesError,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useQuery({
    queryKey: ["invoices", page, pageSize, debouncedSearch, statusFilter],
    queryFn: () => fetchInvoices({
      page,
      limit: pageSize,
      search: debouncedSearch,
      status: statusFilter
    }),
  });

  const invoices = data?.invoices ?? [];
  const metadata = data?.metadata;
  const summary = data?.summary;



  const isLoading = isInvoicesLoading;
  const hasError = isInvoicesError;
  const errorMessage = (invoicesError as Error)?.message ?? null;

  // Bulk Actions Logic
  const toggleSelectAll = () => {
    if (selectedInvoices.size === invoices.length && invoices.length > 0) {
      setSelectedInvoices(new Set());
    } else {
      setSelectedInvoices(new Set(invoices.map((inv) => inv.id)));
    }
  };

  const toggleSelectInvoice = (id: string) => {
    const newSelected = new Set(selectedInvoices);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedInvoices(newSelected);
  };

  const bulkActionMutation = useMutation({
    mutationFn: async ({
      action,
      status,
      ids,
    }: {
      action: "delete" | "status";
      status?: string;
      ids?: string[];
    }) => {
      const targetIds = ids || Array.from(selectedInvoices);

      if (targetIds.length === 0) {
        throw new Error("No invoices selected");
      }

      const response = await fetch("/api/invoices/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: targetIds,
          action,
          status,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Bulk action failed");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Success",
        description:
          variables.action === "delete"
            ? "Invoices deleted successfully"
            : "Invoice status updated",
      });
      setSelectedInvoices(new Set());
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleBulkDelete = () => {
    if (confirm("Are you sure you want to delete the selected invoices?")) {
      bulkActionMutation.mutate({ action: "delete" });
    }
  };

  const handleBulkStatusChange = (status: string) => {
    bulkActionMutation.mutate({ action: "status", status });
  };

  const handleBulkExport = () => {
    const selectedData = invoices.filter((inv) => selectedInvoices.has(inv.id));

    const csvContent = [
      ["Invoice Number", "Client", "Issue Date", "Due Date", "Status", "Total", "Currency"],
      ...selectedData.map((inv) => [
        inv.invoice_number,
        inv.clients?.name ?? "",
        inv.date ? formatDate(inv.date) : "",
        inv.due_date ? formatDate(inv.due_date) : "",
        inv.status,
        inv.total?.toString() ?? "0",
        inv.currency
      ])
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `invoices_export_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <WorkspaceShell
      title="Invoices"
      description="Generate HTML/PDF invoices, sync suppliers, and reconcile payments."
      actions={
        <div className="flex gap-2">
          {selectedInvoices.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Actions ({selectedInvoices.size}) <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                {invoiceStatuses.map((status) => (
                  <DropdownMenuItem
                    key={status.value}
                    onClick={() => handleBulkStatusChange(status.value)}
                  >
                    Mark as {status.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleBulkExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export to CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleBulkDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchInvoices()}
            disabled={isLoading}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/invoices/new">
              <Plus className="mr-2 h-4 w-4" />
              Create invoice
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="overflow-hidden border-none shadow-md hover-lift">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blue-500/5 pointer-events-none" />
          <CardHeader className="pb-2 relative">
            <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground font-bold">Total Invoices</CardDescription>
            <CardTitle className="text-3xl font-bold text-gradient">
              {metadata?.total ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="overflow-hidden border-none shadow-md hover-lift">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-orange-500/5 pointer-events-none" />
          <CardHeader className="pb-2 relative">
            <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground font-bold">Outstanding</CardDescription>
            <CardTitle className="text-2xl font-bold text-orange-600">
              {summary?.outstanding && Object.keys(summary.outstanding).length > 0 ? (
                Object.entries(summary.outstanding).map(([currency, amount]) => (
                  <div key={currency}>{formatCurrency(amount, currency)}</div>
                ))
              ) : (
                <div className="text-muted-foreground">—</div>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="overflow-hidden border-none shadow-md hover-lift">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-green-500/5 pointer-events-none" />
          <CardHeader className="pb-2 relative">
            <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground font-bold">Collected</CardDescription>
            <CardTitle className="text-2xl font-bold text-green-600">
              {summary?.collected && Object.keys(summary.collected).length > 0 ? (
                Object.entries(summary.collected).map(([currency, amount]) => (
                  <div key={currency}>{formatCurrency(amount, currency)}</div>
                ))
              ) : (
                <div className="text-muted-foreground">—</div>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="overflow-hidden border-none shadow-md hover-lift">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-500/10 via-transparent to-slate-500/5 pointer-events-none" />
          <CardHeader className="pb-2 relative">
            <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground font-bold">Draft Volume</CardDescription>
            <CardTitle className="text-2xl font-bold text-muted-foreground">
              {summary?.draft && Object.keys(summary.draft).length > 0 ? (
                Object.entries(summary.draft).map(([currency, amount]) => (
                  <div key={currency}>{formatCurrency(amount, currency)}</div>
                ))
              ) : (
                <div className="text-muted-foreground">—</div>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Filter invoices</CardTitle>
          <CardDescription>Search and filter by status</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md border px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by number..."
              className="h-8 border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {invoiceStatuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter("all");
              setSearchTerm("");
            }}
          >
            Reset
          </Button>
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
          <CardTitle>Billing queue</CardTitle>
          <CardDescription>All invoices with payment tracking</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No invoices found.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          invoices.length > 0 &&
                          selectedInvoices.size === invoices.length
                        }
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Issue date</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedInvoices.has(invoice.id)}
                          onCheckedChange={() => toggleSelectInvoice(invoice.id)}
                          aria-label={`Select invoice ${invoice.invoice_number}`}
                        />
                      </TableCell>
                      <TableCell className="font-semibold">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="hover:underline"
                        >
                          {invoice.invoice_number}
                        </Link>
                      </TableCell>
                      <TableCell>{invoice.clients?.name ?? "—"}</TableCell>
                      <TableCell>
                        {invoice.date ? formatDate(invoice.date) : "—"}
                      </TableCell>
                      <TableCell>
                        {invoice.due_date ? (
                          formatDate(invoice.due_date)
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <StatusDropdown
                          currentStatus={invoice.status}
                          options={invoiceStatuses}
                          onStatusChange={(newStatus) =>
                            bulkActionMutation.mutate({ action: "status", status: newStatus, ids: [invoice.id] })
                          }
                          statusColorMap={INVOICE_STATUS_COLORS}
                          isLoading={bulkActionMutation.isPending && bulkActionMutation.variables?.ids?.[0] === invoice.id}
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(invoice.total ?? 0, invoice.currency ?? "USD")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => generateInvoicePDF(invoice)}
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/invoices/${invoice.id}`}>
                                  <Eye className="mr-2 h-4 w-4" /> View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/invoices/${invoice.id}/edit`}>
                                  <Pencil className="mr-2 h-4 w-4" /> Edit Invoice
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => generateInvoicePDF(invoice)}>
                                <Download className="mr-2 h-4 w-4" /> Download PDF
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                              {invoiceStatuses.map((status) => (
                                <DropdownMenuItem
                                  key={status.value}
                                  onClick={() => {
                                    bulkActionMutation.mutate({
                                      action: "status",
                                      status: status.value,
                                      ids: [invoice.id],
                                    });
                                  }}
                                  disabled={invoice.status === status.value}
                                >
                                  Mark as {status.label}
                                </DropdownMenuItem>
                              ))}

                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  if (confirm("Delete this invoice?")) {
                                    bulkActionMutation.mutate({
                                      action: "delete",
                                      ids: [invoice.id],
                                    });
                                  }
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                  Page {page} of {metadata?.totalPages ?? 1}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= (metadata?.totalPages ?? 1) || isLoading}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </WorkspaceShell>
  );
}


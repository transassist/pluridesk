"use client";

import { useEffect, useMemo, useState, MouseEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  RefreshCcw,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ClientFormSheet } from "@/components/clients/client-form-sheet";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

type ClientRecord = Database["public"]["Tables"]["clients"]["Row"];
type JobRecord = Database["public"]["Tables"]["jobs"]["Row"];
type InvoiceRecord = Database["public"]["Tables"]["invoices"]["Row"];

const fetchClients = async (): Promise<ClientRecord[]> => {
  const response = await fetch("/api/clients");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error ?? "Unable to load clients");
  }
  const payload = await response.json();
  return payload.clients as ClientRecord[];
};

const fetchJobs = async (): Promise<JobRecord[]> => {
  const response = await fetch("/api/jobs");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error ?? "Unable to load jobs");
  }
  const payload = await response.json();
  return payload.jobs as JobRecord[];
};

const fetchInvoices = async (): Promise<InvoiceRecord[]> => {
  const response = await fetch("/api/invoices");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error ?? "Unable to load invoices");
  }
  const payload = await response.json();
  return payload.invoices as InvoiceRecord[];
};

type SortColumn = "name" | "contact" | "currency" | "jobs" | "revenue";
type SortDirection = "asc" | "desc";

const PAGE_SIZE = 10;

export default function ClientsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ column: SortColumn; direction: SortDirection }>({
    column: "name",
    direction: "asc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    data: clients = [],
    isLoading: isClientsLoading,
    isError: isClientsError,
    error: clientsError,
    refetch: refetchClients,
  } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  const {
    data: jobs = [],
    isLoading: isJobsLoading,
    isError: isJobsError,
    error: jobsError,
  } = useQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobs,
  });

  const {
    data: invoices = [],
    isLoading: isInvoicesLoading,
    isError: isInvoicesError,
    error: invoicesError,
  } = useQuery({
    queryKey: ["invoices"],
    queryFn: fetchInvoices,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredClients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return clients.filter((client) => {
      if (!query.length) return true;
      return (
        client.name.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.contact_name?.toLowerCase().includes(query)
      );
    });
  }, [clients, searchTerm]);

  const clientStats = useMemo(() => {
    const stats: Record<
      string,
      { jobCount: number; totalRevenue: number; activeJobs: number; lastJobDate: string | null }
    > = {};
    jobs.forEach((job) => {
      if (!stats[job.client_id]) {
        stats[job.client_id] = {
          jobCount: 0,
          totalRevenue: 0,
          activeJobs: 0,
          lastJobDate: null,
        };
      }

      const bucket = stats[job.client_id];
      bucket.jobCount += 1;
      bucket.totalRevenue += job.total_amount ?? 0;
      if (!["cancelled", "invoiced"].includes(job.status)) {
        bucket.activeJobs += 1;
      }
      if (job.created_at) {
        const current = bucket.lastJobDate ? new Date(bucket.lastJobDate) : null;
        const jobDate = new Date(job.created_at);
        if (!current || jobDate > current) {
          bucket.lastJobDate = job.created_at;
        }
      }
    });
    return stats;
  }, [jobs]);

  const invoiceStats = useMemo(() => {
    const stats: Record<
      string,
      { outstanding: number; lastInvoiceDate: string | null; lastInvoiceTotal: number | null }
    > = {};

    invoices.forEach((invoice) => {
      if (!stats[invoice.client_id]) {
        stats[invoice.client_id] = {
          outstanding: 0,
          lastInvoiceDate: null,
          lastInvoiceTotal: null,
        };
      }

      const bucket = stats[invoice.client_id];
      const invoiceDate = invoice.date ?? invoice.due_date ?? null;
      if (invoice.status !== "paid") {
        bucket.outstanding += invoice.total ?? 0;
      }
      if (invoiceDate) {
        const current = bucket.lastInvoiceDate ? new Date(bucket.lastInvoiceDate) : null;
        const compareDate = new Date(invoiceDate);
        if (!current || compareDate > current) {
          bucket.lastInvoiceDate = invoiceDate;
          bucket.lastInvoiceTotal = invoice.total ?? 0;
        }
      }
    });

    return stats;
  }, [invoices]);

  const revenueByCurrency = useMemo(() => {
    return jobs.reduce<Record<string, number>>((acc, job) => {
      const currency = job.currency ?? "USD";
      acc[currency] = (acc[currency] ?? 0) + (job.total_amount ?? 0);
      return acc;
    }, {});
  }, [jobs]);

  const outstandingByCurrency = useMemo(() => {
    return invoices.reduce<Record<string, number>>((acc, invoice) => {
      if (invoice.status === "paid") {
        return acc;
      }
      const currency = invoice.currency ?? "USD";
      acc[currency] = (acc[currency] ?? 0) + (invoice.total ?? 0);
      return acc;
    }, {});
  }, [invoices]);

  const clientsWithMetrics = useMemo(() => {
    return filteredClients.map((client) => ({
      client,
      stats:
        clientStats[client.id] ??
        ({ jobCount: 0, totalRevenue: 0, activeJobs: 0, lastJobDate: null } as const),
      invoices:
        invoiceStats[client.id] ??
        ({ outstanding: 0, lastInvoiceDate: null, lastInvoiceTotal: null } as const),
    }));
  }, [filteredClients, clientStats, invoiceStats]);

  const sortedClients = useMemo(() => {
    const sorted = [...clientsWithMetrics];
    sorted.sort((left, right) => {
      let comparison = 0;
      switch (sortConfig.column) {
        case "name":
          comparison = left.client.name.localeCompare(right.client.name);
          break;
        case "contact": {
          const leftContact =
            (left.client.contact_name ?? left.client.email ?? "").toLowerCase();
          const rightContact =
            (right.client.contact_name ?? right.client.email ?? "").toLowerCase();
          comparison = leftContact.localeCompare(rightContact);
          break;
        }
        case "currency": {
          const leftCurrency = (left.client.default_currency ?? "").toUpperCase();
          const rightCurrency = (right.client.default_currency ?? "").toUpperCase();
          comparison = leftCurrency.localeCompare(rightCurrency);
          break;
        }
        case "jobs":
          comparison = left.stats.jobCount - right.stats.jobCount;
          break;
        case "revenue":
          comparison = left.stats.totalRevenue - right.stats.totalRevenue;
          break;
      }
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [clientsWithMetrics, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedClients.length / PAGE_SIZE));
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return sortedClients.slice(start, end);
  }, [sortedClients, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const totalActiveJobs = jobs.filter(
    (job) => job.status !== "cancelled" && job.status !== "invoiced",
  ).length;
  const outstandingEntries = Object.entries(outstandingByCurrency).sort(
    (a, b) => (b[1] ?? 0) - (a[1] ?? 0),
  );
  const outstandingSummary = outstandingEntries
    .map(([currency, amount]) => `${formatCurrency(amount, currency)} ${currency}`)
    .join(" · ");
  const hasOutstandingBalances = outstandingEntries.length > 0;

  const isLoading = isClientsLoading || isJobsLoading || isInvoicesLoading;
  const hasError = isClientsError || isJobsError || isInvoicesError;
  const errorMessage =
    (clientsError as Error)?.message ??
    (jobsError as Error)?.message ??
    (invoicesError as Error)?.message ??
    null;

  const toggleSort = (column: SortColumn) => {
    setSortConfig((previous) =>
      previous.column === column
        ? { column, direction: previous.direction === "asc" ? "desc" : "asc" }
        : { column, direction: "asc" },
    );
  };

  const renderSortIcon = (column: SortColumn) => {
    if (sortConfig.column !== column) {
      return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="ml-1 h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="ml-1 h-3.5 w-3.5" />
    );
  };

  const handleRowClick = (event: MouseEvent<HTMLTableRowElement>, clientId: string) => {
    const target = event.target as HTMLElement;
    if (target.closest("[data-row-action='true']")) {
      return;
    }
    router.push(`/clients/${clientId}`);
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      setDeletingId(clientId);
      const response = await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error ?? "Unable to delete client");
      }
      toast({
        title: "Client archived",
        description: "The client has been removed from your roster.",
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["clients"] }),
        queryClient.invalidateQueries({ queryKey: ["jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["invoices"] }),
      ]);
    } catch (error) {
      toast({
        title: "Failed to delete client",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const summaryRevenueEntries = Object.entries(revenueByCurrency).sort(
    (a, b) => (b[1] ?? 0) - (a[1] ?? 0),
  );

  return (
    <WorkspaceShell
      title="Clients"
      description="Master client data, files, rates, and cash position."
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchClients()}
            disabled={isLoading}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <ClientFormSheet />
        </div>
      }
    >
      <div className="mt-6 space-y-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Total clients</CardDescription>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-3xl">{clients.length}</CardTitle>
            <p className="text-sm text-muted-foreground">Live records synced with Supabase</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Active jobs</CardDescription>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-3xl">{totalActiveJobs}</CardTitle>
              <p className="text-sm text-muted-foreground">{jobs.length} total jobs</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Revenue (native currencies)</CardDescription>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-3xl">
                {summaryRevenueEntries.length
                  ? formatCurrency(
                      summaryRevenueEntries[0][1],
                      summaryRevenueEntries[0][0] ?? "USD",
                    )
                  : formatCurrency(0, "USD")}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {summaryRevenueEntries.length
                  ? summaryRevenueEntries
                      .slice(0, 3)
                      .map(
                        ([currency, amount]) =>
                          `${formatCurrency(amount, currency)} ${currency}`,
                      )
                      .join(" · ")
                  : "No jobs logged yet"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Search clients</CardTitle>
            <CardDescription>Find clients by name, contact, or email</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 rounded-md border px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, contact, or email"
                className="h-8 border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
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
            <CardTitle>CRM overview</CardTitle>
            <CardDescription>Jump into a client profile in one click</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : paginatedClients.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No clients found. Create one to get started.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="flex h-8 items-center gap-1 px-0 text-[0.75rem] font-semibold uppercase tracking-wide text-muted-foreground hover:bg-transparent"
                          onClick={() => toggleSort("name")}
                        >
                          Client
                          {renderSortIcon("name")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="flex h-8 items-center gap-1 px-0 text-[0.75rem] font-semibold uppercase tracking-wide text-muted-foreground hover:bg-transparent"
                          onClick={() => toggleSort("contact")}
                        >
                          Contact
                          {renderSortIcon("contact")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="flex h-8 items-center gap-1 px-0 text-[0.75rem] font-semibold uppercase tracking-wide text-muted-foreground hover:bg-transparent"
                          onClick={() => toggleSort("currency")}
                        >
                          Currency
                          {renderSortIcon("currency")}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          className="ml-auto flex h-8 items-center gap-1 px-0 text-[0.75rem] font-semibold uppercase tracking-wide text-muted-foreground hover:bg-transparent"
                          onClick={() => toggleSort("jobs")}
                        >
                          Jobs
                          {renderSortIcon("jobs")}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          className="ml-auto flex h-8 items-center gap-1 px-0 text-[0.75rem] font-semibold uppercase tracking-wide text-muted-foreground hover:bg-transparent"
                          onClick={() => toggleSort("revenue")}
                        >
                          Revenue
                          {renderSortIcon("revenue")}
                        </Button>
                      </TableHead>
                      <TableHead className="w-12 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedClients.map(({ client, stats, invoices: invoiceMetrics }) => (
                      <TableRow
                        key={client.id}
                        className="cursor-pointer odd:bg-muted/30"
                        onClick={(event) => handleRowClick(event, client.id)}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold tracking-tight">{client.name}</span>
                            {stats.lastJobDate && (
                              <span className="text-xs text-muted-foreground">
                                Last job {formatDate(stats.lastJobDate)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {client.contact_name ?? client.email ?? "—"}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {client.email ?? "No email provided"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {client.default_currency ?? "USD"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-semibold">{stats.jobCount}</div>
                          <p className="text-xs text-muted-foreground">
                            {stats.activeJobs} active
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-semibold">
                            {formatCurrency(stats.totalRevenue, client.default_currency ?? "USD")}
                          </div>
                          {invoiceMetrics.lastInvoiceDate && (
                            <p className="text-xs text-muted-foreground">
                              Last invoice {formatDate(invoiceMetrics.lastInvoiceDate)}
                            </p>
                          )}
                          {invoiceMetrics.outstanding > 0 && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                              Outstanding {formatCurrency(
                                invoiceMetrics.outstanding,
                                client.default_currency ?? "USD",
                              )}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right" data-row-action="true">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Client actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onSelect={() => router.push(`/clients/${client.id}`)}
                              >
                                View profile
                              </DropdownMenuItem>
                              <ClientFormSheet
                                client={client}
                                trigger={
                                  <DropdownMenuItem>Edit client</DropdownMenuItem>
                                }
                              />
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                disabled={deletingId === client.id}
                                onSelect={() => handleDeleteClient(client.id)}
                              >
                                {deletingId === client.id ? "Archiving…" : "Archive client"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    Showing {(currentPage - 1) * PAGE_SIZE + 1} -{" "}
                    {(currentPage - 1) * PAGE_SIZE + paginatedClients.length} of{" "}
                    {sortedClients.length} clients
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                      Previous
                    </Button>
                    <span>
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {hasOutstandingBalances && (
          <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
            <AlertTitle>Outstanding balance</AlertTitle>
            <AlertDescription>
              {outstandingSummary || "Outstanding invoices pending reconciliation."}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </WorkspaceShell>
  );
}




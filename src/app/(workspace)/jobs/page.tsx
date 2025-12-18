"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Briefcase,
  Building2,
  ChevronDown,
  Filter,
  Layers,
  Loader2,
  MoreHorizontal,
  RefreshCcw,
  Search,
  Users,
  Eye,
  Edit,
  Copy,
  Trash2,

  ChevronLeft,
  ChevronRight,
  FileText,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { JobFormSheet } from "@/components/jobs/job-form-sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusDropdown } from "@/components/ui/status-dropdown";
import { jobStatuses } from "@/lib/constants/jobs";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";
import { toast } from "@/components/ui/use-toast";
import { useDebounce } from "@/lib/hooks/use-debounce";

type JobRecord = Database["public"]["Tables"]["jobs"]["Row"] & {
  clients: { name: string } | null;
};

type ClientRecord = Database["public"]["Tables"]["clients"]["Row"];

type JobsResponse = {
  jobs: JobRecord[];
  metadata: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const fetchJobs = async (params: URLSearchParams): Promise<JobsResponse> => {
  const response = await fetch(`/api/jobs?${params.toString()}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error ?? "Unable to load jobs");
  }
  return response.json();
};

const fetchClients = async (): Promise<ClientRecord[]> => {
  const response = await fetch("/api/clients");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error ?? "Unable to load clients");
  }
  const payload = await response.json();
  return payload.clients as ClientRecord[];
};

const currencyLocaleMap: Record<string, string> = {
  USD: "en-US",
  EUR: "fr-FR",
  GBP: "en-GB",
  CAD: "en-CA",
  MAD: "fr-FR",
};

type SortColumn = "job_code" | "client" | "status" | "due_date" | "amount" | "created_at";
type SortDirection = "asc" | "desc";
type RowAction = "view" | "edit" | "duplicate" | "delete";

const JOB_STATUS_LABELS = jobStatuses.reduce<Record<string, string>>((acc, status) => {
  acc[status.value] = status.label;
  return acc;
}, {});

const JOB_STATUS_COLORS: Record<string, string> = {
  created: "border-border bg-muted text-muted-foreground",
  in_progress:
    "border-blue-400/50 bg-blue-50 text-blue-800 dark:border-blue-400/40 dark:bg-blue-500/15 dark:text-blue-100",
  finished:
    "border-emerald-400/50 bg-emerald-50 text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-500/15 dark:text-emerald-50",
  invoiced:
    "border-purple-400/50 bg-purple-50 text-purple-800 dark:border-purple-400/40 dark:bg-purple-500/15 dark:text-purple-100",
  on_hold:
    "border-amber-400/50 bg-amber-50 text-amber-800 dark:border-amber-400/40 dark:bg-amber-500/15 dark:text-amber-100",
  cancelled:
    "border-red-400/50 bg-red-50 text-red-800 dark:border-red-400/40 dark:bg-red-500/15 dark:text-red-50",
};

const formatAmountWithCurrencyCode = (amount: number, currency: string) => {
  const resolvedCurrency = currency || "USD";
  return `${formatCurrency(amount, resolvedCurrency, currencyLocaleMap[resolvedCurrency] ?? "en-US")} ${resolvedCurrency}`;
};

export default function JobsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // State for filters and pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [outsourcingFilter, setOutsourcingFilter] = useState<"all" | "with_outsourcing">("all");
  const [sortConfig, setSortConfig] = useState<{ column: SortColumn; direction: SortDirection }>({
    column: "created_at",
    direction: "desc",
  });

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Bulk actions state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Construct query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", pageSize.toString());
    params.set("sort", sortConfig.column);
    params.set("order", sortConfig.direction);

    if (statusFilter !== "all") params.set("status", statusFilter);
    if (clientFilter !== "all") params.set("client_id", clientFilter);
    if (outsourcingFilter !== "all") params.set("outsourcing", outsourcingFilter);
    if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);

    return params;
  }, [page, pageSize, sortConfig, statusFilter, clientFilter, outsourcingFilter, debouncedSearchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, clientFilter, outsourcingFilter, debouncedSearchTerm]);

  const {
    data,
    isLoading: isJobsLoading,
    isError: isJobsError,
    error: jobsError,
    refetch: refetchJobs,
  } = useQuery({
    queryKey: ["jobs", queryParams.toString()],
    queryFn: () => fetchJobs(queryParams),
    placeholderData: (previousData) => previousData,
  });

  const jobs = data?.jobs ?? [];
  const metadata = data?.metadata;

  const {
    data: clients = [],
    isLoading: isClientsLoading,
    isError: isClientsError,
    error: clientsError,
  } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  const clientOptions = useMemo(
    () =>
      clients.map((client) => ({
        id: client.id,
        name: client.name,
        default_currency: client.default_currency,
      })),
    [clients],
  );

  // Calculate totals from current page (Note: ideally this should be from server for all jobs)
  // For MVP we'll show totals for *visible* jobs or fetch a separate stats endpoint
  // Let's keep it simple and show totals for current page for now, or remove if confusing.
  // Actually, let's calculate it from the current page data as a "Page Total"
  const currencyTotals = useMemo(() => {
    return jobs.reduce<Record<string, number>>((acc, job) => {
      const key = job.currency ?? "USD";
      acc[key] = (acc[key] ?? 0) + (job.total_amount ?? 0);
      return acc;
    }, {});
  }, [jobs]);

  const isLoading = isJobsLoading || isClientsLoading;
  const hasError = isJobsError || isClientsError;
  const errorMessage =
    (jobsError as Error)?.message ?? (clientsError as Error)?.message ?? null;
  const statusButtonLabel =
    statusFilter === "all"
      ? "Status: All"
      : `Status: ${JOB_STATUS_LABELS[statusFilter] ?? statusFilter}`;
  const selectedClientName =
    clientFilter === "all"
      ? null
      : clientOptions.find((client) => client.id === clientFilter)?.name ?? null;
  const clientButtonLabel = selectedClientName
    ? `Client: ${selectedClientName}`
    : "Client: All";
  const outsourcingButtonLabel =
    outsourcingFilter === "all" ? "Outsourcing: All" : "Outsourcing: Attached";

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
    if (sortConfig.direction === "asc") {
      return <ArrowUp className="ml-1 h-3.5 w-3.5" />;
    }
    return <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  // Bulk Actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(jobs.map(job => job.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch("/api/jobs/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) throw new Error("Failed to delete jobs");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setSelectedIds(new Set());
      toast({ title: "Success", description: "Jobs deleted successfully" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete jobs" });
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const response = await fetch("/api/jobs/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status }),
      });
      if (!response.ok) throw new Error("Failed to update jobs");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setSelectedIds(new Set());
      toast({ title: "Success", description: "Jobs updated successfully" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to update jobs" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/jobs/bulk`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id], status }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast({ title: "Updated", description: "Job status updated successfully" });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message ?? "Failed to update status",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await fetch(`/api/jobs?id=${jobId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete job");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast({
        title: "Success",
        description: "Job deleted successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete job",
      });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (job: JobRecord) => {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${job.title} (Copy)`,
          client_id: job.client_id,
          service_type: job.service_type,
          pricing_type: job.pricing_type,
          quantity: job.quantity,
          rate: job.rate,
          currency: job.currency,
          total_amount: job.total_amount,
          due_date: job.due_date,
          notes: job.notes,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to duplicate job");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast({
        title: "Success",
        description: "Job duplicated successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to duplicate job",
      });
    },
  });

  // Edit state
  const [editingJob, setEditingJob] = useState<JobRecord | null>(null);

  const handleCreateInvoice = async (ids: string[]) => {
    const selectedJobs = jobs.filter(job => ids.includes(job.id));

    if (selectedJobs.length === 0) return;

    // Validate Client
    const firstClientId = selectedJobs[0].client_id;
    const hasDifferentClient = selectedJobs.some(job => job.client_id !== firstClientId);

    if (hasDifferentClient) {
      toast({
        variant: "destructive",
        title: "Invalid selection",
        description: "All selected jobs must belong to the same client.",
      });
      return;
    }

    // Validate Currency
    const firstCurrency = selectedJobs[0].currency;
    const hasDifferentCurrency = selectedJobs.some(job => job.currency !== firstCurrency);

    if (hasDifferentCurrency) {
      toast({
        variant: "destructive",
        title: "Invalid selection",
        description: "All selected jobs must have the same currency.",
      });
      return;
    }

    try {
      const response = await fetch("/api/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_ids: ids,
          client_id: firstClientId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate invoice");
      }

      const { invoice } = await response.json();

      toast({
        title: "Success",
        description: "Invoice created successfully",
      });

      router.push(`/invoices/${invoice.id}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message,
      });
    }
  };

  const handleRowAction = (action: RowAction, job: JobRecord) => {
    switch (action) {
      case "view":
        router.push(`/jobs/${job.id}`);
        break;
      case "edit":
        setEditingJob(job);
        break;
      case "duplicate":
        if (confirm(`Duplicate job "${job.job_code ?? job.title}"?`)) {
          duplicateMutation.mutate(job);
        }
        break;
      case "delete":
        if (
          confirm(
            `Are you sure you want to delete "${job.job_code ?? job.title}"? This action cannot be undone.`
          )
        ) {
          deleteMutation.mutate(job.id);
        }
        break;
    }
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setClientFilter("all");
    setOutsourcingFilter("all");
    setSearchTerm("");
    setPage(1);
  };

  return (
    <WorkspaceShell
      title="Jobs"
      description="Track every production job, hand-off, and workflow step."
      actions={
        <div className="flex gap-2">
          <Button size="sm" onClick={() => refetchJobs()} disabled={isLoading}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <JobFormSheet clients={clientOptions} />
        </div>
      }
    >
      {/* Edit Sheet */}
      {editingJob && (
        <JobFormSheet
          clients={clientOptions}
          job={{
            ...editingJob,
            // Ensure types match what JobForm expects
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            status: editingJob.status as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pricing_type: editingJob.pricing_type as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            currency: editingJob.currency as any,
            quantity: editingJob.quantity ?? 0,
            rate: editingJob.rate ?? 0,
            purchase_order_ref: editingJob.purchase_order_ref ?? undefined,
            due_date: editingJob.due_date ?? undefined,
            start_date: editingJob.start_date ?? undefined,
            notes: editingJob.notes ?? undefined,
          }}
          open={!!editingJob}
          onOpenChange={(open) => !open && setEditingJob(null)}
          trigger={<span className="hidden" />} // Hidden trigger since we control open state
        />
      )}

      <div className="space-y-8">
        <section>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(currencyTotals).map(([currency, amount]) => (
              <Card key={currency} className="overflow-hidden border-none shadow-md hover-lift">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blue-500/5 pointer-events-none" />
                <CardHeader className="pb-3 relative">
                  <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground font-bold">
                    Open value (Page)
                  </CardDescription>
                  <div className="flex items-baseline gap-2">
                    <CardTitle className="text-3xl font-bold text-gradient">
                      {formatAmountWithCurrencyCode(amount, currency)}
                    </CardTitle>
                  </div>
                </CardHeader>
              </Card>
            ))}
            {Object.keys(currencyTotals).length === 0 && (
              <Card className="overflow-hidden border-none shadow-md hover-lift">
                <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-transparent pointer-events-none" />
                <CardHeader className="pb-3 relative">
                  <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground font-bold">
                    Open value (Page)
                  </CardDescription>
                  <CardTitle className="text-3xl text-muted-foreground">
                    {formatAmountWithCurrencyCode(0, "USD")}
                  </CardTitle>
                </CardHeader>
              </Card>
            )}
          </div>
        </section>

        <section>
          <Card>
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Filter className="h-4 w-4" />
                Filters
              </div>
              <CardTitle>Filter jobs</CardTitle>
              <CardDescription>
                Combine filters to surface the workflow slice you need.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-md border bg-card px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by title or job code"
                  className="h-8 border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="min-w-[190px] justify-between text-sm font-normal"
                  >
                    <span className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      {statusButtonLabel}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Status</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                    <DropdownMenuRadioItem value="all">All statuses</DropdownMenuRadioItem>
                    {jobStatuses.map((status) => (
                      <DropdownMenuRadioItem key={status.value} value={status.value}>
                        {status.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="min-w-[190px] justify-between text-sm font-normal"
                  >
                    <span className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {clientButtonLabel}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64">
                  <DropdownMenuLabel>Client</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={clientFilter} onValueChange={setClientFilter}>
                    <DropdownMenuRadioItem value="all">All clients</DropdownMenuRadioItem>
                    {clientOptions.map((client) => (
                      <DropdownMenuRadioItem key={client.id} value={client.id}>
                        {client.name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="min-w-[200px] justify-between text-sm font-normal"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {outsourcingButtonLabel}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60">
                  <DropdownMenuLabel>Outsourcing</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={outsourcingFilter}
                    onValueChange={(value) =>
                      setOutsourcingFilter(value as "all" | "with_outsourcing")
                    }
                  >
                    <DropdownMenuRadioItem value="all">All jobs</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="with_outsourcing">
                      With outsourcing
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Reset
              </Button>
            </CardContent>
          </Card>
        </section>

        {hasError && (
          <Alert variant="destructive">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <section>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Job pipeline</CardTitle>
                <CardDescription>
                  {metadata?.total ?? 0} jobs found
                </CardDescription>
              </div>
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                  <span className="text-sm text-muted-foreground mr-2">
                    {selectedIds.size} selected
                  </span>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleCreateInvoice(Array.from(selectedIds))}
                  >
                    <FileText className="mr-2 h-3 w-3" />
                    Create Invoice
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Change Status
                        <ChevronDown className="ml-2 h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Set status to...</DropdownMenuLabel>
                      {jobStatuses.map((status) => (
                        <DropdownMenuItem
                          key={status.value}
                          onClick={() => bulkStatusMutation.mutate({
                            ids: Array.from(selectedIds),
                            status: status.value
                          })}
                        >
                          {status.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Delete ${selectedIds.size} jobs?`)) {
                        bulkDeleteMutation.mutate(Array.from(selectedIds));
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-3 w-3" />
                    Delete
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : jobs.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <div className="rounded-full border border-dashed p-3 text-muted-foreground">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-base font-medium">No jobs found</p>
                    <p className="text-sm text-muted-foreground">
                      Adjust your filters or create your first job.
                    </p>
                  </div>
                  <JobFormSheet
                    clients={clientOptions}
                    trigger={
                      <Button size="sm">
                        Create job
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            checked={jobs.length > 0 && selectedIds.size === jobs.length}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="w-[200px]">
                          <Button
                            variant="ghost"
                            className="flex h-8 items-center gap-1 px-0 text-[0.75rem] font-semibold uppercase tracking-wide text-muted-foreground hover:bg-transparent"
                            onClick={() => toggleSort("job_code")}
                          >
                            Job
                            {renderSortIcon("job_code")}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            className="flex h-8 items-center gap-1 px-0 text-[0.75rem] font-semibold uppercase tracking-wide text-muted-foreground hover:bg-transparent"
                            onClick={() => toggleSort("client")}
                          >
                            Client
                            {renderSortIcon("client")}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            className="flex h-8 items-center gap-1 px-0 text-[0.75rem] font-semibold uppercase tracking-wide text-muted-foreground hover:bg-transparent"
                            onClick={() => toggleSort("status")}
                          >
                            Status
                            {renderSortIcon("status")}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            className="flex h-8 items-center gap-1 px-0 text-[0.75rem] font-semibold uppercase tracking-wide text-muted-foreground hover:bg-transparent"
                            onClick={() => toggleSort("due_date")}
                          >
                            Due
                            {renderSortIcon("due_date")}
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            className="ml-auto flex h-8 items-center gap-1 px-0 text-[0.75rem] font-semibold uppercase tracking-wide text-muted-foreground hover:bg-transparent"
                            onClick={() => toggleSort("amount")}
                          >
                            Amount
                            {renderSortIcon("amount")}
                          </Button>
                        </TableHead>
                        <TableHead className="w-12 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job) => {
                        const currency = job.currency ?? "USD";
                        return (
                          <TableRow
                            key={job.id}
                            className="odd:bg-muted/30 cursor-pointer hover:bg-muted/50"
                            onClick={() => router.push(`/jobs/${job.id}`)}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedIds.has(job.id)}
                                onCheckedChange={(checked) => handleSelectRow(job.id, !!checked)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-semibold tracking-tight">
                                  {job.job_code ?? "—"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {job.title}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {job.clients ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/clients/${job.client_id}`);
                                  }}
                                  className="text-sm font-medium hover:underline text-left"
                                >
                                  {job.clients.name}
                                </button>
                              ) : (
                                <div className="text-sm font-medium text-muted-foreground">—</div>
                              )}
                              {job.has_outsourcing && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/outsourcing?job_id=${job.id}`);
                                  }}
                                  className="text-xs text-muted-foreground hover:underline"
                                >
                                  Outsourcing attached
                                </button>
                              )}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <StatusDropdown
                                currentStatus={job.status}
                                options={jobStatuses.map(s => ({ value: s.value, label: s.label }))}
                                onStatusChange={(newStatus) =>
                                  updateStatusMutation.mutate({ id: job.id, status: newStatus })
                                }
                                statusColorMap={JOB_STATUS_COLORS}
                                isLoading={updateStatusMutation.isPending && updateStatusMutation.variables?.id === job.id}
                              />
                            </TableCell>
                            <TableCell className="text-sm">
                              {job.due_date ? (
                                formatDate(job.due_date)
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="font-semibold">
                                {formatAmountWithCurrencyCode(job.total_amount ?? 0, currency)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onSelect={() => handleRowAction("view", job)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View job
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handleRowAction("edit", job)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit job
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handleRowAction("duplicate", job)}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onSelect={() => handleRowAction("delete", job)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, metadata?.total ?? 0)} of {metadata?.total ?? 0} jobs
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => p + 1)}
                        disabled={page >= (metadata?.totalPages ?? 1)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </WorkspaceShell>
  );
}


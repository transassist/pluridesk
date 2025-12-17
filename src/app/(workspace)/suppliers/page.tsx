"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Loader2,
  RefreshCcw,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Users,
  DollarSign,
  ArrowUpDown,
  Filter,
  ChevronLeft,
  ChevronRight,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { SupplierFormSheet } from "@/components/suppliers/supplier-form-sheet";
import { formatCurrency } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type SupplierRecord = Database["public"]["Tables"]["suppliers"]["Row"];
type SortField = "name" | "jobs" | "rate_word" | "outstanding";
type SortOrder = "asc" | "desc";

const fetchSuppliers = async (): Promise<SupplierRecord[]> => {
  const response = await fetch("/api/suppliers");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error ?? "Unable to load suppliers");
  }
  const payload = await response.json();
  return payload.suppliers as SupplierRecord[];
};

const fetchOutsourcing = async () => {
  const response = await fetch("/api/outsourcing");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error ?? "Unable to load outsourcing data");
  }
  const payload = await response.json();
  return payload.outsourcing;
};

const PAGE_SIZE = 20;

export default function SuppliersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [filterCurrency, setFilterCurrency] = useState<string>("all");
  const [filterJobCount, setFilterJobCount] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: suppliers = [],
    isLoading: isSuppliersLoading,
    isError: isSuppliersError,
    error: suppliersError,
    refetch: refetchSuppliers,
  } = useQuery({
    queryKey: ["suppliers"],
    queryFn: fetchSuppliers,
  });

  const {
    data: outsourcing = [],
    isLoading: isOutsourcingLoading,
  } = useQuery({
    queryKey: ["outsourcing"],
    queryFn: fetchOutsourcing,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/suppliers?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete supplier");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({
        title: "Success",
        description: "Supplier deleted successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete supplier",
      });
    },
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Aggregate outsourcing data by supplier (MUST come before filteredSuppliers)
  const supplierStats = useMemo(() => {
    const stats: Record<
      string,
      { jobCount: number; totalPayable: number; currencyBreakdown: Record<string, number> }
    > = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    outsourcing.forEach((record: any) => {
      if (!stats[record.supplier_id]) {
        stats[record.supplier_id] = {
          jobCount: 0,
          totalPayable: 0,
          currencyBreakdown: {},
        };
      }
      stats[record.supplier_id].jobCount += 1;
      if (!record.paid) {
        stats[record.supplier_id].totalPayable += record.supplier_total ?? 0;
        const currency = record.supplier_currency ?? "USD";
        stats[record.supplier_id].currencyBreakdown[currency] =
          (stats[record.supplier_id].currencyBreakdown[currency] ?? 0) +
          (record.supplier_total ?? 0);
      }
    });
    return stats;
  }, [outsourcing]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      const matchesSearch =
        searchTerm.length === 0 ||
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCurrency =
        filterCurrency === "all" ||
        supplier.default_currency === filterCurrency;

      const stats = supplierStats[supplier.id];
      const jobCount = stats?.jobCount || 0;

      let matchesJobCount = true;
      if (filterJobCount === "active") {
        matchesJobCount = jobCount > 0;
      } else if (filterJobCount === "inactive") {
        matchesJobCount = jobCount === 0;
      }

      return matchesSearch && matchesCurrency && matchesJobCount;
    });
  }, [suppliers, searchTerm, filterCurrency, filterJobCount, supplierStats]);

  // Calculate total payables by currency
  const totalPayablesByCurrency = useMemo(() => {
    const totals: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    outsourcing.forEach((record: any) => {
      if (!record.paid) {
        const currency = record.supplier_currency ?? "USD";
        totals[currency] = (totals[currency] ?? 0) + (record.supplier_total ?? 0);
      }
    });
    return totals;
  }, [outsourcing]);

  // Sorted suppliers
  const sortedSuppliers = useMemo(() => {
    const sorted = [...filteredSuppliers];
    sorted.sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let aValue: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let bValue: any;

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "jobs":
          aValue = supplierStats[a.id]?.jobCount || 0;
          bValue = supplierStats[b.id]?.jobCount || 0;
          break;
        case "rate_word":
          aValue = a.default_rate_word || 0;
          bValue = b.default_rate_word || 0;
          break;
        case "outstanding":
          aValue = supplierStats[a.id]?.totalPayable || 0;
          bValue = supplierStats[b.id]?.totalPayable || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredSuppliers, sortField, sortOrder, supplierStats]);

  // Paginated suppliers
  const totalPages = Math.ceil(sortedSuppliers.length / PAGE_SIZE);
  const paginatedSuppliers = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return sortedSuppliers.slice(startIndex, startIndex + PAGE_SIZE);
  }, [sortedSuppliers, currentPage]);

  // Reset to page 1 when filters change
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCurrency, filterJobCount]);

  const isLoading = isSuppliersLoading || isOutsourcingLoading;
  const hasError = isSuppliersError;
  const errorMessage = (suppliersError as Error)?.message ?? null;

  return (
    <WorkspaceShell
      title="Suppliers"
      description="Manage freelancers, boutique agencies, and outsourcing margins."
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchSuppliers()}
            disabled={isLoading}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <SupplierFormSheet />
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <CardDescription>Active suppliers</CardDescription>
            </div>
            <CardTitle className="text-3xl">{suppliers.length}</CardTitle>
          </CardHeader>
        </Card>
        {Object.entries(totalPayablesByCurrency).length > 0 ? (
          Object.entries(totalPayablesByCurrency).map(([currency, amount]) => (
            <Card key={currency}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <CardDescription>Payables ({currency})</CardDescription>
                </div>
                <CardTitle className="text-3xl">
                  {formatCurrency(amount, currency)}
                </CardTitle>
              </CardHeader>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <CardDescription>Payables</CardDescription>
                </div>
                <CardTitle className="text-3xl text-muted-foreground">0</CardTitle>
              </CardHeader>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle>Search & Filter</CardTitle>
          </div>
          <CardDescription>Find and filter suppliers by various criteria</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 rounded-md border px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name or email"
              className="h-8 border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[160px]">
              <Select value={filterCurrency} onValueChange={setFilterCurrency}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All currencies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All currencies</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="MAD">MAD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[160px]">
              <Select value={filterJobCount} onValueChange={setFilterJobCount}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All suppliers</SelectItem>
                  <SelectItem value="active">With jobs</SelectItem>
                  <SelectItem value="inactive">Without jobs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setFilterCurrency("all");
                setFilterJobCount("all");
              }}
            >
              Reset filters
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
          <CardTitle>Supplier ledger</CardTitle>
          <CardDescription>All suppliers with outsourcing stats</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : sortedSuppliers.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium">No suppliers yet</p>
              <p className="text-xs">
                Add your first supplier to start outsourcing jobs.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 data-[state=open]:bg-accent"
                        onClick={() => handleSort("name")}
                      >
                        Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-mr-3 h-8 ml-auto"
                        onClick={() => handleSort("jobs")}
                      >
                        Jobs
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-mr-3 h-8 ml-auto"
                        onClick={() => handleSort("rate_word")}
                      >
                        Rate/Word
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Rate/Hour</TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-mr-3 h-8 ml-auto"
                        onClick={() => handleSort("outstanding")}
                      >
                        Outstanding
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSuppliers.map((supplier) => {
                    const stats = supplierStats[supplier.id] || {
                      jobCount: 0,
                      totalPayable: 0,
                      currencyBreakdown: {},
                    };
                    const primaryCurrency = Object.keys(stats.currencyBreakdown)[0] ?? "USD";
                    return (
                      <TableRow
                        key={supplier.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/suppliers/${supplier.id}`)}
                      >
                        <TableCell className="font-semibold">{supplier.name}</TableCell>
                        <TableCell>
                          {supplier.email || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{stats.jobCount}</TableCell>
                        <TableCell className="text-right">
                          {supplier.default_rate_word
                            ? formatCurrency(supplier.default_rate_word, supplier.default_currency || "USD")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {supplier.default_rate_hour
                            ? formatCurrency(supplier.default_rate_hour, supplier.default_currency || "USD")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {stats.totalPayable > 0
                            ? formatCurrency(stats.totalPayable, primaryCurrency)
                            : "—"}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => router.push(`/suppliers/${supplier.id}`)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View supplier
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  // TODO: Open edit modal
                                  toast({
                                    title: "Coming soon",
                                    description: "Edit functionality will be added soon",
                                  });
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit supplier
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Are you sure you want to delete "${supplier.name}"? This action cannot be undone.`
                                    )
                                  ) {
                                    deleteMutation.mutate(supplier.id);
                                  }
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete supplier
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
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * PAGE_SIZE) + 1} to{" "}
                    {Math.min(currentPage * PAGE_SIZE, sortedSuppliers.length)} of{" "}
                    {sortedSuppliers.length} suppliers
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-9"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </WorkspaceShell>
  );
}


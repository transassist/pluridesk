"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCcw, Search } from "lucide-react";

import { WorkspaceShell } from "@/components/layout/workspace-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OutsourcingFormSheet } from "@/components/outsourcing/outsourcing-form-sheet";
import { formatCurrency } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type OutsourcingRecord = Database["public"]["Tables"]["outsourcing"]["Row"] & {
  jobs: { job_code: string; title: string } | null;
  suppliers: { name: string } | null;
};

type JobRecord = Database["public"]["Tables"]["jobs"]["Row"];
type SupplierRecord = Database["public"]["Tables"]["suppliers"]["Row"];

const fetchOutsourcing = async (): Promise<OutsourcingRecord[]> => {
  const response = await fetch("/api/outsourcing");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error ?? "Unable to load outsourcing data");
  }
  const payload = await response.json();
  return payload.outsourcing as OutsourcingRecord[];
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

const fetchSuppliers = async (): Promise<SupplierRecord[]> => {
  const response = await fetch("/api/suppliers");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error ?? "Unable to load suppliers");
  }
  const payload = await response.json();
  return payload.suppliers as SupplierRecord[];
};

export default function OutsourcingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [paidFilter, setPaidFilter] = useState("all");

  const {
    data: outsourcing = [],
    isLoading: isOutsourcingLoading,
    isError: isOutsourcingError,
    error: outsourcingError,
    refetch: refetchOutsourcing,
  } = useQuery({
    queryKey: ["outsourcing"],
    queryFn: fetchOutsourcing,
  });

  const {
    data: jobs = [],
    isLoading: isJobsLoading,
  } = useQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobs,
  });

  const {
    data: suppliers = [],
    isLoading: isSuppliersLoading,
  } = useQuery({
    queryKey: ["suppliers"],
    queryFn: fetchSuppliers,
  });

  const filteredOutsourcing = useMemo(() => {
    return outsourcing.filter((record) => {
      const matchesPaid =
        paidFilter === "all" ||
        (paidFilter === "paid" && record.paid) ||
        (paidFilter === "unpaid" && !record.paid);
      const matchesSearch =
        searchTerm.length === 0 ||
        record.jobs?.job_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.jobs?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.suppliers?.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesPaid && matchesSearch;
    });
  }, [outsourcing, paidFilter, searchTerm]);

  const payableByCurrency = useMemo(() => {
    return outsourcing
      .filter((record) => !record.paid)
      .reduce<Record<string, number>>((acc, record) => {
        const key = record.supplier_currency ?? "USD";
        acc[key] = (acc[key] ?? 0) + (record.supplier_total ?? 0);
        return acc;
      }, {});
  }, [outsourcing]);

  const isLoading = isOutsourcingLoading || isJobsLoading || isSuppliersLoading;
  const hasError = isOutsourcingError;
  const errorMessage = (outsourcingError as Error)?.message ?? null;

  return (
    <WorkspaceShell
      title="Outsourcing"
      description="Attach suppliers, file costs, and margins to every job."
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchOutsourcing()}
            disabled={isLoading}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <OutsourcingFormSheet
            jobs={jobs.map((job) => ({
              id: job.id,
              job_code: job.job_code ?? "",
              title: job.title,
            }))}
            suppliers={suppliers.map((supplier) => ({
              id: supplier.id,
              name: supplier.name,
              default_rate_word: supplier.default_rate_word,
              default_rate_hour: supplier.default_rate_hour,
            }))}
          />
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Object.entries(payableByCurrency).map(([currency, amount]) => (
          <Card key={currency}>
            <CardHeader className="pb-2">
              <CardDescription>Pending payout ({currency})</CardDescription>
              <CardTitle className="text-3xl">
                {formatCurrency(amount, currency)}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
        {Object.keys(payableByCurrency).length === 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending payout</CardDescription>
              <CardTitle className="text-3xl text-muted-foreground">0</CardTitle>
            </CardHeader>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Filter outsourcing</CardTitle>
          <CardDescription>Search and filter by payment status</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md border px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by job or supplier"
              className="h-8 border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>

          <Select value={paidFilter} onValueChange={setPaidFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Payment status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPaidFilter("all");
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
          <CardTitle>Vendor queue</CardTitle>
          <CardDescription>All outsourcing records with payment tracking</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredOutsourcing.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No outsourcing records found. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOutsourcing.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {record.jobs?.job_code ?? "—"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {record.jobs?.title}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{record.suppliers?.name ?? "—"}</TableCell>
                    <TableCell>
                      {record.supplier_rate
                        ? formatCurrency(
                            record.supplier_rate,
                            record.supplier_currency ?? "USD"
                          )
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.paid ? "default" : "destructive"}>
                        {record.paid ? "Paid" : "Unpaid"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(
                        record.supplier_total ?? 0,
                        record.supplier_currency ?? "USD"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </WorkspaceShell>
  );
}


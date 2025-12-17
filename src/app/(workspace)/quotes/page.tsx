"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCcw, Search, Plus, MoreHorizontal, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { quoteStatuses } from "@/lib/constants/quotes";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import type { Database } from "@/lib/supabase/types";

type QuoteRecord = Database["public"]["Tables"]["quotes"]["Row"] & {
  clients: { name: string } | null;
};



const fetchQuotes = async (): Promise<QuoteRecord[]> => {
  const response = await fetch("/api/quotes");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error ?? "Unable to load quotes");
  }
  const payload = await response.json();
  return payload.quotes as QuoteRecord[];
};



const statusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline" | "muted"
> = {
  draft: "muted",
  sent: "secondary",
  accepted: "default",
  rejected: "destructive",
};

export default function QuotesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  const {
    data: quotes = [],
    isLoading: isQuotesLoading,
    isError: isQuotesError,
    error: quotesError,
    refetch: refetchQuotes,
  } = useQuery({
    queryKey: ["quotes"],
    queryFn: fetchQuotes,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/quotes/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete quote");
    },
    onSuccess: () => {
      toast({ title: "Quote deleted" });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
  });



  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
      const matchesSearch =
        searchTerm.length === 0 ||
        quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.clients?.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [quotes, statusFilter, searchTerm]);

  const currencyTotals = useMemo(() => {
    return filteredQuotes.reduce<Record<string, number>>((acc, quote) => {
      const key = quote.currency ?? "USD";
      acc[key] = (acc[key] ?? 0) + (quote.total ?? 0);
      return acc;
    }, {});
  }, [filteredQuotes]);

  const isLoading = isQuotesLoading;
  const hasError = isQuotesError;
  const errorMessage = (quotesError as Error)?.message ?? null;

  return (
    <WorkspaceShell
      title="Quotes"
      description="Build estimate templates, convert them into live jobs, and export PDF-ready docs."
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchQuotes()}
            disabled={isLoading}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Link href="/quotes/new">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create quote
            </Button>
          </Link>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Object.entries(currencyTotals).map(([currency, amount]) => (
          <Card key={currency}>
            <CardHeader className="pb-2">
              <CardDescription>Quote value ({currency})</CardDescription>
              <CardTitle className="text-3xl">
                {formatCurrency(amount, currency)}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
        {Object.keys(currencyTotals).length === 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Quote value</CardDescription>
              <CardTitle className="text-3xl text-muted-foreground">0</CardTitle>
            </CardHeader>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Filter quotes</CardTitle>
          <CardDescription>Search and filter by status</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md border px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by number or client"
              className="h-8 border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {quoteStatuses.map((status) => (
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
          <CardTitle>Quote pipeline</CardTitle>
          <CardDescription>All quotes with status tracking</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No quotes found. <Link href="/quotes/new" className="text-primary hover:underline">Create one</Link> to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-semibold">
                      <Link href={`/quotes/${quote.id}`} className="hover:underline">
                        {quote.quote_number}
                      </Link>
                    </TableCell>
                    <TableCell>{quote.clients?.name ?? "—"}</TableCell>
                    <TableCell>
                      {quote.date ? formatDate(quote.date) : "—"}
                    </TableCell>
                    <TableCell>
                      {quote.expiry_date ? (
                        formatDate(quote.expiry_date)
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[quote.status] ?? "secondary"}>
                        {quote.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(quote.total ?? 0, quote.currency ?? "USD")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/quotes/${quote.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this quote?")) {
                                deleteMutation.mutate(quote.id);
                              }
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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


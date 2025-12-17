"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  FileText,
  Loader2,
  Quote,
  TrendingUp,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";
import { Badge } from "@/components/ui/badge";
import { ClientFormSheet } from "@/components/clients/client-form-sheet";
import { ClientContacts } from "@/components/clients/client-contacts";
import { ClientActivities } from "@/components/clients/client-activities";
import { ClientNotes } from "@/components/clients/client-notes";
import { ClientRates } from "@/components/clients/client-rates";
import { ClientDetails } from "@/components/clients/client-details";
import { ClientFiles } from "@/components/clients/client-files";

type ClientRecord = Database["public"]["Tables"]["clients"]["Row"];
type JobRecord = Database["public"]["Tables"]["jobs"]["Row"];
type InvoiceRecord = Database["public"]["Tables"]["invoices"]["Row"];
type QuoteRecord = Database["public"]["Tables"]["quotes"]["Row"];

type ClientDetailResponse = {
  client: ClientRecord;
  jobs: JobRecord[];
  invoices: InvoiceRecord[];
  quotes: QuoteRecord[];
};

const fetchClientDetail = async (clientId: string): Promise<ClientDetailResponse> => {
  const response = await fetch(`/api/clients/${clientId}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error ?? "Unable to load client");
  }
  return response.json();
};

export default function ClientDetailPage() {
  const params = useParams<{ clientId: string }>();
  const router = useRouter();
  const clientId = Array.isArray(params?.clientId) ? params?.clientId[0] : params?.clientId;

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => fetchClientDetail(clientId ?? ""),
    enabled: Boolean(clientId),
  });

  const client = data?.client;
  const jobs = data?.jobs ?? [];
  const invoices = data?.invoices ?? [];
  const quotes = data?.quotes ?? [];

  const revenueEntries = useMemo(() => {
    return jobs.reduce<Record<string, number>>((acc, job) => {
      const currency = job.currency ?? "USD";
      acc[currency] = (acc[currency] ?? 0) + (job.total_amount ?? 0);
      return acc;
    }, {});
  }, [jobs]);

  const outstandingEntries = useMemo(() => {
    return invoices.reduce<Record<string, number>>((acc, invoice) => {
      if (invoice.status === "paid") return acc;
      const currency = invoice.currency ?? "USD";
      acc[currency] = (acc[currency] ?? 0) + (invoice.total ?? 0);
      return acc;
    }, {});
  }, [invoices]);

  const revenueEntryList = useMemo(
    () => Object.entries(revenueEntries).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0)),
    [revenueEntries],
  );

  const outstandingEntryList = useMemo(
    () => Object.entries(outstandingEntries).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0)),
    [outstandingEntries],
  );

  const openJobs = useMemo(
    () =>
      jobs.filter(
        (job) => !["finished", "cancelled", "invoiced"].includes(job.status ?? ""),
      ).length,
    [jobs],
  );


  const [activeTab, setActiveTab] = useState("details");

  if (!clientId) {
    return (
      <WorkspaceShell title="Client" description="Client profile">
        <Alert variant="destructive">
          <AlertTitle>Missing client</AlertTitle>
          <AlertDescription>The client ID was not provided.</AlertDescription>
        </Alert>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell
      title={client?.name ?? "Client"}
      description={
        client
          ? `Primary contact: ${client.contact_name ?? client.email ?? "Not provided"}`
          : "Client profile"
      }
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/clients")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to clients
          </Button>
          {client && (
            <ClientFormSheet
              client={client}
              trigger={
                <Button size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Edit client
                </Button>
              }
            />
          )}
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to load client</AlertTitle>
          <AlertDescription>{(error as Error)?.message}</AlertDescription>
        </Alert>
      ) : !client ? (
        <Alert variant="destructive">
          <AlertTitle>Client not found</AlertTitle>
          <AlertDescription>
            This client may have been removed. Return to the clients list to continue.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-8">
          {/* Top Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>Lifetime revenue</CardDescription>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl">
                  {revenueEntryList.length
                    ? formatCurrency(revenueEntryList[0][1], revenueEntryList[0][0])
                    : formatCurrency(0, client.default_currency ?? "USD")}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {revenueEntryList
                    .map(
                      ([currency, amount]) => `${formatCurrency(amount, currency)} ${currency}`,
                    )
                    .join(" · ") || "No jobs billed yet"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>Open jobs</CardDescription>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl">{openJobs}</CardTitle>
                <p className="text-sm text-muted-foreground">{jobs.length} jobs total</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>Outstanding balance</CardDescription>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl">
                  {outstandingEntryList.length
                    ? formatCurrency(outstandingEntryList[0][1], outstandingEntryList[0][0])
                    : formatCurrency(0, client.default_currency ?? "USD")}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {outstandingEntryList
                    .map(
                      ([currency, amount]) => `${formatCurrency(amount, currency)} ${currency}`,
                    )
                    .join(" · ") || "All invoices paid"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Custom Tabs Interface */}
          <div className="w-full">
            <div className="flex w-full justify-start border-b bg-transparent p-0 overflow-x-auto">
              {["details", "contacts", "activities", "prices", "jobs", "quotes", "invoices", "files", "notes"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "inline-flex min-w-[100px] items-center justify-center whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
                    activeTab === tab
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="mt-6">
              {activeTab === "details" && <ClientDetails client={client} />}

              {activeTab === "contacts" && <ClientContacts clientId={clientId} />}

              {activeTab === "activities" && <ClientActivities clientId={clientId} />}

              {activeTab === "prices" && <ClientRates clientId={clientId} defaultCurrency={client?.default_currency ?? "USD"} />}

              {activeTab === "jobs" && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Jobs</CardTitle>
                      <CardDescription>All jobs for this client</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push("/jobs")}>
                      View all jobs
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {jobs.length === 0 ? (
                      <div className="py-10 text-center text-sm text-muted-foreground">
                        No jobs logged for this client yet.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Job</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Due date</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {jobs.map((job) => (
                            <TableRow key={job.id}>
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
                                <Badge variant="outline" className="capitalize">
                                  {job.status ? job.status.replace("_", " ") : "—"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {job.due_date ? formatDate(job.due_date) : "—"}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatCurrency(job.total_amount ?? 0, job.currency ?? "USD")}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === "quotes" && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Quotes</CardTitle>
                      <CardDescription>All quotes for this client</CardDescription>
                    </div>
                    <Quote className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {quotes.length === 0 ? (
                      <div className="py-10 text-center text-sm text-muted-foreground">
                        No quotes yet.
                      </div>
                    ) : (
                      quotes.map((quote) => (
                        <div
                          key={quote.id}
                          className="flex items-center justify-between rounded-md border px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-semibold">{quote.quote_number}</p>
                            <p className="text-xs text-muted-foreground">
                              {quote.date ? formatDate(quote.date) : "No date"} •{" "}
                              <span className="capitalize">{quote.status}</span>
                            </p>
                          </div>
                          <p className="text-sm font-semibold">
                            {formatCurrency(quote.total ?? 0, quote.currency ?? "USD")}
                          </p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === "invoices" && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Invoices</CardTitle>
                      <CardDescription>All invoices for this client</CardDescription>
                    </div>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {invoices.length === 0 ? (
                      <div className="py-10 text-center text-sm text-muted-foreground">
                        No invoices yet.
                      </div>
                    ) : (
                      invoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="flex items-center justify-between rounded-md border px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-semibold">{invoice.invoice_number}</p>
                            <p className="text-xs text-muted-foreground">
                              {invoice.date ? formatDate(invoice.date) : "No date"} • Due{" "}
                              {invoice.due_date ? formatDate(invoice.due_date) : "n/a"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">
                              {formatCurrency(invoice.total ?? 0, invoice.currency ?? "USD")}
                            </p>
                            <p className="text-xs capitalize text-muted-foreground">
                              {invoice.status}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === "files" && <ClientFiles clientId={clientId} />}

              {activeTab === "notes" && <ClientNotes clientId={clientId} initialNotes={client?.notes ?? null} />}
            </div>
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}

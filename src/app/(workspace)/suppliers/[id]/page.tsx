"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Briefcase,

  StickyNote,
  Trash2,
  Loader2,
} from "lucide-react";

import { ServicesTab } from "@/components/suppliers/tabs/services-tab";
import { PreferredClientsTab } from "@/components/suppliers/tabs/preferred-clients-tab";
import { ActivitiesTab } from "@/components/suppliers/tabs/activities-tab";
import { PurchaseOrdersTab } from "@/components/suppliers/tabs/purchase-orders-tab";
import { ExpensesTab } from "@/components/suppliers/tabs/expenses-tab";
import { JobsTab } from "@/components/suppliers/tabs/jobs-tab";
import { SupplierFiles } from "@/components/suppliers/supplier-files";
import { SupplierStats } from "@/components/suppliers/supplier-stats";
import { EditSupplierDialog } from "@/components/suppliers/edit-supplier-dialog";


import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type SupplierRecord = Database["public"]["Tables"]["suppliers"]["Row"];

const fetchSupplier = async (id: string): Promise<SupplierRecord> => {
  const response = await fetch(`/api/suppliers?id=${id}`);
  if (!response.ok) {
    throw new Error("Failed to load supplier");
  }
  const data = await response.json();
  return data.suppliers[0];
};

const fetchSupplierJobs = async (id: string) => {
  const response = await fetch(`/api/outsourcing?supplier_id=${id}`);
  if (!response.ok) {
    throw new Error("Failed to load outsourcing data");
  }
  return response.json();
};

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const supplierId = params.id as string;

  const {
    data: supplier,
    isLoading: isSupplierLoading,
    isError: isSupplierError,
  } = useQuery({
    queryKey: ["suppliers", supplierId],
    queryFn: () => fetchSupplier(supplierId),
  });

  const {
    data: jobsData,
  } = useQuery({
    queryKey: ["supplier-jobs", supplierId],
    queryFn: () => fetchSupplierJobs(supplierId),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/suppliers?id=${supplierId}`, {
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
      router.push("/suppliers");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete supplier",
      });
    },
  });

  if (isSupplierLoading) {
    return (
      <WorkspaceShell
        title="Loading..."
        description="Loading supplier details"
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </WorkspaceShell>
    );
  }

  if (isSupplierError || !supplier) {
    return (
      <WorkspaceShell title="Error" description="Supplier not found">
        <Alert variant="destructive">
          <AlertDescription>
            The supplier you&apos;re looking for doesn&apos;t exist or you don&apos;t have
            access to it.
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => router.push("/suppliers")}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to suppliers
        </Button>
      </WorkspaceShell>
    );
  }

  const jobs = jobsData?.outsourcing || [];
  const totalJobs = jobs.length;
  const totalPayable = jobs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((j: any) => !j.paid)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .reduce((sum: number, j: any) => sum + (j.supplier_total || 0), 0);

  return (
    <WorkspaceShell
      title={supplier.name}
      description="Supplier details and outsourcing history"
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/suppliers")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <EditSupplierDialog supplier={supplier} />
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (
                confirm(
                  "Are you sure you want to delete this supplier? This action cannot be undone."
                )
              ) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      }
    >
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total jobs</CardDescription>
            <CardTitle className="text-3xl">{totalJobs}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Outstanding payables</CardDescription>
            <CardTitle className="text-3xl">
              {formatCurrency(totalPayable, supplier.default_currency || "USD")}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Default rate (per word)</CardDescription>
            <CardTitle className="text-3xl">
              {supplier.default_rate_word
                ? formatCurrency(
                  supplier.default_rate_word,
                  supplier.default_currency || "USD"
                )
                : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="jobs">Jobs ({totalJobs})</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="crm">CRM</TabsTrigger>
          <TabsTrigger value="purchase-orders">POs</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <CardTitle>Supplier Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Supplier Name
                  </p>
                  <p className="text-base">{supplier.name}</p>
                </div>

                {supplier.contact_name && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Contact Person
                    </p>
                    <p className="text-base">{supplier.contact_name}</p>
                  </div>
                )}

                {supplier.email && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      <Mail className="inline h-4 w-4 mr-1" />
                      Email
                    </p>
                    <p className="text-base">
                      <a
                        href={`mailto:${supplier.email}`}
                        className="text-primary hover:underline"
                      >
                        {supplier.email}
                      </a>
                    </p>
                  </div>
                )}

                {supplier.phone && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      <Phone className="inline h-4 w-4 mr-1" />
                      Phone
                    </p>
                    <p className="text-base">{supplier.phone}</p>
                  </div>
                )}

                {supplier.country && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      Country
                    </p>
                    <p className="text-base">{supplier.country}</p>
                  </div>
                )}

                {supplier.payment_method && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Payment Method
                    </p>
                    <Badge variant="outline">{supplier.payment_method}</Badge>
                  </div>
                )}
              </div>

              {supplier.address && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Address
                  </p>
                  <p className="text-base whitespace-pre-wrap">{supplier.address}</p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {supplier.vat_number && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      VAT Number
                    </p>
                    <p className="text-base">{supplier.vat_number}</p>
                  </div>
                )}
                {supplier.timezone && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Timezone
                    </p>
                    <p className="text-base">{supplier.timezone}</p>
                  </div>
                )}
              </div>

              {supplier.specialization &&
                Array.isArray(supplier.specialization) &&
                supplier.specialization.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Specializations
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {supplier.specialization.map((spec, idx) => (
                        <Badge key={idx} variant="secondary">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>



          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                <CardTitle>Business Settings</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Minimum Fee
                  </p>
                  <p className="text-base">
                    {supplier.minimum_fee
                      ? formatCurrency(
                        supplier.minimum_fee,
                        supplier.default_currency || "USD"
                      )
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Payment Terms
                  </p>
                  <p className="text-base">{supplier.payment_terms || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    CAT Tool
                  </p>
                  <p className="text-base">{supplier.cat_tool || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                <CardTitle>Default Rates</CardTitle>
              </div>
              <CardDescription>
                Default pricing for outsourcing calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Per Word
                  </p>
                  <p className="text-2xl font-semibold">
                    {supplier.default_rate_word
                      ? formatCurrency(
                        supplier.default_rate_word,
                        supplier.default_currency || "USD"
                      )
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Per Hour
                  </p>
                  <p className="text-2xl font-semibold">
                    {supplier.default_rate_hour
                      ? formatCurrency(
                        supplier.default_rate_hour,
                        supplier.default_currency || "USD"
                      )
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Per Project
                  </p>
                  <p className="text-2xl font-semibold">
                    {supplier.default_rate_project
                      ? formatCurrency(
                        supplier.default_rate_project,
                        supplier.default_currency || "USD"
                      )
                      : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {supplier.notes && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <StickyNote className="h-5 w-5" />
                  <CardTitle>Internal Notes</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{supplier.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <SupplierStats supplierId={supplier.id} currency={supplier.default_currency || "USD"} />
        </TabsContent>

        <TabsContent value="services" className="mt-6">
          <ServicesTab supplierId={supplier.id} />
        </TabsContent>

        <TabsContent value="clients" className="mt-6">
          <PreferredClientsTab supplierId={supplier.id} />
        </TabsContent>

        <TabsContent value="crm" className="mt-6">
          <ActivitiesTab supplierId={supplier.id} />
        </TabsContent>

        <TabsContent value="purchase-orders" className="mt-6">
          <PurchaseOrdersTab supplierId={supplier.id} />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <ExpensesTab supplierId={supplier.id} />
        </TabsContent>

        <TabsContent value="files" className="space-y-6">
          <SupplierFiles supplierId={supplier.id} />
        </TabsContent>

        <TabsContent value="jobs" className="mt-6">
          <JobsTab supplierId={supplier.id} />
        </TabsContent>
      </Tabs>
    </WorkspaceShell>
  );
}



"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  Briefcase,
  Calendar,
  DollarSign,
  FileText,
  Package,
  Building2,
  Edit,
  Loader2,
  Clock,
  AlertCircle,
  Timer,
  Users,
  Link as LinkIcon,
  StickyNote,
  BarChart3
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { StatusBadge } from "@/components/jobs/status-badge";
import { JobFormSheet } from "@/components/jobs/job-form-sheet";
import { FileUpload, type JobFile } from "@/components/files/file-upload";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

// New Components
import { TimeTrackingTab } from "@/components/jobs/tabs/time-tracking-tab";
import { OutsourcingTab } from "@/components/jobs/tabs/outsourcing-tab";
import { FinancialTab } from "@/components/jobs/tabs/financial-tab";
import { LinkedEntitiesTab } from "@/components/jobs/tabs/linked-entities-tab";
import { NotesTab } from "@/components/jobs/tabs/notes-tab";
import { JobSidebar } from "@/components/jobs/job-sidebar";

type JobRecord = Database["public"]["Tables"]["jobs"]["Row"] & {
  clients: { name: string; email: string | null } | null;
};

const fetchJob = async (id: string): Promise<JobRecord> => {
  const response = await fetch(`/api/jobs?id=${id}`);
  if (!response.ok) {
    throw new Error("Failed to load job");
  }
  const data = await response.json();
  return data.jobs[0];
};

const fetchJobFiles = async (jobId: string): Promise<JobFile[]> => {
  const response = await fetch(`/api/files?job_id=${jobId}`);
  if (!response.ok) {
    throw new Error("Failed to load files");
  }
  const data = await response.json();
  return data.files;
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const jobId = params.id as string;

  const {
    data: job,
    isLoading: isJobLoading,
    isError: isJobError,
  } = useQuery({
    queryKey: ["jobs", jobId],
    queryFn: () => fetchJob(jobId),
  });

  const {
    data: jobFiles = [],
    refetch: refetchFiles,
  } = useQuery({
    queryKey: ["job-files", jobId],
    queryFn: () => fetchJobFiles(jobId),
    enabled: !!jobId,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
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
      router.push("/jobs");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete job",
      });
    },
  });

  if (isJobLoading) {
    return (
      <WorkspaceShell title="Loading..." description="Loading job details">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </WorkspaceShell>
    );
  }

  if (isJobError || !job) {
    return (
      <WorkspaceShell title="Error" description="Job not found">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The job you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => router.push("/jobs")}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to jobs
        </Button>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell
      title={
        <div className="space-y-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/jobs">Jobs</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{job.job_code || job.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{job.title}</h1>
            <StatusBadge status={job.status} />
          </div>
        </div>
      }
      description={`Job ${job.job_code || "—"} • ${job.clients?.name || "Unknown client"}`}
      actions={
        <div className="flex gap-2">
          <JobFormSheet
            clients={[{
              id: job.client_id,
              name: job.clients?.name || "Current Client",
              default_currency: job.currency
            }]}
            job={{
              ...job,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              status: job.status as any,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              pricing_type: job.pricing_type as any,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              currency: job.currency as any,
              quantity: job.quantity ?? 0,
              rate: job.rate ?? 0,
              purchase_order_ref: job.purchase_order_ref ?? undefined,
              due_date: job.due_date ?? undefined,
              start_date: job.start_date ?? undefined,
              notes: job.notes ?? undefined,
            }}
            trigger={
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            }
          />
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-9 space-y-6">

          {/* Tabbed Content */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="w-full justify-start h-auto flex-wrap gap-2 bg-transparent p-0">
              <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border">
                Overview
              </TabsTrigger>
              <TabsTrigger value="pricing" className="data-[state=active]:bg-background data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border">
                <DollarSign className="h-4 w-4 mr-2" />
                Pricing
              </TabsTrigger>
              <TabsTrigger value="financial" className="data-[state=active]:bg-background data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border">
                <BarChart3 className="h-4 w-4 mr-2" />
                Financial
              </TabsTrigger>
              <TabsTrigger value="time" className="data-[state=active]:bg-background data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border">
                <Timer className="h-4 w-4 mr-2" />
                Time Tracking
              </TabsTrigger>
              <TabsTrigger value="outsourcing" className="data-[state=active]:bg-background data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border">
                <Users className="h-4 w-4 mr-2" />
                Outsourcing
              </TabsTrigger>
              <TabsTrigger value="links" className="data-[state=active]:bg-background data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border">
                <LinkIcon className="h-4 w-4 mr-2" />
                Linked
              </TabsTrigger>
              <TabsTrigger value="files" className="data-[state=active]:bg-background data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border">
                <FileText className="h-4 w-4 mr-2" />
                Files
              </TabsTrigger>
              <TabsTrigger value="notes" className="data-[state=active]:bg-background data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border">
                <StickyNote className="h-4 w-4 mr-2" />
                Notes
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    <CardTitle>Job Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Job Code</p>
                      <p className="text-base font-mono">{job.job_code || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Title</p>
                      <p className="text-base">{job.title}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        <Building2 className="inline h-4 w-4 mr-1" />
                        Client
                      </p>
                      <p className="text-base">
                        {job.clients?.name || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        <Package className="inline h-4 w-4 mr-1" />
                        Service Type
                      </p>
                      <p className="text-base">{job.service_type || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        Created
                      </p>
                      <p className="text-base">
                        {job.created_at ? formatDate(job.created_at) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        <Clock className="inline h-4 w-4 mr-1" />
                        Due Date
                      </p>
                      <p className="text-base">
                        {job.due_date ? formatDate(job.due_date) : "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats Row */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Amount</CardDescription>
                    <CardTitle className="text-2xl">
                      {formatCurrency(job.total_amount || 0, job.currency)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Quantity</CardDescription>
                    <CardTitle className="text-2xl">
                      {job.quantity?.toLocaleString() || "—"} <span className="text-sm font-normal text-muted-foreground">{job.unit || "units"}</span>
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Status</CardDescription>
                    <div className="pt-1">
                      <StatusBadge status={job.status} />
                    </div>
                  </CardHeader>
                </Card>
              </div>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    <CardTitle>Pricing Breakdown</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Pricing Type</p>
                        <Badge variant="outline" className="mt-1">
                          {job.pricing_type === "per_word"
                            ? "Per Word"
                            : job.pricing_type === "per_hour"
                              ? "Per Hour"
                              : "Flat Fee"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Quantity</p>
                        <p className="text-lg font-semibold">
                          {job.quantity?.toLocaleString() || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Rate</p>
                        <p className="text-lg font-semibold">
                          {job.rate ? formatCurrency(job.rate, job.currency) : "—"}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center">
                      <p className="text-base font-medium">Total Amount</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(job.total_amount || 0, job.currency)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial">
              <FinancialTab job={job} />
            </TabsContent>

            {/* Time Tracking Tab */}
            <TabsContent value="time">
              <TimeTrackingTab jobId={job.id} currency={job.currency} />
            </TabsContent>

            {/* Outsourcing Tab */}
            <TabsContent value="outsourcing">
              <OutsourcingTab jobId={job.id} job={job} />
            </TabsContent>

            {/* Linked Entities Tab */}
            <TabsContent value="links">
              <LinkedEntitiesTab jobId={job.id} />
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    <CardTitle>Files & Documents</CardTitle>
                  </div>
                  <CardDescription>
                    Upload source files, deliverables, and related documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FileUpload
                    jobId={jobId}
                    files={jobFiles}
                    onUploadComplete={() => refetchFiles()}
                    onDeleteComplete={() => refetchFiles()}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes">
              <NotesTab jobId={job.id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-3">
          <JobSidebar
            job={job}
            onDelete={() => {
              if (confirm(`Are you sure you want to delete "${job.title}"? This action cannot be undone.`)) {
                deleteMutation.mutate();
              }
            }}
          />
        </div>
      </div>
    </WorkspaceShell>
  );
}

function ArrowLeft({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  )
}

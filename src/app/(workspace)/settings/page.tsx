"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";

import { WorkspaceShell } from "@/components/layout/workspace-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { userSettingsFormSchema, type UserSettingsFormData } from "@/lib/validators/settings";
import { CURRENCIES } from "@/utils/currencies";
import type { Database } from "@/lib/supabase/types";

type UserRecord = Database["public"]["Tables"]["users"]["Row"];

const fetchUserSettings = async (): Promise<UserRecord> => {
  const response = await fetch("/api/settings");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error ?? "Unable to load settings");
  }
  const payload = await response.json();
  return payload.user as UserRecord;
};

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["user-settings"],
    queryFn: fetchUserSettings,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<UserSettingsFormData>({
    resolver: zodResolver(userSettingsFormSchema),
    defaultValues: {
      currency_default: "USD",
    },
  });

  const selectedCurrency = watch("currency_default");

  // Populate form when user data loads
  useEffect(() => {
    if (user) {
      reset({
        name: user.name ?? "",
        company_name: user.company_name ?? "",
        address: user.address ?? "",
        currency_default: user.currency_default ?? "USD",
        logo_url: user.logo_url ?? "",
      });
    }
  }, [user, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: UserSettingsFormData) => {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error ?? "Failed to update settings");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  if (isError) {
    return (
      <WorkspaceShell
        title="Settings"
        description="Company profile, branding, defaults, and workflow automations."
      >
        <Alert variant="destructive">
          <AlertTitle>Error loading settings</AlertTitle>
          <AlertDescription>{(error as Error)?.message}</AlertDescription>
        </Alert>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell
      title="Settings"
      description="Company profile, branding, defaults, and workflow automations."
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <form onSubmit={handleSubmit((data) => updateMutation.mutateAsync(data))}>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Business profile</CardTitle>
                <CardDescription>
                  Your company information and default settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your name</Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="John Doe"
                      disabled={updateMutation.isPending}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company name</Label>
                    <Input
                      id="company_name"
                      {...register("company_name")}
                      placeholder="PluriDesk Studio"
                      disabled={updateMutation.isPending}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Business address</Label>
                  <Textarea
                    id="address"
                    {...register("address")}
                    rows={3}
                    placeholder="123 Main St, Suite 100, City, State 12345"
                    disabled={updateMutation.isPending}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="currency_default">Default currency</Label>
                    <Select
                      value={selectedCurrency}
                      onValueChange={(value) =>
                        setValue(
                          "currency_default",
                          value as UserSettingsFormData["currency_default"],
                          { shouldDirty: true }
                        )
                      }
                      disabled={updateMutation.isPending}
                    >
                      <SelectTrigger id="currency_default">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.code} - {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Used as default for new jobs and quotes
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logo_url">Logo URL (optional)</Label>
                    <Input
                      id="logo_url"
                      {...register("logo_url")}
                      placeholder="https://..."
                      disabled={updateMutation.isPending}
                    />
                    <p className="text-xs text-muted-foreground">
                      Used on invoices and quotes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email & Contact</CardTitle>
                <CardDescription>Your account email (read-only)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email ?? ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Contact support to change your email address
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification preferences</CardTitle>
                <CardDescription>Configure alerts and reminders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Email notifications for important events:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Jobs ready to invoice
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                      Quotes expiring within 48 hours
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                      Supplier payments due this week
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      Overdue invoices
                    </li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-4">
                    Advanced notification settings coming soon
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
                disabled={!isDirty || updateMutation.isPending}
              >
                Reset
              </Button>
              <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="mr-2 h-4 w-4" />
                Save changes
              </Button>
            </div>
          </div>
        </form>
      )}
    </WorkspaceShell>
  );
}


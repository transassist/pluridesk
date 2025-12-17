"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import type { Database } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type NotificationRecord = Database["public"]["Tables"]["notifications"]["Row"];

const fetchNotifications = async (): Promise<NotificationRecord[]> => {
  const response = await fetch("/api/notifications");
  if (!response.ok) {
    throw new Error("Failed to load notifications");
  }
  const data = await response.json();
  return data.notifications;
};

const typeVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  jobs: "default",
  invoices: "secondary",
  deadlines: "destructive",
  outsourcing: "outline",
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: notifications = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read: true }),
      });
      if (!response.ok) {
        throw new Error("Failed to mark as read");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({
        title: "Success",
        description: "Notification marked as read",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark notification as read",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/notifications?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete notification");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({
        title: "Success",
        description: "Notification deleted",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete notification",
      });
    },
  });

  if (isLoading) {
    return (
      <WorkspaceShell
        title="Notifications"
        description="Central feed for invoices, jobs, outsourcing, and deadlines."
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </WorkspaceShell>
    );
  }

  if (isError) {
    return (
      <WorkspaceShell
        title="Notifications"
        description="Central feed for invoices, jobs, outsourcing, and deadlines."
      >
        <Alert variant="destructive">
          <AlertTitle>Error loading notifications</AlertTitle>
          <AlertDescription>{(error as Error)?.message}</AlertDescription>
        </Alert>
      </WorkspaceShell>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <WorkspaceShell
      title="Notifications"
      description="Central feed for invoices, jobs, outsourcing, and deadlines."
    >
      <div className="space-y-4">
        {unreadCount > 0 && (
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
            <p className="text-sm font-medium">
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-sm text-muted-foreground">
                No notifications yet. You&apos;re all caught up!
              </p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                "transition-opacity",
                notification.read && "opacity-60"
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">
                      {notification.title}
                    </CardTitle>
                    {!notification.read && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={typeVariants[notification.type] || "default"}
                    className="uppercase"
                  >
                    {notification.type}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(notification.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <p>{notification.message}</p>
                {!notification.read && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAsReadMutation.mutate(notification.id)}
                    disabled={markAsReadMutation.isPending}
                  >
                    {markAsReadMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Mark as read"
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </WorkspaceShell>
  );
}


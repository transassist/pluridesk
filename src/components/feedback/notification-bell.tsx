"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/lib/supabase/types";

type NotificationRecord = Database["public"]["Tables"]["notifications"]["Row"];

const fetchNotifications = async (): Promise<NotificationRecord[]> => {
  const response = await fetch("/api/notifications");
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  return data.notifications || [];
};

const typeMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> =
  {
    jobs: { label: "Jobs", variant: "default" },
    invoices: { label: "Invoices", variant: "secondary" },
    deadlines: { label: "Deadlines", variant: "destructive" },
    outsourcing: { label: "Outsourcing", variant: "destructive" },
  };

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMs / 3600000);
  const diffInDays = Math.floor(diffInMs / 86400000);

  if (diffInMins < 1) return "Just now";
  if (diffInMins < 60) return `${diffInMins} min${diffInMins !== 1 ? "s" : ""} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
};

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 60000, // Refetch every minute
  });

  const unreadNotifications = notifications.filter((n) => !n.read);
  const recentNotifications = notifications.slice(0, 5);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadNotifications.length > 0 && (
            <span className="absolute right-1 top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unreadNotifications.length}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b px-4 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          <p className="text-xs text-muted-foreground">
            {unreadNotifications.length > 0
              ? `${unreadNotifications.length} unread`
              : "You're all caught up!"}
          </p>
        </div>
        {recentNotifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <ul className="divide-y text-sm">
              {recentNotifications.map((notification) => {
                const meta = typeMap[notification.type] ?? typeMap.jobs;
                return (
                  <li
                    key={notification.id}
                    className="space-y-1 px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(notification.created_at)}
                      </span>
                    </div>
                    <p className="font-medium">{notification.title}</p>
                    {!notification.read && (
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
        <div className="border-t px-4 py-2 text-xs text-right">
          <Link
            href="/notifications"
            className="text-primary hover:underline font-semibold"
            onClick={() => setOpen(false)}
          >
            View all
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
};

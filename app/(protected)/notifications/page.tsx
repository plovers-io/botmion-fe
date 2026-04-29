"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { NotificationService } from "@/lib/services/notification-service";
import { useNotificationStore } from "@/lib/store/notification-store";
import { NotificationItem } from "@/lib/types/notification";
import { goeyToast as toast } from "goey-toast";
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_LABELS: Record<NotificationItem["status"], string> = {
  unread: "Unread",
  read: "Read",
  archived: "Archived",
};

const PRIORITY_STYLES: Record<NotificationItem["priority"], string> = {
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-sky-100 text-sky-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-rose-100 text-rose-700",
};

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
  { value: "archived", label: "Archived" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["value"];

function formatDateTime(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const setNotifications = useNotificationStore((state) => state.setNotifications);
  const upsertNotification = useNotificationStore((state) => state.upsertNotification);
  const markAllReadInStore = useNotificationStore((state) => state.markAllRead);

  const filteredNotifications = useMemo(() => {
    if (statusFilter === "all") return notifications;
    return notifications.filter((item) => item.status === statusFilter);
  }, [notifications, statusFilter]);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await NotificationService.listNotifications();
      setNotifications(data);
    } catch {
      toast.error("Load Failed", { description: "Could not load notifications" });
    }
  }, [setNotifications]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      setLoading(true);
      await loadNotifications();
      if (isMounted) {
        setLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [loadNotifications]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await NotificationService.markAllRead();
      markAllReadInStore();
      toast.success("All Read", { description: "All notifications marked as read" });
    } catch {
      toast.error("Update Failed", { description: "Could not mark all as read" });
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkRead = async (notification: NotificationItem) => {
    if (notification.status !== "unread") return;
    try {
      const updated = await NotificationService.updateStatus(notification.id, "read");
      upsertNotification(updated);
    } catch {
      toast.error("Update Failed", { description: "Could not mark notification as read" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <Loader2 className="animate-spin text-emerald-600" size={28} />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            Loading notifications...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Bell className="text-white" size={20} />
            </div>
            Notifications
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">
            Track updates across your workspace.
            {unreadCount > 0 && (
              <span className="ml-2 text-emerald-600 font-medium">
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-9"
          >
            {refreshing ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCcw size={14} />
                Refresh
              </>
            )}
          </Button>
          <Button
            size="sm"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || markingAll}
            className="h-9 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          >
            {markingAll ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                Marking...
              </>
            ) : (
              <>
                <CheckCheck size={14} />
                Mark all read
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((filter) => (
          <Button
            key={filter.value}
            size="sm"
            variant={statusFilter === filter.value ? "default" : "outline"}
            onClick={() => setStatusFilter(filter.value)}
            className="h-8"
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {filteredNotifications.length === 0 ? (
        <Card className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border-gray-100 dark:border-gray-700/50 rounded-2xl shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/15 dark:to-teal-500/15 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <Bell size={36} className="text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              No notifications
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
              You will see new updates here as they arrive.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => {
            const createdAt = formatDateTime(notification.created_at);
            const priorityClass = PRIORITY_STYLES[notification.priority];
            const statusLabel = STATUS_LABELS[notification.status];

            const viewId = notification.id;
            const canView = Number.isFinite(Number(viewId));

            return (
              <Card
                key={notification.id}
                className={`border-l-4 ${
                  notification.status === "unread"
                    ? "border-l-emerald-500"
                    : "border-l-gray-200 dark:border-l-gray-700"
                } bg-white/90 dark:bg-gray-900/70 border-gray-100 dark:border-gray-700/50 shadow-sm transition-all`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={priorityClass}>{notification.priority}</Badge>
                        <Badge variant="outline">{statusLabel}</Badge>
                        {notification.channel && (
                          <Badge variant="secondary">{notification.channel}</Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {notification.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {notification.body}
                      </p>
                      {createdAt && (
                        <p className="text-xs text-gray-400">
                          {createdAt}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      {notification.action_url && (
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="h-8"
                        >
                          <a
                            href={notification.action_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink size={14} />
                            Open
                          </a>
                        </Button>
                      )}
                      {canView && (
                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                          className="h-8 border border-emerald-200/70 dark:border-emerald-500/30"
                        >
                          <Link href={`/notifications/${viewId}`}>View</Link>
                        </Button>
                      )}
                      {notification.status === "unread" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 border border-emerald-200/70 dark:border-emerald-500/30"
                          onClick={() => handleMarkRead(notification)}
                        >
                          <Check size={14} />
                          Mark read
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

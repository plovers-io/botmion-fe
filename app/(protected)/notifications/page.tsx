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
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { WorkspaceMemberService } from "@/lib/services/workspace-member-service";
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
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

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
      const data = await NotificationService.listNotifications({
        page,
        page_size: pageSize,
      });
      setNotifications(data.results);
      setTotal(data.count);
      setTotalPages(Math.ceil(data.count / pageSize) || 1);
    } catch {
      toast.error("Load Failed", { description: "Could not load notifications" });
    }
  }, [setNotifications, page, pageSize]);

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

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

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

  const handleAcceptInvite = async (token?: string) => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await WorkspaceMemberService.acceptInvitation(token);
      toast.success("Invitation accepted", { description: res.detail || "" });
      await loadNotifications();
    } catch (e) {
      toast.error("Accept failed", { description: e instanceof Error ? e.message : "" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineInvite = async (token?: string) => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await WorkspaceMemberService.declineInvitation(token);
      toast.success("Invitation declined", { description: res.detail || "" });
      await loadNotifications();
    } catch (e) {
      toast.error("Decline failed", { description: e instanceof Error ? e.message : "" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-linear-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
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
            <div className="w-10 h-10 bg-linear-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
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
            className="h-9 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
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
            <div className="w-20 h-20 bg-linear-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/15 dark:to-teal-500/15 rounded-3xl flex items-center justify-center mx-auto mb-5">
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
        <>
        <div className="space-y-4">
          {filteredNotifications.map((notification) => {
            const createdAt = formatDateTime(notification.created_at);
            const priorityClass = PRIORITY_STYLES[notification.priority];
            const statusLabel = STATUS_LABELS[notification.status];
            const metadata = notification.metadata as Record<string, unknown> | undefined;
            const invitationStatus = typeof metadata?.invitation_status === "string" ? metadata.invitation_status : "pending";
            const isWorkspaceInvitation = metadata?.event === "workspace_invitation";
            const canOpenInvitation = isWorkspaceInvitation && invitationStatus === "pending";

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
                      {canView && canOpenInvitation && (
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="h-8"
                        >
                          <Link href={`/notifications/${viewId}?notif_id=${notification.id}`}>
                            <ExternalLink size={14} />
                            Open
                          </Link>
                        </Button>
                      )}
                      {/* Workspace invitation quick actions */}
                      {isWorkspaceInvitation && invitationStatus === "pending" && (
                        <>
                          <Button size="sm" variant="default" className="h-8" onClick={() => handleAcceptInvite((metadata?.invitation_token as string) || undefined)}>
                            Accept
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8" onClick={() => handleDeclineInvite((metadata?.invitation_token as string) || undefined)}>
                            Decline
                          </Button>
                        </>
                      )}
                      {canView && (
                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                          className="h-8 border border-emerald-200/70 dark:border-emerald-500/30"
                        >
                          <Link href={`/notifications/${viewId}?notif_id=${notification.id}`}>View</Link>
                        </Button>
                      )}
                      {notification.status === "unread" && !isWorkspaceInvitation && (
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700/50">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {total === 0 ? 0 : (page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="h-8"
              >
                <ChevronLeft size={14} />
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-300 min-w-[3rem] text-center">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="h-8"
              >
                Next
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  );
}

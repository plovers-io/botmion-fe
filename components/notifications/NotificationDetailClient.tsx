"use client";

import React, { useEffect, useMemo, useState } from "react";
import { NotificationService } from "@/lib/services/notification-service";
import { NotificationItem } from "@/lib/types/notification";
import { useNotificationStore } from "@/lib/store/notification-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { goeyToast as toast } from "goey-toast";
import { Check, Trash, Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { WorkspaceMemberService } from "@/lib/services/workspace-member-service";
import Link from "next/link";

interface Props {
  id?: string | number;
  notifId?: string | number;
}

function formatDateTime(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function NotificationDetailClient({ id, notifId }: Props) {
  const [notification, setNotification] = useState<NotificationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [invalidId, setInvalidId] = useState(false);
  const upsertNotification = useNotificationStore((s) => s.upsertNotification);
  const setNotifications = useNotificationStore((s) => s.setNotifications);

  const metadata = notification?.metadata as Record<string, unknown> | undefined;
  const invitationStatus = typeof metadata?.invitation_status === "string" ? metadata.invitation_status : "pending";
  const isWorkspaceInvitation = metadata?.event === "workspace_invitation";
  const canActOnInvitation = isWorkspaceInvitation && invitationStatus === "pending";
  const invitationToken = typeof metadata?.invitation_token === "string" ? metadata.invitation_token : undefined;

  const normalizedId = useMemo(() => {
    const candidate = notifId ?? id;
    if (candidate === undefined || candidate === null) {
      return null;
    }
    if (typeof candidate === "number") {
      return Number.isFinite(candidate) ? candidate : null;
    }
    if (typeof candidate !== "string") {
      return null;
    }
    const trimmed = candidate.trim();
    if (!trimmed || trimmed === "undefined" || trimmed === "null") {
      return null;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : trimmed;
  }, [id, notifId]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      if (normalizedId === null) {
        setInvalidId(true);
        setNotification(null);
        setLoading(false);
        return;
      }
      setInvalidId(false);
      try {
        const data = await NotificationService.getNotification(normalizedId);
        if (mounted) setNotification(data);
        upsertNotification(data);
      } catch (err) {
        toast.error("Load Failed", { description: "Could not load notification" });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [normalizedId, upsertNotification]);

  const handleMarkRead = async () => {
    if (!notification || notification.status !== "unread") return;
    try {
      const updated = await NotificationService.updateStatus(notification.id, "read");
      setNotification(updated);
      upsertNotification(updated);
      toast.success("Marked read");
    } catch {
      toast.error("Update failed", { description: "Could not mark read" });
    }
  };

  const handleDelete = async () => {
    if (!notification) return;
    setDeleting(true);
    try {
      await NotificationService.deleteNotification(notification.id);
      const result = await NotificationService.listNotifications();
      setNotifications(result.results);
      toast.success("Deleted");
    } catch {
      toast.error("Delete failed", { description: "Could not delete notification" });
    } finally {
      setDeleting(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!invitationToken) return;
    setActionLoading(true);
    try {
      const res = await WorkspaceMemberService.acceptInvitation(invitationToken);
      toast.success("Invitation accepted", { description: res.detail || "" });
      // Reload notification to reflect status change
      if (normalizedId !== null) {
        const updated = await NotificationService.getNotification(normalizedId);
        setNotification(updated);
        upsertNotification(updated);
      }
    } catch (e) {
      toast.error("Accept failed", { description: e instanceof Error ? e.message : "" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineInvite = async () => {
    if (!invitationToken) return;
    setActionLoading(true);
    try {
      const res = await WorkspaceMemberService.declineInvitation(invitationToken);
      toast.success("Invitation declined", { description: res.detail || "" });
      if (normalizedId !== null) {
        const updated = await NotificationService.getNotification(normalizedId);
        setNotification(updated);
        upsertNotification(updated);
      }
    } catch (e) {
      toast.error("Decline failed", { description: e instanceof Error ? e.message : "" });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <Loader2 className="animate-spin text-emerald-600" size={28} />
        </div>
      </div>
    );
  }

  if (invalidId) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Invalid notification id.</p>
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Notification not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card>
        <CardContent className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{notification.title}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {formatDateTime(notification.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {notification.status === "unread" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMarkRead}
                  disabled={actionLoading}
                >
                  <Check size={14} />
                  Mark read
                </Button>
              )}

              <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleting || actionLoading}>
                {deleting ? "Deleting..." : (
                  <>
                    <Trash size={14} /> Delete
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="prose max-w-full text-gray-700 dark:text-gray-300">
            <p>{notification.body}</p>
          </div>

          {/* Workspace Invitation Actions */}
          {isWorkspaceInvitation && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60 p-4">
              {canActOnInvitation ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    This is a pending workspace invitation. You can accept or decline it from here.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      size="sm"
                      onClick={handleAcceptInvite}
                      disabled={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {actionLoading ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />}
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDeclineInvite}
                      disabled={actionLoading}
                    >
                      {actionLoading ? <Loader2 className="animate-spin" size={14} /> : <XCircle size={14} />}
                      Decline
                    </Button>
                    <div className="mt-3">
                      <Link
                        href="/notifications"
                        className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
                      >
                        <ExternalLink size={14} />
                        Go to notifications
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  This invitation is already <strong className="capitalize">{invitationStatus}</strong>.
                  {invitationStatus === "accepted" && (
                    <span> You can access the workspace from your dashboard.</span>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

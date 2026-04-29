"use client";

import React, { useEffect, useMemo, useState } from "react";
import { NotificationService } from "@/lib/services/notification-service";
import { NotificationItem } from "@/lib/types/notification";
import { useNotificationStore } from "@/lib/store/notification-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { goeyToast as toast } from "goey-toast";
import { Check, Trash, Loader2 } from "lucide-react";

interface Props {
  id?: string | number;
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

export default function NotificationDetailClient({ id }: Props) {
  const [notification, setNotification] = useState<NotificationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [invalidId, setInvalidId] = useState(false);
  const upsertNotification = useNotificationStore((s) => s.upsertNotification);
  const setNotifications = useNotificationStore((s) => s.setNotifications);

  const normalizedId = useMemo(() => {
    if (id === undefined || id === null) {
      return null;
    }
    if (typeof id === "number") {
      return Number.isFinite(id) ? id : null;
    }
    if (typeof id !== "string") {
      return null;
    }
    const trimmed = id.trim();
    if (!trimmed || trimmed === "undefined" || trimmed === "null") {
      return null;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : trimmed;
  }, [id]);

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
        // ensure store has it
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
      // remove from store by reloading list
      const list = await NotificationService.listNotifications();
      setNotifications(list);
      toast.success("Deleted");
      // navigate back if caller wants — keep simple: reload notifications list in-store
    } catch {
      toast.error("Delete failed", { description: "Could not delete notification" });
    } finally {
      setDeleting(false);
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
    <div className="p-6">
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{notification.title}</h2>
              <p className="text-sm text-gray-500">
                {formatDateTime(notification.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {notification.status === "unread" && (
                <Button
                  size="sm"
                  onClick={handleMarkRead}
                  className="border border-emerald-200/70 dark:border-emerald-500/30"
                >
                  <Check size={14} />
                  Mark read
                </Button>
              )}

              <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : (
                  <>
                    <Trash size={14} /> Delete
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="prose max-w-full">
            <p>{notification.body}</p>
          </div>

          {notification.action_url && (
            <div>
              <a href={notification.action_url} target="_blank" rel="noreferrer" className="text-emerald-600 underline">
                Open action
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth-store-v2";
import { useNotificationStore } from "@/lib/store/notification-store";
import { NotificationService } from "@/lib/services/notification-service";

const POLL_INTERVAL_MS = 60000;

export function useNotificationFeed() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setNotifications = useNotificationStore((state) => state.setNotifications);
  const upsertNotification = useNotificationStore(
    (state) => state.upsertNotification
  );
  const reset = useNotificationStore((state) => state.reset);

  useEffect(() => {
    if (!isAuthenticated) {
      reset();
      return;
    }

    let cancelled = false;

    const loadNotifications = async () => {
      try {
        const notifications = await NotificationService.listNotifications();
        if (!cancelled) {
          setNotifications(notifications);
        }
      } catch {
        // Fail silently; polling will retry.
      }
    };

    loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, reset, setNotifications]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const streamUrl = NotificationService.getStreamUrl();
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(streamUrl, { withCredentials: true });
    } catch {
      eventSource = null;
    }

    if (!eventSource) {
      return undefined;
    }

    eventSource.onmessage = (event) => {
      if (!event.data) return;

      try {
        const payload = JSON.parse(event.data);
        const normalized = NotificationService.normalizeSsePayload(payload);
        if (normalized) {
          upsertNotification(normalized);
        }
      } catch {
        // Ignore malformed SSE payloads.
      }
    };

    eventSource.onerror = () => {
      eventSource?.close();
    };

    return () => {
      eventSource?.close();
    };
  }, [isAuthenticated, upsertNotification]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const intervalId = window.setInterval(async () => {
      try {
        const notifications = await NotificationService.listNotifications();
        setNotifications(notifications);
      } catch {
        // Keep existing state on polling errors.
      }
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, setNotifications]);
}

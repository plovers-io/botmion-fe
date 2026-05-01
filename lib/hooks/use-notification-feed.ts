"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/store/auth-store-v2";
import { useNotificationStore } from "@/lib/store/notification-store";
import { NotificationService } from "@/lib/services/notification-service";

const POLL_INTERVAL_MS = 300_000; // 5 minutes (SSE is primary, polling is backup)
const SSE_MAX_RECONNECT_ATTEMPTS = 5;
const SSE_RECONNECT_BASE_DELAY_MS = 2000;

export function useNotificationFeed() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const setNotifications = useNotificationStore((state) => state.setNotifications);
  const upsertNotification = useNotificationStore(
    (state) => state.upsertNotification
  );
  const reset = useNotificationStore((state) => state.reset);

  // Track SSE reconnect attempts in a ref so it survives re-renders
  const sseAttemptsRef = useRef(0);
  const sseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial load + polling fallback
  useEffect(() => {
    if (!isAuthenticated) {
      reset();
      return;
    }

    let cancelled = false;

    const loadNotifications = async () => {
      try {
        const result = await NotificationService.listNotifications();
        if (!cancelled) {
          setNotifications(result.results);
        }
      } catch {
        // Fail silently; polling will retry.
      }
    };

    loadNotifications();

    const intervalId = window.setInterval(() => {
      if (!cancelled) loadNotifications();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, reset, setNotifications]);

  // SSE real-time stream
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    let eventSource: EventSource | null = null;
    let unmounted = false;

    const connect = () => {
      if (unmounted) return;
      if (sseAttemptsRef.current >= SSE_MAX_RECONNECT_ATTEMPTS) {
        // Stop trying; polling will serve as fallback
        return;
      }

      const streamUrl = NotificationService.getStreamUrl(accessToken);

      try {
        eventSource = new EventSource(streamUrl, { withCredentials: true });
      } catch {
        eventSource = null;
        return;
      }

      eventSource.onopen = () => {
        // Reset attempts on successful connection
        sseAttemptsRef.current = 0;
        if (sseTimerRef.current) {
          clearTimeout(sseTimerRef.current);
          sseTimerRef.current = null;
        }
      };

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
        // Don't close here — let the browser detect the failure and trigger
        // readyState change. We reconnect with exponential backoff manually
        // to avoid hammering the server.
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }

        sseAttemptsRef.current += 1;
        const delay = Math.min(
          SSE_RECONNECT_BASE_DELAY_MS * Math.pow(2, sseAttemptsRef.current - 1),
          30000 // cap at 30s
        );

        if (sseTimerRef.current) {
          clearTimeout(sseTimerRef.current);
        }
        sseTimerRef.current = setTimeout(() => {
          if (!unmounted) connect();
        }, delay);
      };
    };

    connect();

    return () => {
      unmounted = true;
      if (sseTimerRef.current) {
        clearTimeout(sseTimerRef.current);
        sseTimerRef.current = null;
      }
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  }, [isAuthenticated, accessToken, upsertNotification]);
}

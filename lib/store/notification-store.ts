"use client";

import { create } from "zustand";
import { NotificationItem } from "@/lib/types/notification";

const MAX_NOTIFICATIONS = 100;

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  setNotifications: (notifications: NotificationItem[]) => void;
  upsertNotification: (notification: NotificationItem) => void;
  markAllRead: () => void;
  reset: () => void;
}

function toTimestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function sortNotifications(notifications: NotificationItem[]): NotificationItem[] {
  return [...notifications].sort(
    (a, b) => toTimestamp(b.created_at) - toTimestamp(a.created_at)
  );
}

function computeUnreadCount(notifications: NotificationItem[]): number {
  return notifications.reduce(
    (count, notification) =>
      count + (notification.status === "unread" ? 1 : 0),
    0
  );
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) => {
    const map = new Map<number, NotificationItem>();
    notifications.forEach((notification) => {
      map.set(notification.id, notification);
    });

    const ordered = sortNotifications(Array.from(map.values())).slice(
      0,
      MAX_NOTIFICATIONS
    );

    set({
      notifications: ordered,
      unreadCount: computeUnreadCount(ordered),
    });
  },

  upsertNotification: (notification) =>
    set((state) => {
      const next = [...state.notifications];
      const index = next.findIndex((item) => item.id === notification.id);

      if (index >= 0) {
        next[index] = { ...next[index], ...notification };
      } else {
        next.unshift(notification);
      }

      const ordered = sortNotifications(next).slice(0, MAX_NOTIFICATIONS);

      return {
        notifications: ordered,
        unreadCount: computeUnreadCount(ordered),
      };
    }),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.status === "unread"
          ? {
              ...notification,
              status: "read",
              read_at: notification.read_at ?? new Date().toISOString(),
            }
          : notification
      ),
      unreadCount: 0,
    })),

  reset: () => ({
    notifications: [],
    unreadCount: 0,
  }),
}));

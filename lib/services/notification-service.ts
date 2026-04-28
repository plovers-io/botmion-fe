import { apiClient } from "./api-client";
import {
  NotificationItem,
  NotificationListParams,
  NotificationStatus,
  NotificationChannel,
  NotificationPriority,
} from "@/lib/types/notification";

const NOTIFICATIONS_BASE =
  process.env.NEXT_PUBLIC_NOTIFICATIONS_URL ||
  "http://localhost:8000/notifications";
const NOTIFICATIONS_V1 = `${NOTIFICATIONS_BASE.replace(/\/$/, "")}/v1`;

function buildUrl(path: string, query?: Record<string, string | number | undefined>): string {
  if (!query) {
    return `${NOTIFICATIONS_V1}${path}`;
  }

  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();
  if (!queryString) {
    return `${NOTIFICATIONS_V1}${path}`;
  }

  return `${NOTIFICATIONS_V1}${path}?${queryString}`;
}

export class NotificationService {
  static async listNotifications(
    params?: NotificationListParams
  ): Promise<NotificationItem[]> {
    const response = await apiClient.get<NotificationItem[]>(
      buildUrl("/notifications/", params)
    );
    return response.data;
  }

  static async markAllRead(): Promise<{ count: number }> {
    const response = await apiClient.post<{ count: number }>(
      buildUrl("/notifications/mark-all-read/")
    );
    return response.data;
  }

  static async updateStatus(
    id: number,
    status: NotificationStatus
  ): Promise<NotificationItem> {
    const response = await apiClient.patch<NotificationItem>(
      buildUrl(`/notifications/${id}/`),
      { status }
    );
    return response.data;
  }

  static getStreamUrl(): string {
    return `${NOTIFICATIONS_V1}/notifications/stream/`;
  }

  static normalizeSsePayload(payload: unknown): NotificationItem | null {
    if (!payload || typeof payload !== "object") {
      return null;
    }

    const record = payload as Record<string, unknown>;
    const idValue = record.id;
    const id = typeof idValue === "number" ? idValue : Number(idValue);

    if (!Number.isFinite(id)) {
      return null;
    }

    const status = record.status as NotificationStatus | undefined;
    const priority = record.priority as NotificationPriority | undefined;
    const channel = record.channel as NotificationChannel | undefined;
    const actionUrl = typeof record.action_url === "string" ? record.action_url : null;
    const metadata =
      record.metadata && typeof record.metadata === "object" && !Array.isArray(record.metadata)
        ? (record.metadata as Record<string, unknown>)
        : {};

    return {
      id,
      uuid: typeof record.uuid === "string" ? record.uuid : String(id),
      title: typeof record.title === "string" ? record.title : "Notification",
      body: typeof record.body === "string" ? record.body : "",
      status: status ?? "unread",
      priority: priority ?? "low",
      channel: channel ?? "in_app",
      action_url: actionUrl,
      metadata,
      created_at:
        typeof record.created_at === "string"
          ? record.created_at
          : new Date().toISOString(),
    };
  }
}

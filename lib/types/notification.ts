export type NotificationStatus = "unread" | "read" | "archived";
export type NotificationPriority = "low" | "medium" | "high" | "urgent";
export type NotificationChannel = "in_app" | "email" | "push" | "sms";

export interface NotificationItem {
  id: number;
  uuid: string;
  title: string;
  body: string;
  status: NotificationStatus;
  priority: NotificationPriority;
  channel: NotificationChannel;
  action_url?: string | null;
  metadata?: Record<string, unknown>;
  sent_at?: string | null;
  read_at?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface NotificationListParams {
  status?: NotificationStatus;
  priority?: NotificationPriority;
  channel?: NotificationChannel;
  page?: number;
  page_size?: number;
}

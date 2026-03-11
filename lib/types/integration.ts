// Integration types matching backend models

export type PlatformType = "messenger" | "whatsapp" | "slack" | "web";

export interface MessengerConfig {
  page_id: string;
  page_name?: string;
  page_access_token: string;
}

export interface Integration {
  id: number;
  uuid: string;
  chatbot: number;
  chatbot_name?: string;
  platform: PlatformType;
  platform_display: string;
  config: MessengerConfig | Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface IntegrationCreateRequest {
  chatbot: number;
  platform: PlatformType;
  config: MessengerConfig | Record<string, unknown>;
}

export interface IntegrationUpdateRequest {
  config?: Partial<MessengerConfig> | Record<string, unknown>;
  is_active?: boolean;
}

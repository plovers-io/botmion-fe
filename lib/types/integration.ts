// Integration types matching backend models

export type PlatformType = "messenger" | "whatsapp" | "slack" | "web";

export interface MessengerConfig {
  page_id: string;
  page_name?: string;
  page_access_token: string;
}

export interface MessengerOAuthPage {
  page_id: string;
  page_name: string;
  page_access_token: string;
}

export interface MessengerOAuthStartResponse {
  authorization_url: string;
  expires_in: number;
}

export interface MessengerOAuthExchangeRequest {
  code: string;
  state: string;
  redirect_uri: string;
}

export interface MessengerOAuthExchangeResponse {
  chatbot_id: number;
  pages: MessengerOAuthPage[];
}

export interface Integration {
  id: number;
  uuid: string;
  chatbot: number;
  chatbot_name?: string;
  platform: PlatformType;
  platform_display: string;
  config: MessengerConfig | Record<string, unknown>;
  safe_config?: Record<string, unknown>;
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

export type TokenTypeFilter = "input" | "output" | "total";

export interface TokenUsageAccountBreakdown {
  account_user_id: number | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  request_count: number;
}

export interface TokenUsageChatbotBreakdown {
  chatbot_id: number;
  chatbot__name: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  request_count: number;
}

export interface TokenUsageTimeSeriesPoint {
  date: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  request_count: number;
  selected_tokens: number;
}

export interface TokenUsageBreakdownPagination {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface TokenUsageAnalyticsResponse {
  filters: {
    chatbot_id: number | null;
    token_type: TokenTypeFilter;
    start_date: string | null;
    end_date: string | null;
  };
  summary: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    request_count: number;
  };
  top_account: TokenUsageAccountBreakdown | null;
  top_chatbot: TokenUsageChatbotBreakdown | null;
  account_breakdown: TokenUsageAccountBreakdown[];
  account_breakdown_pagination: TokenUsageBreakdownPagination;
  chatbot_breakdown: TokenUsageChatbotBreakdown[];
  chatbot_breakdown_pagination: TokenUsageBreakdownPagination;
  timeseries: TokenUsageTimeSeriesPoint[];
}

export interface TokenUsageAnalyticsQuery {
  chatbot_id?: number;
  token_type?: TokenTypeFilter;
  start_date?: string;
  end_date?: string;
  account_page?: number;
  account_page_size?: number;
  chatbot_page?: number;
  chatbot_page_size?: number;
}

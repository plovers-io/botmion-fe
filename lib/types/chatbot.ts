// Chatbot types matching backend models

export type BotType = "support" | "sales" | "faq" | "custom";
export type BotStatus = "draft" | "published" | "archived";
export type ResponseStyle = "chat" | "gpt";
export type AnswerStyle = "short" | "balanced" | "detailed";
export type WindowSize = "small" | "medium" | "fullscreen";

export interface ChatbotConfig {
  overhead_type: string;
  details: Record<string, unknown>;
}

export interface ChatbotUI {
  breadcrumb_nav: boolean;
  icon_avatar?: string | null;
  header?: string | null;
  sub_header?: string | null;
  window_size: WindowSize;
}

export interface RAGConfig {
  top_k: number;
  score_threshold: number;
  retrieval_strategy: string;
  include_sources: boolean;
  rerank: boolean;
}

export interface Persona {
  name: string;
  personality_prompt: string;
}

export interface AITuning {
  model_name: string;
  response_style: ResponseStyle;
  answer_style: AnswerStyle;
  max_tokens: number;
}

export interface InteractionSetting {
  require_name_email: boolean;
  require_password: boolean;
  collect_feedback: boolean;
  welcome_message: string;
  popup_message?: string;
  predefined_questions: string[];
  fallback_message?: string;
  live_agent_ack_message?: string;
  live_agent_waiting_message?: string;
  live_agent_left_message?: string;
}

export interface NotificationSetting {
  email_notification: boolean;
  live_agent_request: boolean;
  live_agent_transcript: boolean;
  receive_transcript: boolean;
  include_summary: boolean;
  include_unresolved_summary: boolean;
  email_unresolved_requests: boolean;
}

export interface ChatbotWidgetConfig {
  widget_key: string;
  theme_config: {
    primary_color?: string;
    position?: "bottom-right" | "bottom-left";
    bubble_icon?: string;
    [key: string]: unknown;
  };
  allowed_origins?: string[];
}

export interface Chatbot {
  id: number;
  uuid: string;
  user: number;
  name: string;
  type: BotType;
  status: BotStatus;
  config?: ChatbotConfig | null;
  ui?: ChatbotUI | null;
  rag_config?: RAGConfig | null;
  persona?: Persona | null;
  ai_tuning?: AITuning | null;
  interaction?: InteractionSetting | null;
  notification?: NotificationSetting | null;
  widget?: ChatbotWidgetConfig | null;
  created_at: string;
  updated_at: string;
}

export interface ChatbotCreateRequest {
  name: string;
  type?: BotType;
  config?: Partial<ChatbotConfig>;
  ui?: Partial<ChatbotUI>;
  rag_config?: Partial<RAGConfig>;
  persona?: Partial<Persona>;
  ai_tuning?: Partial<AITuning>;
  interaction?: Partial<InteractionSetting>;
}

export interface ChatbotUpdateRequest {
  name?: string;
  type?: BotType;
  status?: BotStatus;
  config?: Partial<ChatbotConfig> | null;
  ui?: Partial<ChatbotUI> | null;
  rag_config?: Partial<RAGConfig> | null;
  persona?: Partial<Persona> | null;
  ai_tuning?: Partial<AITuning> | null;
  interaction?: Partial<InteractionSetting> | null;
  notification?: Partial<NotificationSetting> | null;
  widget?: {
    theme_config?: Record<string, unknown>;
    allowed_origins?: string[];
  } | null;
}

// Public chatbot config (returned by widget config endpoint)
export interface PublicChatbotConfig {
  uuid: string;
  name: string;
  type: BotType;
  ui?: ChatbotUI | null;
  persona?: Persona | null;
  interaction?: InteractionSetting | null;
  widget?: ChatbotWidgetConfig | null;
}

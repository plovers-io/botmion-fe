// Chatbot types matching backend models

export type BotType = "support" | "sales" | "faq" | "custom";
export type BotStatus = "draft" | "published" | "archived";

export interface ChatbotConfig {
  overhead_type: string;
  details: Record<string, unknown>;
}

export interface ChatbotUI {
  breadcrumb_nav: boolean;
  icon_avatar?: string | null;
  header?: string | null;
  sub_header?: string | null;
  window_size: string;
}

export interface RAGConfig {
  top_k: number;
  score_threshold: number;
  retrieval_strategy: string;
  include_sources: boolean;
  rerank: boolean;
}

export interface Chatbot {
  id: number;
  user: number;
  name: string;
  type: BotType;
  status: BotStatus;
  config?: ChatbotConfig | null;
  ui?: ChatbotUI | null;
  rag_config?: RAGConfig | null;
  created_at: string;
  updated_at: string;
}

export interface ChatbotCreateRequest {
  name: string;
  type?: BotType;
  config?: Partial<ChatbotConfig>;
  ui?: Partial<ChatbotUI>;
  rag_config?: Partial<RAGConfig>;
}

export interface ChatbotUpdateRequest {
  name?: string;
  type?: BotType;
  status?: BotStatus;
  config?: Partial<ChatbotConfig> | null;
  ui?: Partial<ChatbotUI> | null;
  rag_config?: Partial<RAGConfig> | null;
}

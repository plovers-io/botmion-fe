// Chatbot types matching backend models

export type BotType = "support" | "sales" | "faq" | "custom";
export type BotStatus = "draft" | "published" | "archived";

export interface Chatbot {
  id: number;
  name: string;
  type: BotType;
  status: BotStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatbotCreateRequest {
  name: string;
  type?: BotType;
}

export interface ChatbotUpdateRequest {
  name?: string;
  type?: BotType;
  status?: BotStatus;
}

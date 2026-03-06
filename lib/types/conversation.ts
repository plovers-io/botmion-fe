// Conversation / Messaging types matching backend models

export type ConversationStatus = "open" | "waiting" | "active" | "closed";
export type MessageRole = "system" | "user" | "assistant";
export type ChatMessageStatus = "processing" | "completed" | "failed" | "cancelled" | "timeout";
export type PlatformType = "messenger" | "whatsapp" | "slack" | "web";

export interface Message {
  id: number;
  uuid: string;
  role: MessageRole;
  content: string;
  status: ChatMessageStatus;
  is_streamed: boolean;
  finish_reason: string;
  external_id?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Conversation {
  id: number;
  chatbot: number;
  title: string;
  model_name: string;
  chat_type: string;
  platform: PlatformType;
  status: ConversationStatus;
  external_id?: string | null;
  metadata: Record<string, unknown>;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export interface PaginatedConversations {
  count: number;
  next: string | null;
  previous: string | null;
  results: Conversation[];
}

export interface ChatMessageRequest {
  content: string;
  chatbot_id: number;
  conversation_id?: number | null;
  platform?: PlatformType;
  external_id?: string;
  metadata?: Record<string, unknown>;
}

export interface ChatMessageResponse {
  user_message: Message;
  assistant_message: Message;
  conversation_id: number;
  /** "processing" while Celery task is running, then "completed" or "failed" */
  status: "processing" | "completed" | "failed" | string;
}

export interface PublicChatRequest {
  content: string;
  chatbot_uuid: string;
  session_id?: string;
}

export interface PublicChatResponse {
  user_message: Message;
  assistant_message: Message;
  conversation_id: number;
  session_id: string;
}

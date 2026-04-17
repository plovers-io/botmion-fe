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
  message_type?: "text" | "image" | "mixed";
  image_file?: string | null;
  image_caption?: string;
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

/** Lightweight conversation returned by the list endpoint (only last_message, not all messages). */
export interface ConversationListItem {
  id: number;
  chatbot: number;
  title: string;
  model_name: string;
  chat_type: string;
  platform: PlatformType;
  status: ConversationStatus;
  external_id?: string | null;
  metadata: Record<string, unknown>;
  last_message: Message | null;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedConversations {
  count: number;
  next: string | null;
  previous: string | null;
  results: ConversationListItem[];
}

export interface ChatMessageRequest {
  content?: string;
  image_file?: File;
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
  transcript?: string;
  /** "processing" while Celery task is running, then "completed" or "failed" */
  status: "processing" | "completed" | "failed" | string;
}

export interface PublicChatRequest {
  content: string;
  chatbot_uuid: string;
  session_id?: string;
}

export interface ChatAudioRequest {
  audio: Blob;
  language_hint?: "auto" | "bn" | "en";
  duration_ms?: number;
  chatbot_id: number;
  conversation_id?: number | null;
  platform?: PlatformType;
  external_id?: string;
  metadata?: Record<string, unknown>;
}

export interface PublicChatAudioRequest {
  audio: Blob;
  chatbot_uuid: string;
  session_id?: string;
  language_hint?: "auto" | "bn" | "en";
  duration_ms?: number;
}

export interface PublicChatResponse {
  user_message: Message;
  assistant_message: Message;
  conversation_id: number;
  session_id: string;
  transcript?: string;
}

export interface ConversationAnalyticsQuery {
  chatbot_id?: number;
  platform?: PlatformType;
  start_date?: string;
  end_date?: string;
}

export interface ConversationAnalyticsResponse {
  filters: {
    chatbot_id: number | null;
    platform: PlatformType | null;
    start_date: string | null;
    end_date: string | null;
  };
  summary: {
    total_conversations: number;
    active_conversations: number;
    total_messages: number;
    avg_messages_per_conversation: number;
  };
  platform_breakdown: Array<{
    platform: PlatformType;
    total: number;
  }>;
  status_breakdown: Array<{
    status: ConversationStatus;
    total: number;
  }>;
  chatbot_breakdown: Array<{
    chatbot_id: number;
    chatbot__name: string;
    conversation_count: number;
    message_count: number;
  }>;
  timeseries: Array<{
    date: string;
    conversation_count: number;
    message_count: number;
  }>;
}

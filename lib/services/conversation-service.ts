import { apiClient } from "./api-client";
import {
  Conversation,
  PaginatedConversations,
  ChatMessageRequest,
  ChatMessageResponse,
  PublicChatRequest,
  ChatAudioRequest,
  PublicChatAudioRequest,
  PublicChatResponse,
  ConversationAnalyticsQuery,
  ConversationAnalyticsResponse,
} from "@/lib/types/conversation";
import axios from "axios";

const MESSAGING_BASE =
  process.env.NEXT_PUBLIC_MESSAGING_URL || "http://localhost:8000/messaging";

export class ConversationService {
  /**
   * List all conversations (paginated)
   * GET /messaging/v1/conversations/
   */
  static async getConversations(
    page = 1,
    pageSize = 10,
    platform?: "messenger" | "whatsapp" | "slack" | "web"
  ): Promise<PaginatedConversations> {
    const query = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    });

    if (platform) {
      query.set("platform", platform);
    }

    const response = await apiClient.get<PaginatedConversations>(
      `${MESSAGING_BASE}/v1/conversations/?${query.toString()}`
    );
    return response.data;
  }

  /**
   * Get a single conversation with messages
   * GET /messaging/v1/conversations/:id/
   */
  static async getConversation(id: number): Promise<Conversation> {
    const response = await apiClient.get<Conversation>(
      `${MESSAGING_BASE}/v1/conversations/${id}/`
    );
    return response.data;
  }

  /**
   * Conversation analytics dashboard data
   * GET /messaging/v1/conversations/analytics/
   */
  static async getConversationAnalytics(
    params?: ConversationAnalyticsQuery
  ): Promise<ConversationAnalyticsResponse> {
    const query = new URLSearchParams();
    if (params?.chatbot_id) query.set("chatbot_id", String(params.chatbot_id));
    if (params?.platform) query.set("platform", params.platform);
    if (params?.start_date) query.set("start_date", params.start_date);
    if (params?.end_date) query.set("end_date", params.end_date);

    const response = await apiClient.get<ConversationAnalyticsResponse>(
      `${MESSAGING_BASE}/v1/conversations/analytics/${query.toString() ? `?${query.toString()}` : ""}`
    );
    return response.data;
  }

  /**
   * Delete a conversation
   * DELETE /messaging/v1/conversations/:id/
   */
  static async deleteConversation(id: number): Promise<void> {
    await apiClient.delete(`${MESSAGING_BASE}/v1/conversations/${id}/`);
  }

  /**
   * Send a chat message (authenticated — owner testing)
   * POST /messaging/v1/chat/
   * Returns both user_message and assistant_message synchronously.
   */
  static async sendMessage(
    data: ChatMessageRequest
  ): Promise<ChatMessageResponse> {
    if (data.image_file) {
      const formData = new FormData();
      formData.append("chatbot_id", String(data.chatbot_id));
      formData.append("image_file", data.image_file);
      if (data.content && data.content.trim()) {
        formData.append("content", data.content);
      }
      if (data.conversation_id != null) {
        formData.append("conversation_id", String(data.conversation_id));
      }
      if (data.platform) formData.append("platform", data.platform);
      if (data.external_id) formData.append("external_id", data.external_id);
      if (data.metadata) {
        formData.append("metadata", JSON.stringify(data.metadata));
      }

      const multipartResponse = await apiClient.post<ChatMessageResponse>(
        `${MESSAGING_BASE}/v1/chat/`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return multipartResponse.data;
    }

    const response = await apiClient.post<ChatMessageResponse>(
      `${MESSAGING_BASE}/v1/chat/`,
      data
    );
    return response.data;
  }

  /**
   * Send an audio message (authenticated — owner testing)
   * POST /messaging/v1/chat/audio/
   */
  static async sendAudioMessage(
    data: ChatAudioRequest
  ): Promise<ChatMessageResponse> {
    const formData = new FormData();
    formData.append("audio", data.audio, "voice.webm");
    formData.append("chatbot_id", String(data.chatbot_id));
    formData.append("language_hint", data.language_hint || "auto");
    if (data.conversation_id != null) {
      formData.append("conversation_id", String(data.conversation_id));
    }
    if (data.platform) formData.append("platform", data.platform);
    if (data.external_id) formData.append("external_id", data.external_id);
    if (typeof data.duration_ms === "number") {
      formData.append("duration_ms", String(data.duration_ms));
    }
    if (data.metadata) {
      formData.append("metadata", JSON.stringify(data.metadata));
    }

    const response = await apiClient.post<ChatMessageResponse>(
      `${MESSAGING_BASE}/v1/chat/audio/`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  }

  /**
   * Poll a single message by UUID (no auth required — UUID is unguessable)
   * GET /messaging/v1/messages/:uuid/
   */
  static async getMessage(uuid: string): Promise<import("@/lib/types/conversation").Message> {
    const response = await axios.get(
      `${MESSAGING_BASE}/v1/messages/${uuid}/`
    );
    return response.data;
  }

  /**
   * SSE stream for a message — replaces polling.
   * Returns an EventSource-like interface that resolves when the message is ready.
   */
  static streamMessage(
    uuid: string,
    onComplete: (data: { status: string; content: string }) => void,
    onError: () => void,
  ): { close: () => void } {
    const url = `${MESSAGING_BASE}/v1/messages/${uuid}/stream/`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        eventSource.close();
        onComplete(data);
      } catch {
        eventSource.close();
        onError();
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      onError();
    };

    return { close: () => eventSource.close() };
  }

  /**
   * Public chat (no auth — end-user widget)
   * POST /messaging/v1/public/chat/
   */
  static async publicChat(
    data: PublicChatRequest
  ): Promise<PublicChatResponse> {
    const response = await axios.post<PublicChatResponse>(
      `${MESSAGING_BASE}/v1/public/chat/`,
      data
    );
    return response.data;
  }

  /**
   * Public audio chat (no auth — end-user widget)
   * POST /messaging/v1/public/chat/audio/
   */
  static async publicAudioChat(
    data: PublicChatAudioRequest
  ): Promise<PublicChatResponse> {
    const formData = new FormData();
    formData.append("audio", data.audio, "voice.webm");
    formData.append("chatbot_uuid", data.chatbot_uuid);
    formData.append("language_hint", data.language_hint || "auto");
    if (data.session_id) formData.append("session_id", data.session_id);
    if (typeof data.duration_ms === "number") {
      formData.append("duration_ms", String(data.duration_ms));
    }

    const response = await axios.post<PublicChatResponse>(
      `${MESSAGING_BASE}/v1/public/chat/audio/`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  }
}

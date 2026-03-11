import { apiClient } from "./api-client";
import {
  Conversation,
  PaginatedConversations,
  ChatMessageRequest,
  ChatMessageResponse,
  PublicChatRequest,
  PublicChatResponse,
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
    pageSize = 10
  ): Promise<PaginatedConversations> {
    const response = await apiClient.get<PaginatedConversations>(
      `${MESSAGING_BASE}/v1/conversations/?page=${page}&page_size=${pageSize}`
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
    const response = await apiClient.post<ChatMessageResponse>(
      `${MESSAGING_BASE}/v1/chat/`,
      data
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
}

import { apiClient } from "./api-client";
import {
  Chatbot,
  ChatbotCreateRequest,
  ChatbotUpdateRequest,
} from "@/lib/types/chatbot";

const BOTS_BASE =
  process.env.NEXT_PUBLIC_BOTS_URL || "http://localhost:8000/bots";

export class ChatbotService {
  /**
   * List all chatbots for the authenticated user
   * GET /bots/v1/chatbots/
   */
  static async getChatbots(): Promise<Chatbot[]> {
    const response = await apiClient.get<Chatbot[]>(
      `${BOTS_BASE}/v1/chatbots/`
    );
    return response.data;
  }

  /**
   * Get a single chatbot by ID
   * GET /bots/v1/chatbots/:id/
   */
  static async getChatbot(id: number): Promise<Chatbot> {
    const response = await apiClient.get<Chatbot>(
      `${BOTS_BASE}/v1/chatbots/${id}/`
    );
    return response.data;
  }

  /**
   * Create a new chatbot
   * POST /bots/v1/chatbots/
   */
  static async createChatbot(data: ChatbotCreateRequest): Promise<Chatbot> {
    const response = await apiClient.post<Chatbot>(
      `${BOTS_BASE}/v1/chatbots/`,
      data
    );
    return response.data;
  }

  /**
   * Update a chatbot
   * PATCH /bots/v1/chatbots/:id/
   */
  static async updateChatbot(
    id: number,
    data: ChatbotUpdateRequest
  ): Promise<Chatbot> {
    const response = await apiClient.patch<Chatbot>(
      `${BOTS_BASE}/v1/chatbots/${id}/`,
      data
    );
    return response.data;
  }

  /**
   * Delete a chatbot (soft delete)
   * DELETE /bots/v1/chatbots/:id/
   */
  static async deleteChatbot(id: number): Promise<{ detail: string }> {
    const response = await apiClient.delete<{ detail: string }>(
      `${BOTS_BASE}/v1/chatbots/${id}/`
    );
    return response.data;
  }
}

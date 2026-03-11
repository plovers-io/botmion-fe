import { apiClient } from "./api-client";
import axios from "axios";
import {
  Chatbot,
  ChatbotCreateRequest,
  ChatbotUpdateRequest,
  PublicChatbotConfig,
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
   * Update a chatbot (partial update)
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

  /**
   * Get public chatbot config for widget (no auth required)
   * GET /bots/v1/widget/:uuid/config/
   */
  static async getPublicConfig(
    chatbotUuid: string,
    preview?: boolean
  ): Promise<PublicChatbotConfig> {
    const params = preview ? { preview: '1' } : undefined;
    const response = await axios.get<PublicChatbotConfig>(
      `${BOTS_BASE}/v1/widget/${chatbotUuid}/config/`,
      { params }
    );
    return response.data;
  }

  /**
   * Get the embed script URL for a chatbot widget
   */
  static getEmbedScriptUrl(chatbotUuid: string): string {
    return `${BOTS_BASE}/v1/widget/${chatbotUuid}/embed.js`;
  }

  /**
   * Get the iframe embed URL for a chatbot widget
   */
  static getIframeUrl(chatbotUuid: string, preview?: boolean): string {
    const frontendUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const base = `${frontendUrl}/chat/${chatbotUuid}`;
    return preview ? `${base}?preview=1` : base;
  }
}

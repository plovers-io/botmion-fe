import { apiClient } from "./api-client";
import {
  Integration,
  IntegrationCreateRequest,
  IntegrationUpdateRequest,
  TokenUsageAnalyticsQuery,
  TokenUsageAnalyticsResponse,
} from "@/lib/types/integration";

const INTEGRATIONS_BASE =
  process.env.NEXT_PUBLIC_INTEGRATIONS_URL ||
  "http://localhost:8000/integrations";

export class IntegrationService {
  /**
   * List all integrations for the authenticated user
   * GET /integrations/v1/integrations/
   */
  static async getIntegrations(params?: {
    platform?: string;
    chatbot_id?: number;
  }): Promise<Integration[]> {
    const query = new URLSearchParams();
    if (params?.platform) query.set("platform", params.platform);
    if (params?.chatbot_id)
      query.set("chatbot_id", String(params.chatbot_id));
    const qs = query.toString();
    const url = `${INTEGRATIONS_BASE}/v1/integrations/${qs ? `?${qs}` : ""}`;
    const response = await apiClient.get<Integration[]>(url);
    return response.data;
  }

  /**
   * Get a single integration by ID
   * GET /integrations/v1/integrations/:id/
   */
  static async getIntegration(id: number): Promise<Integration> {
    const response = await apiClient.get<Integration>(
      `${INTEGRATIONS_BASE}/v1/integrations/${id}/`
    );
    return response.data;
  }

  /**
   * Create a new integration
   * POST /integrations/v1/integrations/
   */
  static async createIntegration(
    data: IntegrationCreateRequest
  ): Promise<Integration> {
    const response = await apiClient.post<Integration>(
      `${INTEGRATIONS_BASE}/v1/integrations/`,
      data
    );
    return response.data;
  }

  /**
   * Update an integration
   * PATCH /integrations/v1/integrations/:id/
   */
  static async updateIntegration(
    id: number,
    data: IntegrationUpdateRequest
  ): Promise<Integration> {
    const response = await apiClient.patch<Integration>(
      `${INTEGRATIONS_BASE}/v1/integrations/${id}/`,
      data
    );
    return response.data;
  }

  /**
   * Delete (soft-delete) an integration
   * DELETE /integrations/v1/integrations/:id/
   */
  static async deleteIntegration(id: number): Promise<void> {
    await apiClient.delete(
      `${INTEGRATIONS_BASE}/v1/integrations/${id}/`
    );
  }

  /**
   * Token usage analytics for chatbot/account level tracking
   * GET /integrations/v1/token-usage/
   */
  static async getTokenUsageAnalytics(
    params?: TokenUsageAnalyticsQuery
  ): Promise<TokenUsageAnalyticsResponse> {
    const query = new URLSearchParams();
    if (params?.chatbot_id) query.set("chatbot_id", String(params.chatbot_id));
    if (params?.token_type) query.set("token_type", params.token_type);
    if (params?.start_date) query.set("start_date", params.start_date);
    if (params?.end_date) query.set("end_date", params.end_date);
    if (params?.account_page) query.set("account_page", String(params.account_page));
    if (params?.account_page_size) query.set("account_page_size", String(params.account_page_size));
    if (params?.chatbot_page) query.set("chatbot_page", String(params.chatbot_page));
    if (params?.chatbot_page_size) query.set("chatbot_page_size", String(params.chatbot_page_size));

    const qs = query.toString();
    const url = `${INTEGRATIONS_BASE}/v1/token-usage/${qs ? `?${qs}` : ""}`;
    const response = await apiClient.get<TokenUsageAnalyticsResponse>(url);
    return response.data;
  }
}

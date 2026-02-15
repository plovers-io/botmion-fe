import { apiClient } from "./api-client";
import {
  Plan,
  Subscription,
  SubscribeRequest,
  SubscriptionResponse,
} from "@/lib/types/subscription";

const SUBSCRIPTION_BASE =
  process.env.NEXT_PUBLIC_SUBSCRIPTION_URL ||
  "http://localhost:8000/subscription";

export class SubscriptionService {
  /**
   * List all available plans
   * GET /subscription/v1/plans/
   */
  static async getPlans(): Promise<Plan[]> {
    const response = await apiClient.get<Plan[]>(
      `${SUBSCRIPTION_BASE}/v1/plans/`
    );
    return response.data;
  }

  /**
   * Get current workspace subscription
   * GET /subscription/v1/subscription/
   */
  static async getCurrentSubscription(): Promise<Subscription> {
    const response = await apiClient.get<Subscription>(
      `${SUBSCRIPTION_BASE}/v1/subscription/`
    );
    return response.data;
  }

  /**
   * Subscribe to a plan
   * POST /subscription/v1/subscription/
   */
  static async subscribe(
    data: SubscribeRequest
  ): Promise<SubscriptionResponse> {
    const response = await apiClient.post<SubscriptionResponse>(
      `${SUBSCRIPTION_BASE}/v1/subscription/`,
      data
    );
    return response.data;
  }

  /**
   * Cancel current subscription
   * POST /subscription/v1/subscription/cancel/
   */
  static async cancelSubscription(): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      `${SUBSCRIPTION_BASE}/v1/subscription/cancel/`
    );
    return response.data;
  }
}

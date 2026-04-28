import { apiClient } from "./api-client";
import {
  Plan,
  Subscription,
  SubscribeRequest,
  UpdateSubscriptionRequest,
  SubscriptionQuotasResponse,
  CurrentUsageResponse,
  UsageHistoryQuery,
  UsageHistoryResponse,
  InvoiceListQuery,
  InvoiceListResponse,
  Invoice,
  InvoiceSummaryResponse,
  ValidateCouponRequest,
  ValidateCouponResponse,
  ApplyCouponRequest,
  ApplyCouponResponse,
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentHistoryQuery,
  PaymentHistoryResponse,
  PaymentTransaction,
  RefundPaymentRequest,
  RefundPaymentResponse,
  RenewalStatusResponse,
  RenewSubscriptionRequest,
  PlanCatalogResponse,
} from "@/lib/types/subscription";

const SUBSCRIPTION_BASE =
  process.env.NEXT_PUBLIC_SUBSCRIPTION_URL ||
  "http://localhost:8000/subscription";
const SUBSCRIPTION_V1 = `${SUBSCRIPTION_BASE.replace(/\/$/, "")}/v1`;

function buildUrl(path: string, query?: Record<string, unknown>): string {
  if (!query) {
    return `${SUBSCRIPTION_V1}${path}`;
  }

  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return;
    }

    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();
  if (!queryString) {
    return `${SUBSCRIPTION_V1}${path}`;
  }

  return `${SUBSCRIPTION_V1}${path}?${queryString}`;
}

export class SubscriptionService {
  /**
   * List all available plans
   * GET /subscription/v1/plans/
   */
  static async getPlans(): Promise<PlanCatalogResponse> {
    const response = await apiClient.get<PlanCatalogResponse>(buildUrl("/plans/"));
    return response.data;
  }

  /**
   * Get a single plan by slug.
   * GET /subscription/v1/plans/{slug}/
   */
  static async getPlanDetail(slug: string): Promise<Plan> {
    const response = await apiClient.get<Plan>(buildUrl(`/plans/${slug}/`));
    return response.data;
  }

  /**
   * Get current workspace subscription
   * GET /subscription/v1/subscription/
   */
  static async getCurrentSubscription(): Promise<Subscription> {
    const response = await apiClient.get<Subscription>(
      buildUrl("/subscription/")
    );
    return response.data;
  }

  /**
   * Subscribe to a plan
   * POST /subscription/v1/subscription/
   */
  static async subscribe(
    data: SubscribeRequest
  ): Promise<Subscription> {
    const response = await apiClient.post<Subscription>(
      buildUrl("/subscription/"),
      data
    );
    return response.data;
  }

  /**
   * Update subscription settings.
   * PATCH /subscription/v1/subscription/
   */
  static async updateSubscription(
    data: UpdateSubscriptionRequest
  ): Promise<Subscription> {
    const response = await apiClient.patch<Subscription>(
      buildUrl("/subscription/"),
      data
    );
    return response.data;
  }

  /**
   * Cancel current subscription
   * POST /subscription/v1/subscription/cancel/
   */
  static async cancelSubscription(): Promise<Subscription> {
    const response = await apiClient.post<Subscription>(
      buildUrl("/subscription/cancel/"),
      {}
    );
    return response.data;
  }

  /**
   * Fetch subscription quotas with usage percentages.
   * GET /subscription/v1/subscription/quotas/
   */
  static async getSubscriptionQuotas(): Promise<SubscriptionQuotasResponse> {
    const response = await apiClient.get<SubscriptionQuotasResponse>(
      buildUrl("/subscription/quotas/")
    );
    return response.data;
  }

  /**
   * Fetch current billing-period usage.
   * GET /subscription/v1/usage/
   */
  static async getCurrentUsage(): Promise<CurrentUsageResponse> {
    const response = await apiClient.get<CurrentUsageResponse>(
      buildUrl("/usage/")
    );
    return response.data;
  }

  /**
   * Fetch historical usage records.
   * GET /subscription/v1/usage/history/
   */
  static async getUsageHistory(
    query: UsageHistoryQuery = {}
  ): Promise<UsageHistoryResponse> {
    const response = await apiClient.get<UsageHistoryResponse>(
      buildUrl("/usage/history/", query)
    );
    return response.data;
  }

  /**
   * List invoices.
   * GET /subscription/v1/invoices/
   */
  static async getInvoices(
    query: InvoiceListQuery = {}
  ): Promise<InvoiceListResponse> {
    const response = await apiClient.get<InvoiceListResponse>(
      buildUrl("/invoices/", query)
    );
    return response.data;
  }

  /**
   * Fetch a single invoice detail.
   * GET /subscription/v1/invoices/{invoice_id}/
   */
  static async getInvoice(invoiceId: string): Promise<Invoice> {
    const response = await apiClient.get<Invoice>(
      buildUrl(`/invoices/${invoiceId}/`)
    );
    return response.data;
  }

  /**
   * Fetch invoice aggregate summary.
   * GET /subscription/v1/invoices/summary/
   */
  static async getInvoiceSummary(): Promise<InvoiceSummaryResponse> {
    const response = await apiClient.get<InvoiceSummaryResponse>(
      buildUrl("/invoices/summary/")
    );
    return response.data;
  }

  /**
   * Validate coupon before applying.
   * POST /subscription/v1/coupons/validate/
   */
  static async validateCoupon(
    data: ValidateCouponRequest
  ): Promise<ValidateCouponResponse> {
    const response = await apiClient.post<ValidateCouponResponse>(
      buildUrl("/coupons/validate/"),
      data
    );
    return response.data;
  }

  /**
   * Apply coupon to active subscription.
   * POST /subscription/v1/coupons/apply/
   */
  static async applyCoupon(
    data: ApplyCouponRequest
  ): Promise<ApplyCouponResponse> {
    const response = await apiClient.post<ApplyCouponResponse>(
      buildUrl("/coupons/apply/"),
      data
    );
    return response.data;
  }

  /**
   * Create a new payment session.
   * POST /subscription/v1/payments/create/
   */
  static async createPayment(
    data: CreatePaymentRequest
  ): Promise<CreatePaymentResponse> {
    const response = await apiClient.post<CreatePaymentResponse>(
      buildUrl("/payments/create/"),
      data
    );
    return response.data;
  }

  /**
   * Fetch a payment transaction status.
   * GET /subscription/v1/payments/{transaction_id}/status/
   */
  static async getPaymentStatus(
    transactionId: string
  ): Promise<PaymentTransaction> {
    const response = await apiClient.get<PaymentTransaction>(
      buildUrl(`/payments/${transactionId}/status/`)
    );
    return response.data;
  }

  /**
   * List payment transactions.
   * GET /subscription/v1/payments/history/
   */
  static async getPaymentHistory(
    query: PaymentHistoryQuery = {}
  ): Promise<PaymentHistoryResponse> {
    const response = await apiClient.get<PaymentHistoryResponse>(
      buildUrl("/payments/history/", query)
    );
    return response.data;
  }

  /**
   * Request refund for a transaction.
   * POST /subscription/v1/payments/{transaction_id}/refund/
   */
  static async refundPayment(
    transactionId: string,
    data: RefundPaymentRequest = {}
  ): Promise<RefundPaymentResponse> {
    const response = await apiClient.post<RefundPaymentResponse>(
      buildUrl(`/payments/${transactionId}/refund/`),
      data
    );
    return response.data;
  }

  /**
   * Get renewal status for current subscription.
   * GET /subscription/v1/payments/renewal-status/
   */
  static async getRenewalStatus(): Promise<RenewalStatusResponse> {
    const response = await apiClient.get<RenewalStatusResponse>(
      buildUrl("/payments/renewal-status/")
    );
    return response.data;
  }

  /**
   * Create renewal payment session.
   * POST /subscription/v1/payments/renew/
   */
  static async renewSubscription(
    data: RenewSubscriptionRequest = {}
  ): Promise<CreatePaymentResponse> {
    const response = await apiClient.post<CreatePaymentResponse>(
      buildUrl("/payments/renew/"),
      data
    );
    return response.data;
  }
}

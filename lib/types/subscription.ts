// Subscription, coupon, usage, invoice, and payment domain types.

export type BillingCycle = "monthly" | "yearly";
export type SubscriptionStatus = "ACTIVE" | "PAST_DUE" | "CANCELED" | "TRIAL";
export type CouponDiscountType = "percentage" | "fixed_amount" | "free_trial";
export type CouponDuration = "once" | "repeating" | "forever";
export type InvoiceStatus = "draft" | "open" | "paid" | "uncollectible" | "void";
export type UsageMetric =
  | "messages"
  | "bots"
  | "documents"
  | "storage_mb"
  | "api_calls"
  | "members"
  | "knowledge_sources"
  | "integrations";
export type PaymentGateway = "stripe" | "bkash" | "nagad" | "sslcommerz";
export type PaymentTransactionStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "refunded"
  | "cancelled";

export interface Feature {
  id: number;
  code: string;
  name: string;
  description: string;
}

export interface PlanQuota {
  feature_code: string;
  limit: number;
}

export interface Plan {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description: string;
  price_monthly: string;
  price_yearly: string;
  is_active: boolean;
  features: Feature[];
  quotas: PlanQuota[];
  created_at?: string;
  updated_at?: string;
}

export interface PlanCatalogResponse {
  plans: Plan[];
  plan_sequence: string[];
  comparison_note: string;
  billing_cycle_notes: Record<BillingCycle, string>;
  expiry_note: string;
}

export interface Subscription {
  id: number;
  plan: Plan;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  start_date: string;
  end_date?: string | null;
  allow_overage: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SubscribeRequest {
  plan_slug: string;
  billing_cycle?: BillingCycle;
}

export interface UpdateSubscriptionRequest {
  allow_overage?: boolean;
  billing_cycle?: BillingCycle;
}

export interface SubscriptionPlanInfo {
  id: string;
  name: string;
  slug: string;
}

export interface SubscriptionQuota {
  metric: string;
  limit: number | "unlimited";
  used: number;
  remaining: number | "unlimited";
  percentage: number;
}

export interface SubscriptionQuotasResponse {
  plan: SubscriptionPlanInfo;
  quotas: Record<string, SubscriptionQuota>;
  allow_overage: boolean;
  billing_cycle: BillingCycle;
}

export interface CurrentUsageQuota {
  metric: string;
  limit: number | null;
  used: number;
  remaining: number | null;
  overage: number;
}

export interface CurrentUsageResponse {
  period: {
    start: string;
    end: string;
  };
  usage: Record<string, CurrentUsageQuota>;
}

export interface UsageHistoryRecord {
  id: number;
  metric: UsageMetric;
  count: number;
  overage_count: number;
  overage_cost: string;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

export interface UsageHistoryFilters {
  metric: UsageMetric | null;
  start_date: string | null;
  end_date: string | null;
  granularity: "daily" | "weekly" | "monthly";
}

export interface UsageHistoryResponse {
  history: UsageHistoryRecord[];
  filters: UsageHistoryFilters;
  total_records: number;
}

export interface UsageHistoryQuery {
  metric?: UsageMetric;
  start_date?: string;
  end_date?: string;
  granularity?: "daily" | "weekly" | "monthly";
}

export interface InvoicePlanSummary {
  id: string | null;
  name: string | null;
}

export interface InvoicePeriod {
  start: string | null;
  end: string | null;
}

export interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: string;
  amount: string;
  metric: UsageMetric | null;
  proration: boolean;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  stripe_invoice_id: string | null;
  status: InvoiceStatus;
  subtotal: string;
  tax: string;
  total: string;
  amount_due: string;
  amount_paid: string;
  currency: string;
  period: InvoicePeriod;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  plan: InvoicePlanSummary | null;
  items: InvoiceItem[];
  has_pdf: boolean;
  item_count: number;
  pdf_url: string | null;
  hosted_invoice_url: string | null;
}

export interface InvoicePagination {
  page: number;
  page_size: number;
  total_pages: number;
  total_items: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface InvoiceListResponse {
  invoices: Invoice[];
  pagination: InvoicePagination;
}

export interface InvoiceListQuery {
  status?: InvoiceStatus;
  page?: number;
  page_size?: number;
}

export interface InvoiceSummaryResponse {
  total_invoices: number;
  paid_invoices: number;
  open_invoices: number;
  overdue_invoices: number;
  lifetime_spend: string;
  current_due: string;
  currency: string;
}

export interface ValidateCouponRequest {
  code: string;
}

export interface ValidateCouponResponse {
  valid: boolean;
  code?: string;
  name?: string;
  discount_type?: CouponDiscountType;
  discount_value?: string;
  duration?: CouponDuration;
  duration_in_months?: number | null;
  error?: string;
}

export interface ApplyCouponRequest {
  code: string;
}

export interface ApplyCouponResponse {
  success: boolean;
  code?: string;
  discount_amount?: string;
  currency?: string;
  redeemed_at?: string;
  error?: string;
}

export interface CreatePaymentRequest {
  plan_id?: string | null;
  billing_cycle?: BillingCycle;
  gateway?: PaymentGateway;
  amount: string;
  currency?: string;
}

export interface CreatePaymentResponse {
  success: boolean;
  transaction_id: string;
  gateway: PaymentGateway;
  redirect_url: string;
  message?: string;
  is_existing?: boolean;
  renewal?: boolean;
  previous_subscription_end?: string | null;
}

export interface PaymentTransaction {
  transaction_id: string;
  gateway: PaymentGateway;
  amount: string;
  currency: string;
  status: PaymentTransactionStatus;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
  plan_name?: string;
}

export interface PaymentHistoryResponse {
  count: number;
  transactions: PaymentTransaction[];
}

export interface PaymentHistoryQuery {
  status?: PaymentTransactionStatus;
  gateway?: PaymentGateway;
  limit?: number;
  offset?: number;
}

export interface RefundPaymentRequest {
  amount?: string | null;
  reason?: string;
}

export interface RefundPaymentResponse {
  success: boolean;
  message: string;
  transaction_id: string;
  refund_amount: string;
  original_amount: string;
}

export interface RenewalStatusResponse {
  subscription_id: string;
  plan_name: string;
  status: string;
  payment_gateway: PaymentGateway | null;
  auto_renew: boolean;
  days_until_expiry: number | null;
  end_date: string | null;
  renewal_required: boolean;
}

export interface RenewSubscriptionRequest {
  billing_cycle?: BillingCycle;
}

// Feature comparison data for plan comparison UI.
export interface FeatureComparison {
  code: string;
  name: string;
  description: string;
  basic: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
}

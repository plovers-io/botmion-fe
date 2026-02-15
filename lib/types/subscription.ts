// Subscription types matching backend models exactly

export interface Feature {
  id: string;
  code: string;
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface PlanQuota {
  id: string;
  plan: string;
  feature_code: string;
  limit: number;
  created_at?: string;
  updated_at?: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  price_monthly: string;
  price_yearly: string;
  features: Feature[];
  quotas: PlanQuota[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Exact backend enums
export type BillingCycle = "monthly" | "yearly";
export type SubscriptionStatus = "active" | "past_due" | "canceled" | "trial";

export interface Subscription {
  id: string;
  workspace?: string;
  plan: Plan;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  start_date: string;
  end_date?: string | null;
  current_period_start?: string;
  current_period_end?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscribeRequest {
  plan_slug: string;
  billing_cycle?: BillingCycle;
}

export interface SubscriptionResponse {
  message: string;
  subscription: Subscription;
}

// Feature comparison data for UI
export interface FeatureComparison {
  code: string;
  name: string;
  description: string;
  basic: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
}

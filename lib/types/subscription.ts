// Subscription types matching backend models exactly

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
  name: string;
  slug: string;
  price_monthly: string;
  price_yearly: string;
  features: Feature[];
  quotas: PlanQuota[];
}

// Exact backend enums (UPPERCASE as returned by Django TextChoices)
export type BillingCycle = "monthly" | "yearly";
export type SubscriptionStatus = "ACTIVE" | "PAST_DUE" | "CANCELED" | "TRIAL";

export interface Subscription {
  id: number;
  plan: Plan;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  start_date: string;
  end_date?: string | null;
}

export interface SubscribeRequest {
  plan_slug: string;
  billing_cycle?: BillingCycle;
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

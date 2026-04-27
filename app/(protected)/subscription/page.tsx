"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { SubscriptionService } from "@/lib/services/subscription-service";
import {
  BillingCycle,
  CreatePaymentResponse,
  CurrentUsageResponse,
  Invoice,
  InvoiceSummaryResponse,
  PaymentTransaction,
  Plan,
  RenewalStatusResponse,
  Subscription,
  SubscriptionQuotasResponse,
  ValidateCouponResponse,
} from "@/lib/types/subscription";
import { goeyToast as toast } from "goey-toast";
import { ConfirmModal } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  Check,
  ChevronRight,
  Clock3,
  CreditCard,
  ExternalLink,
  Gauge,
  Info,
  Loader2,
  ReceiptText,
  RefreshCcw,
  RotateCw,
  ShieldCheck,
  Sparkles,
  TicketPercent,
  TrendingUp,
  WalletCards,
  AlertCircle,
  Crown,
  Zap,
  Shield,
  X,
} from "lucide-react";

const PLAN_HIERARCHY: Record<string, number> = { basic: 1, pro: 2, enterprise: 3 };
const QUOTA_LABELS: Record<string, string> = {
  max_bots: "Bots",
  max_documents: "Documents",
  max_knowledge_sources: "Knowledge Sources",
  max_integrations: "Integrations",
  max_members: "Team Members",
  messages_per_month: "Messages per Month",
  storage_mb: "Storage (MB)",
  api_calls: "API Calls",
};
const METRIC_LABELS: Record<string, string> = {
  messages: "Messages",
  bots: "Bots",
  documents: "Documents",
  storage_mb: "Storage",
  api_calls: "API Calls",
  members: "Members",
  knowledge_sources: "Knowledge Sources",
  integrations: "Integrations",
};
const DEFAULT_PAYMENT_GATEWAY =
  (process.env.NEXT_PUBLIC_DEFAULT_PAYMENT_GATEWAY as
    | "sslcommerz"
    | "stripe"
    | "bkash"
    | "nagad"
    | undefined) || "sslcommerz";
const DEFAULT_PAYMENT_CURRENCY =
  process.env.NEXT_PUBLIC_SUBSCRIPTION_PAYMENT_CURRENCY || "BDT";
const MAX_INVOICES = 6;
const MAX_PAYMENTS = 6;

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: string }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }
  return fallback;
}

function formatDate(date?: string | null): string {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString();
}

function formatMoney(
  value: string | number | null | undefined,
  currency = "USD"
): string {
  const num =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? parseFloat(value)
        : 0;

  if (Number.isNaN(num)) return `${currency} 0.00`;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${currency} ${num.toFixed(2)}`;
  }
}

function calculateSavings(monthly: string, yearly: string): number {
  const monthlyValue = parseFloat(monthly);
  const yearlyValue = parseFloat(yearly);

  if (
    Number.isNaN(monthlyValue) ||
    Number.isNaN(yearlyValue) ||
    monthlyValue <= 0
  ) {
    return 0;
  }

  const yearlyFromMonthly = monthlyValue * 12;
  if (yearlyFromMonthly <= yearlyValue) return 0;
  return Math.round(((yearlyFromMonthly - yearlyValue) / yearlyFromMonthly) * 100);
}

function getPlanPrice(plan: Plan, cycle: BillingCycle): string {
  return cycle === "monthly" ? plan.price_monthly : plan.price_yearly;
}

function toTitleCase(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function statusClass(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
    case "completed":
    case "paid":
      return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700";
    case "trial":
    case "processing":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700";
    case "past_due":
    case "open":
    case "pending":
      return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700";
    case "refunded":
      return "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700";
    case "failed":
    case "cancelled":
    case "canceled":
    case "void":
      return "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  }
}

function isUpgrade(currentSlug: string, newSlug: string): boolean {
  return (PLAN_HIERARCHY[newSlug] ?? 0) > (PLAN_HIERARCHY[currentSlug] ?? 0);
}

function getPlanQuotaLimit(plan: Plan, quotaCode: string): number | null {
  const quota = plan.quotas.find((item) => item.feature_code === quotaCode);
  if (!quota) return null;
  return quota.limit;
}

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [subscriptionQuotas, setSubscriptionQuotas] =
    useState<SubscriptionQuotasResponse | null>(null);
  const [currentUsage, setCurrentUsage] = useState<CurrentUsageResponse | null>(null);
  const [invoiceSummary, setInvoiceSummary] =
    useState<InvoiceSummaryResponse | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentTransaction[]>([]);
  const [renewalStatus, setRenewalStatus] = useState<RenewalStatusResponse | null>(null);

  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [creatingPayment, setCreatingPayment] = useState<string | null>(null);
  const [renewing, setRenewing] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSubscriptionDetails, setShowSubscriptionDetails] = useState(false);
  const [updatingOverage, setUpdatingOverage] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [couponValidation, setCouponValidation] =
    useState<ValidateCouponResponse | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const [lastTransactionId, setLastTransactionId] = useState<string | null>(null);
  const [checkingStatusFor, setCheckingStatusFor] = useState<string | null>(null);
  const [refundingFor, setRefundingFor] = useState<string | null>(null);

  const highestSavings = useMemo(() => {
    return plans.reduce((max, plan) => {
      return Math.max(max, calculateSavings(plan.price_monthly, plan.price_yearly));
    }, 0);
  }, [plans]);

  const sortedPlans = useMemo(() => {
    return [...plans].sort((a, b) => {
      const aRank = PLAN_HIERARCHY[a.slug] ?? 100;
      const bRank = PLAN_HIERARCHY[b.slug] ?? 100;
      if (aRank === bRank) return a.name.localeCompare(b.name);
      return aRank - bRank;
    });
  }, [plans]);

  const alternativePlans = useMemo(() => {
    if (!currentSubscription) return sortedPlans;
    return sortedPlans.filter(
      (plan) => plan.slug !== currentSubscription.plan.slug
    );
  }, [currentSubscription, sortedPlans]);

  const comparisonQuotaCodes = useMemo(() => {
    const codes = new Set<string>();
    sortedPlans.forEach((plan) => {
      plan.quotas.forEach((quota) => codes.add(quota.feature_code));
    });
    return Array.from(codes);
  }, [sortedPlans]);

  const comparisonFeatureCodes = useMemo(() => {
    const codes = new Set<string>();
    sortedPlans.forEach((plan) => {
      plan.features.forEach((feature) => codes.add(feature.code));
    });
    return Array.from(codes);
  }, [sortedPlans]);

  const loadBillingData = useCallback(async (showRefreshing = true) => {
    if (showRefreshing) {
      setRefreshing(true);
    }

    try {
      const [quotaRes, usageRes, summaryRes, invoiceRes, paymentRes, renewalRes] =
        await Promise.allSettled([
          SubscriptionService.getSubscriptionQuotas(),
          SubscriptionService.getCurrentUsage(),
          SubscriptionService.getInvoiceSummary(),
          SubscriptionService.getInvoices({ page: 1, page_size: MAX_INVOICES }),
          SubscriptionService.getPaymentHistory({ limit: MAX_PAYMENTS, offset: 0 }),
          SubscriptionService.getRenewalStatus(),
        ]);

      setSubscriptionQuotas(
        quotaRes.status === "fulfilled" ? quotaRes.value : null
      );
      setCurrentUsage(usageRes.status === "fulfilled" ? usageRes.value : null);
      setInvoiceSummary(summaryRes.status === "fulfilled" ? summaryRes.value : null);
      setInvoices(
        invoiceRes.status === "fulfilled" ? invoiceRes.value.invoices : []
      );
      setPaymentHistory(
        paymentRes.status === "fulfilled" ? paymentRes.value.transactions : []
      );
      setRenewalStatus(
        renewalRes.status === "fulfilled" ? renewalRes.value : null
      );
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansData, subData] = await Promise.allSettled([
        SubscriptionService.getPlans(),
        SubscriptionService.getCurrentSubscription(),
      ]);

      if (plansData.status === "fulfilled") {
        setPlans(plansData.value);
      }
      if (subData.status === "fulfilled") {
        setCurrentSubscription(subData.value);
        setBillingCycle(subData.value.billing_cycle);
      } else {
        setCurrentSubscription(null);
      }

      await loadBillingData(false);
    } catch (error: unknown) {
      toast.error("Failed to load subscription data", {
        description: getErrorMessage(error, "Please try again."),
      });
    } finally {
      setLoading(false);
    }
  }, [loadBillingData]);

  const refreshAllData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [planRes, subscriptionRes] = await Promise.allSettled([
        SubscriptionService.getPlans(),
        SubscriptionService.getCurrentSubscription(),
      ]);

      if (planRes.status === "fulfilled") {
        setPlans(planRes.value);
      }
      if (subscriptionRes.status === "fulfilled") {
        setCurrentSubscription(subscriptionRes.value);
      }

      await loadBillingData(false);
    } finally {
      setRefreshing(false);
    }
  }, [loadBillingData]);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  const handleSubscribe = async (planSlug: string) => {
    setSubscribing(planSlug);
    try {
      const subscription = await SubscriptionService.subscribe({
        plan_slug: planSlug,
        billing_cycle: billingCycle,
      });
      setCurrentSubscription(subscription);
      setBillingCycle(subscription.billing_cycle);
      toast.success("Subscribed", { description: "Your subscription is now active" });
      await loadBillingData(false);
    } catch (error: unknown) {
      toast.error("Subscription failed", {
        description: getErrorMessage(error, "Failed to subscribe."),
      });
    } finally {
      setSubscribing(null);
    }
  };

  const handleCreatePayment = async (plan: Plan) => {
    setCreatingPayment(plan.slug);
    try {
      const amount = getPlanPrice(plan, billingCycle);
      const result = await SubscriptionService.createPayment({
        plan_id: plan.uuid,
        billing_cycle: billingCycle,
        gateway: DEFAULT_PAYMENT_GATEWAY,
        amount,
        currency: DEFAULT_PAYMENT_CURRENCY,
      });

      setLastTransactionId(result.transaction_id);
      toast.success("Payment session ready", {
        description: "Redirecting to secure checkout in a new tab.",
      });
      if (typeof window !== "undefined") {
        window.open(result.redirect_url, "_blank", "noopener,noreferrer");
      }

      await loadBillingData(false);
    } catch (error: unknown) {
      toast.error("Payment session failed", {
        description: getErrorMessage(error, "Could not start payment."),
      });
    } finally {
      setCreatingPayment(null);
    }
  };

  const handleRenewSubscription = async () => {
    setRenewing(true);
    try {
      const result: CreatePaymentResponse = await SubscriptionService.renewSubscription(
        {
          billing_cycle: billingCycle,
        }
      );

      setLastTransactionId(result.transaction_id);
      toast.success("Renewal session created", {
        description: "Continue renewal in checkout.",
      });

      if (typeof window !== "undefined") {
        window.open(result.redirect_url, "_blank", "noopener,noreferrer");
      }

      await loadBillingData(false);
    } catch (error: unknown) {
      toast.error("Renewal failed", {
        description: getErrorMessage(error, "Failed to create renewal session."),
      });
    } finally {
      setRenewing(false);
    }
  };

  const handleCheckPaymentStatus = async (transactionId: string) => {
    setCheckingStatusFor(transactionId);
    try {
      const result = await SubscriptionService.getPaymentStatus(transactionId);

      setPaymentHistory((prev) => {
        const index = prev.findIndex(
          (item) => item.transaction_id === transactionId
        );
        if (index === -1) {
          return [result, ...prev].slice(0, MAX_PAYMENTS);
        }

        const next = [...prev];
        next[index] = {
          ...next[index],
          ...result,
        };
        return next;
      });

      toast.success("Payment status updated", {
        description: `Current status: ${toTitleCase(result.status)}`,
      });
    } catch (error: unknown) {
      toast.error("Status check failed", {
        description: getErrorMessage(error, "Could not fetch payment status."),
      });
    } finally {
      setCheckingStatusFor(null);
    }
  };

  const handleRefund = async (transactionId: string) => {
    setRefundingFor(transactionId);
    try {
      await SubscriptionService.refundPayment(transactionId, {
        reason: "Requested from billing dashboard",
      });
      toast.success("Refund request submitted", {
        description: "Support team will process this refund.",
      });
      await loadBillingData(false);
    } catch (error: unknown) {
      toast.error("Refund request failed", {
        description: getErrorMessage(error, "Could not request refund."),
      });
    } finally {
      setRefundingFor(null);
    }
  };

  const handleValidateCoupon = async () => {
    const normalized = couponCode.trim();
    if (!normalized) {
      toast.error("Enter a coupon code", {
        description: "Provide a code before validation.",
      });
      return;
    }

    setValidatingCoupon(true);
    try {
      const response = await SubscriptionService.validateCoupon({ code: normalized });
      setCouponValidation(response);

      if (response.valid) {
        toast.success("Coupon valid", {
          description: `${response.code} is ready to apply.`,
        });
      } else {
        toast.error("Coupon invalid", {
          description: response.error || "This code cannot be used.",
        });
      }
    } catch (error: unknown) {
      toast.error("Validation failed", {
        description: getErrorMessage(error, "Could not validate coupon."),
      });
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleApplyCoupon = async () => {
    const normalized = couponCode.trim();
    if (!normalized) {
      toast.error("Enter a coupon code", {
        description: "Provide a code before applying.",
      });
      return;
    }

    setApplyingCoupon(true);
    try {
      const response = await SubscriptionService.applyCoupon({ code: normalized });

      if (response.success) {
        toast.success("Coupon applied", {
          description: `${response.code} saved ${formatMoney(
            response.discount_amount,
            response.currency || "USD"
          )}`,
        });
        setCouponCode("");
        setCouponValidation(null);
        await loadBillingData(false);
      } else {
        toast.error("Coupon apply failed", {
          description: response.error || "Could not apply coupon.",
        });
      }
    } catch (error: unknown) {
      toast.error("Coupon apply failed", {
        description: getErrorMessage(error, "Could not apply coupon."),
      });
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    setCanceling(true);
    try {
      const subscription = await SubscriptionService.cancelSubscription();
      setCurrentSubscription(subscription);
      setShowCancelModal(false);
      toast.success("Subscription canceled", {
        description: "Your subscription has been canceled.",
      });
      await loadBillingData(false);
    } catch (error: unknown) {
      toast.error("Cancellation failed", {
        description: getErrorMessage(error, "Failed to cancel subscription."),
      });
    } finally {
      setCanceling(false);
    }
  };

  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case "basic":
        return <Zap className="text-blue-500" size={24} />;
      case "pro":
        return <Sparkles className="text-emerald-500" size={24} />;
      case "enterprise":
        return <Crown className="text-amber-500" size={24} />;
      default:
        return <Shield className="text-gray-500" size={24} />;
    }
  };

  const handleToggleOverage = async () => {
    if (!currentSubscription) return;

    setUpdatingOverage(true);
    try {
      const updated = await SubscriptionService.updateSubscription({
        allow_overage: !currentSubscription.allow_overage,
      });
      setCurrentSubscription(updated);
      toast.success("Subscription updated", {
        description: `Overage ${updated.allow_overage ? "enabled" : "disabled"}.`,
      });
      await loadBillingData(false);
    } catch (error: unknown) {
      toast.error("Update failed", {
        description: getErrorMessage(error, "Could not update subscription."),
      });
    } finally {
      setUpdatingOverage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-linear-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <Loader2 className="animate-spin text-emerald-600" size={28} />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-200/40 dark:border-emerald-800/40 page-pattern bg-linear-to-br from-white via-emerald-50/40 to-cyan-50/40 dark:from-gray-950 dark:via-emerald-950/10 dark:to-cyan-950/10">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-500/20" />
          <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-cyan-300/30 blur-3xl dark:bg-cyan-500/20" />
        </div>

        <div className="relative space-y-10 p-5 lg:p-8">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-emerald-200/70 bg-white/80 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm backdrop-blur-sm dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CreditCard size={16} />
                Production Billing Cockpit
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50 lg:text-4xl">
                Subscription and Coupons Control Center
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-300 lg:text-base">
                All subscription APIs are integrated here: plans, coupon validation,
                coupon apply, usage, quotas, invoices, payment transactions, refund,
                and renewal flows.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="bg-white/80 dark:bg-gray-900/70"
                disabled={refreshing}
                onClick={() => void refreshAllData()}
              >
                {refreshing ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <RefreshCcw size={16} />
                )}
                Refresh Data
              </Button>

              {renewalStatus?.renewal_required && (
                <Button
                  className="bg-linear-to-r from-emerald-500 to-teal-600 text-white"
                  onClick={handleRenewSubscription}
                  disabled={renewing}
                >
                  {renewing ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <RotateCw size={16} />
                  )}
                  Renew Now
                </Button>
              )}
            </div>
          </header>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="glass rounded-2xl border border-emerald-200/50 p-5 card-hover dark:border-emerald-700/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Current Plan
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                {currentSubscription
                  ? toTitleCase(currentSubscription.plan.name)
                  : "No Active Plan"}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={statusClass(currentSubscription?.status || "none")}
                >
                  {toTitleCase(currentSubscription?.status || "inactive")}
                </Badge>
                {currentSubscription && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {toTitleCase(currentSubscription.billing_cycle)}
                  </span>
                )}
              </div>
            </div>

            <div className="glass rounded-2xl border border-cyan-200/50 p-5 card-hover dark:border-cyan-700/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
                Renewal Window
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                {renewalStatus?.days_until_expiry ?? "-"}
              </p>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                Days until expiry
              </p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                End date: {formatDate(renewalStatus?.end_date)}
              </p>
            </div>

            <div className="glass rounded-2xl border border-amber-200/50 p-5 card-hover dark:border-amber-700/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                Current Due
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatMoney(
                  invoiceSummary?.current_due || "0",
                  invoiceSummary?.currency || "USD"
                )}
              </p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Open invoices: {invoiceSummary?.open_invoices ?? 0}
              </p>
            </div>

            <div className="glass rounded-2xl border border-violet-200/50 p-5 card-hover dark:border-violet-700/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
                Lifetime Spend
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatMoney(
                  invoiceSummary?.lifetime_spend || "0",
                  invoiceSummary?.currency || "USD"
                )}
              </p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Paid invoices: {invoiceSummary?.paid_invoices ?? 0}
              </p>
            </div>
          </section>

          {currentSubscription && (
            <section className="rounded-2xl border border-emerald-200/50 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:border-emerald-800/40 dark:bg-gray-900/50">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Active Subscription
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Started {formatDate(currentSubscription.start_date)} · Ends{" "}
                    {formatDate(currentSubscription.end_date)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    className="bg-white dark:bg-gray-900"
                    onClick={() => setShowSubscriptionDetails((prev) => !prev)}
                  >
                    {showSubscriptionDetails ? "See Less" : "See More"}
                  </Button>

                  <Button
                    variant="outline"
                    disabled={updatingOverage}
                    className="bg-white dark:bg-gray-900"
                    onClick={handleToggleOverage}
                  >
                    {updatingOverage ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <ShieldCheck size={16} />
                    )}
                    Overage {currentSubscription.allow_overage ? "On" : "Off"}
                  </Button>

                  {currentSubscription.status !== "CANCELED" && (
                    <Button
                      variant="outline"
                      className="text-rose-600 border-rose-300 hover:bg-rose-50 dark:text-rose-300 dark:border-rose-800 dark:hover:bg-rose-950/40"
                      onClick={handleCancelClick}
                    >
                      <X size={16} />
                      Cancel Subscription
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-200/70 bg-white/80 px-3 py-2 dark:border-gray-700 dark:bg-gray-900/60">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Features</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {currentSubscription.plan.features.length}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200/70 bg-white/80 px-3 py-2 dark:border-gray-700 dark:bg-gray-900/60">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Quota Rules</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {currentSubscription.plan.quotas.length}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200/70 bg-white/80 px-3 py-2 dark:border-gray-700 dark:bg-gray-900/60">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {toTitleCase(currentSubscription.status)}
                  </p>
                </div>
              </div>

              {showSubscriptionDetails && (
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Included Features
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {currentSubscription.plan.features.length > 0 ? (
                        currentSubscription.plan.features.map((feature) => (
                          <Badge
                            key={feature.id}
                            variant="outline"
                            className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                          >
                            <Check size={12} />
                            {feature.name}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No feature metadata is configured for this plan yet.
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Plan Quotas
                    </p>
                    <div className="mt-3 space-y-2">
                      {currentSubscription.plan.quotas.map((quota) => (
                        <div
                          key={quota.feature_code}
                          className="flex items-center justify-between rounded-xl border border-gray-200/70 bg-white/80 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900/60"
                        >
                          <span className="text-gray-600 dark:text-gray-300">
                            {QUOTA_LABELS[quota.feature_code] ||
                              toTitleCase(quota.feature_code)}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {quota.limit > 0 ? quota.limit : "Unlimited"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          <section className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/60">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Plan Upgrade / Switch
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Choose another plan to upgrade or switch instantly.
                </p>
              </div>
              {alternativePlans.length === 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-300">
                  No alternative active plan is configured yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {alternativePlans.slice(0, 3).map((plan) => (
                    <Button
                      key={plan.slug}
                      variant="outline"
                      disabled={subscribing === plan.slug}
                      onClick={() => void handleSubscribe(plan.slug)}
                      className="bg-white dark:bg-gray-900"
                    >
                      {subscribing === plan.slug ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : isUpgrade(currentSubscription?.plan.slug || "", plan.slug) ? (
                        <ArrowUpCircle size={14} />
                      ) : (
                        <ArrowDownCircle size={14} />
                      )}
                      {toTitleCase(plan.name)}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section id="plans" className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Plans and Promotions
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Integrates: list plans, subscribe, create payment, validate coupon,
                  apply coupon.
                </p>
              </div>

              <div className="inline-flex items-center rounded-xl border border-gray-200 bg-white/80 p-1 shadow-sm dark:border-gray-700 dark:bg-gray-900/70">
                <Button
                  variant="ghost"
                  onClick={() => setBillingCycle("monthly")}
                  className={
                    billingCycle === "monthly"
                      ? "bg-white shadow-sm dark:bg-gray-800"
                      : "text-gray-500"
                  }
                >
                  Monthly
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setBillingCycle("yearly")}
                  className={
                    billingCycle === "yearly"
                      ? "bg-white shadow-sm dark:bg-gray-800"
                      : "text-gray-500"
                  }
                >
                  Yearly
                  {highestSavings > 0 && (
                    <Badge className="ml-2 bg-emerald-500 text-white">
                      Save {highestSavings}%
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 stagger-children">
                {sortedPlans.map((plan) => {
                  const isCurrentPlan =
                    currentSubscription?.plan.slug === plan.slug &&
                    currentSubscription.status !== "CANCELED";
                  const price = getPlanPrice(plan, billingCycle);
                  const hasPrice = parseFloat(price) > 0;
                  const yearlySavings = calculateSavings(
                    plan.price_monthly,
                    plan.price_yearly
                  );

                  return (
                    <div
                      key={plan.id}
                      className={`relative rounded-2xl border p-5 shadow-sm transition-all card-hover ${
                        isCurrentPlan
                          ? "border-emerald-400 bg-emerald-50/70 dark:border-emerald-700 dark:bg-emerald-950/20"
                          : "border-gray-200 bg-white/85 dark:border-gray-700 dark:bg-gray-900/70"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                          {getPlanIcon(plan.slug)}
                        </div>
                        {isCurrentPlan ? (
                          <Badge className="bg-emerald-500 text-white">
                            Current
                          </Badge>
                        ) : (
                          <Badge variant="outline">{toTitleCase(plan.slug)}</Badge>
                        )}
                      </div>

                      <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-gray-100">
                        {toTitleCase(plan.name)}
                      </h3>
                      <p className="mt-1 min-h-10 text-sm text-gray-500 dark:text-gray-400">
                        {plan.description || "Smart plan for your workspace growth."}
                      </p>

                      <div className="mt-4">
                        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                          {formatMoney(price, invoiceSummary?.currency || "USD")}
                          <span className="ml-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                            /{billingCycle === "monthly" ? "mo" : "yr"}
                          </span>
                        </p>
                        {billingCycle === "yearly" && yearlySavings > 0 && (
                          <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            Save {yearlySavings}% on annual billing
                          </p>
                        )}
                      </div>

                      <div className="mt-4 space-y-2">
                        {plan.features.slice(0, 4).map((feature) => (
                          <div key={feature.id} className="flex items-start gap-2 text-sm">
                            <Check className="mt-0.5 text-emerald-500" size={14} />
                            <span className="text-gray-700 dark:text-gray-300">
                              {feature.name}
                            </span>
                          </div>
                        ))}
                      </div>

                      {plan.quotas.length > 0 && (
                        <div className="mt-4 rounded-xl border border-gray-200/70 bg-white/70 p-3 dark:border-gray-700 dark:bg-gray-900/40">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Plan Limits
                          </p>
                          <div className="mt-2 space-y-1.5">
                            {plan.quotas.slice(0, 4).map((quota) => (
                              <div
                                key={`${plan.slug}-${quota.feature_code}`}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="text-gray-600 dark:text-gray-300">
                                  {QUOTA_LABELS[quota.feature_code] || toTitleCase(quota.feature_code)}
                                </span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                  {quota.limit > 0 ? quota.limit : "Unlimited"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-5 space-y-2">
                        {isCurrentPlan ? (
                          <Button className="w-full" disabled>
                            <Check size={16} />
                            Already Active
                          </Button>
                        ) : (
                          <>
                            <Button
                              className="w-full bg-linear-to-r from-emerald-500 to-teal-600 text-white"
                              disabled={subscribing === plan.slug}
                              onClick={() => void handleSubscribe(plan.slug)}
                            >
                              {subscribing === plan.slug ? (
                                <Loader2 className="animate-spin" size={16} />
                              ) : currentSubscription ? (
                                isUpgrade(currentSubscription.plan.slug, plan.slug) ? (
                                  <ArrowUpCircle size={16} />
                                ) : (
                                  <ArrowDownCircle size={16} />
                                )
                              ) : (
                                <ChevronRight size={16} />
                              )}
                              {currentSubscription
                                ? isUpgrade(currentSubscription.plan.slug, plan.slug)
                                  ? "Upgrade Plan"
                                  : "Switch Plan"
                                : "Activate Plan"}
                            </Button>

                            {hasPrice && (
                              <Button
                                variant="outline"
                                className="w-full bg-white dark:bg-gray-900"
                                disabled={creatingPayment === plan.slug}
                                onClick={() => void handleCreatePayment(plan)}
                              >
                                {creatingPayment === plan.slug ? (
                                  <Loader2 className="animate-spin" size={16} />
                                ) : (
                                  <WalletCards size={16} />
                                )}
                                Pay via {toTitleCase(DEFAULT_PAYMENT_GATEWAY)}
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <aside className="self-start h-fit rounded-2xl border border-gray-200 bg-white/85 p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900/70">
                <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <TicketPercent className="text-emerald-500" size={18} />
                  <h3 className="text-lg font-semibold">Coupon Studio</h3>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Validate first, then apply to your current subscription.
                </p>

                <div className="mt-4 space-y-3">
                  <Input
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      disabled={validatingCoupon}
                      onClick={() => void handleValidateCoupon()}
                    >
                      {validatingCoupon ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Info size={16} />
                      )}
                      Validate
                    </Button>
                    <Button
                      className="bg-linear-to-r from-emerald-500 to-teal-600 text-white"
                      disabled={applyingCoupon}
                      onClick={() => void handleApplyCoupon()}
                    >
                      {applyingCoupon ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <TicketPercent size={16} />
                      )}
                      Apply
                    </Button>
                  </div>
                </div>

                {couponValidation && (
                  <div
                    className={`mt-4 rounded-xl border p-3 text-sm ${
                      couponValidation.valid
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200"
                        : "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-200"
                    }`}
                  >
                    <p className="font-semibold">
                      {couponValidation.valid
                        ? `${couponValidation.code} is valid`
                        : "Coupon is not valid"}
                    </p>
                    {couponValidation.valid ? (
                      <p className="mt-1">
                        {couponValidation.discount_type === "percentage"
                          ? `${couponValidation.discount_value}% off`
                          : `${formatMoney(couponValidation.discount_value)} off`} ·{" "}
                        {couponValidation.duration === "repeating"
                          ? `for ${couponValidation.duration_in_months || 0} months`
                          : toTitleCase(couponValidation.duration || "once")}
                      </p>
                    ) : (
                      <p className="mt-1">{couponValidation.error}</p>
                    )}
                  </div>
                )}

                {lastTransactionId && (
                  <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50/70 p-3 dark:border-cyan-800 dark:bg-cyan-900/20">
                    <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
                      Last Payment Transaction
                    </p>
                    <p className="mt-1 truncate text-sm text-gray-700 dark:text-gray-300">
                      {lastTransactionId}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      disabled={checkingStatusFor === lastTransactionId}
                      onClick={() => void handleCheckPaymentStatus(lastTransactionId)}
                    >
                      {checkingStatusFor === lastTransactionId ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <Clock3 size={14} />
                      )}
                      Check Status
                    </Button>
                  </div>
                )}
              </aside>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white/85 p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900/70">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Plan Comparison
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  All values are rendered from backend plan features and quota limits.
                </p>
              </div>
              <Badge variant="outline" className="w-fit">
                {billingCycle === "monthly" ? "Monthly View" : "Yearly View"}
              </Badge>
            </div>

            <div className="mt-4 overflow-x-auto">
              <div className="min-w-195">
                <div className="grid grid-cols-[220px_repeat(5,minmax(140px,1fr))] gap-2">
                  <div className="rounded-lg border border-gray-200/70 bg-gray-50/70 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300">
                    Plans
                  </div>
                  {sortedPlans.slice(0, 5).map((plan) => (
                    <div
                      key={`comparison-head-${plan.slug}`}
                      className="rounded-lg border border-gray-200/70 bg-gray-50/70 px-3 py-2 dark:border-gray-700 dark:bg-gray-900/60"
                    >
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {toTitleCase(plan.name)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatMoney(getPlanPrice(plan, billingCycle), invoiceSummary?.currency || "USD")} /{billingCycle === "monthly" ? "mo" : "yr"}
                      </p>
                    </div>
                  ))}

                  <div className="col-span-6 mt-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Limitations
                  </div>

                  {comparisonQuotaCodes.map((quotaCode) => (
                    <Fragment key={`quota-row-${quotaCode}`}>
                      <div
                        key={`quota-label-${quotaCode}`}
                        className="rounded-lg border border-gray-200/70 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300"
                      >
                        {QUOTA_LABELS[quotaCode] || toTitleCase(quotaCode)}
                      </div>
                      {sortedPlans.slice(0, 5).map((plan) => {
                        const limit = getPlanQuotaLimit(plan, quotaCode);
                        return (
                          <div
                            key={`quota-${quotaCode}-${plan.slug}`}
                            className="rounded-lg border border-gray-200/70 bg-white px-3 py-2 text-sm font-medium text-gray-900 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100"
                          >
                            {typeof limit === "number" ? (limit > 0 ? limit : "Unlimited") : "-"}
                          </div>
                        );
                      })}
                    </Fragment>
                  ))}

                  <div className="col-span-6 mt-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Features
                  </div>

                  {comparisonFeatureCodes.map((featureCode) => (
                    <Fragment key={`feature-row-${featureCode}`}>
                      <div
                        key={`feature-label-${featureCode}`}
                        className="rounded-lg border border-gray-200/70 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300"
                      >
                        {toTitleCase(featureCode)}
                      </div>
                      {sortedPlans.slice(0, 5).map((plan) => {
                        const enabled = plan.features.some((item) => item.code === featureCode);
                        return (
                          <div
                            key={`feature-${featureCode}-${plan.slug}`}
                            className="rounded-lg border border-gray-200/70 bg-white px-3 py-2 text-sm font-medium dark:border-gray-700 dark:bg-gray-900/60"
                          >
                            {enabled ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-300">
                                <Check size={14} /> Enabled
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        );
                      })}
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white/85 p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900/70">
              <div className="flex items-center gap-2">
                <Gauge className="text-emerald-500" size={18} />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Quota Health
                </h3>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Integrates: subscription quota endpoint.
              </p>

              {subscriptionQuotas ? (
                <div className="mt-4 space-y-3">
                  {Object.entries(subscriptionQuotas.quotas).map(([code, value]) => {
                    const usedLabel = typeof value.used === "number" ? value.used : 0;
                    const limitLabel =
                      typeof value.limit === "number" ? value.limit : "Unlimited";

                    return (
                      <div
                        key={code}
                        className="rounded-xl border border-gray-200/80 bg-white/80 p-3 dark:border-gray-700 dark:bg-gray-900/70"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {QUOTA_LABELS[code] || toTitleCase(code)}
                          </span>
                          <span className="text-gray-600 dark:text-gray-300">
                            {usedLabel} / {limitLabel}
                          </span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                          <div
                            className="h-full rounded-full bg-linear-to-r from-emerald-500 to-cyan-500 transition-all"
                            style={{ width: `${Math.min(value.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  Quota data is not available yet.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white/85 p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900/70">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-cyan-500" size={18} />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Current Usage
                </h3>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Integrates: current usage endpoint.
              </p>

              {currentUsage ? (
                <>
                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    Period: {formatDate(currentUsage.period.start)} -{" "}
                    {formatDate(currentUsage.period.end)}
                  </p>

                  <div className="mt-3 space-y-3">
                    {Object.entries(currentUsage.usage).map(([metricCode, value]) => (
                      <div
                        key={metricCode}
                        className="rounded-xl border border-gray-200/80 bg-white/80 p-3 dark:border-gray-700 dark:bg-gray-900/70"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {METRIC_LABELS[metricCode] || toTitleCase(metricCode)}
                          </span>
                          <span className="text-gray-600 dark:text-gray-300">
                            {value.used} / {value.limit ?? "Unlimited"}
                          </span>
                        </div>
                        {value.overage > 0 && (
                          <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-300">
                            Overage: {value.overage}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  Usage metrics are not available yet.
                </p>
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white/85 p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900/70">
              <div className="flex items-center gap-2">
                <ReceiptText className="text-amber-500" size={18} />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Invoices
                </h3>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Integrates: invoice list, invoice detail, invoice summary.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                <div className="rounded-xl border border-gray-200/80 bg-white/80 p-3 dark:border-gray-700 dark:bg-gray-900/70">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                  <p className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
                    {invoiceSummary?.total_invoices ?? 0}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200/80 bg-white/80 p-3 dark:border-gray-700 dark:bg-gray-900/70">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Open</p>
                  <p className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
                    {invoiceSummary?.open_invoices ?? 0}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200/80 bg-white/80 p-3 dark:border-gray-700 dark:bg-gray-900/70">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Overdue</p>
                  <p className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
                    {invoiceSummary?.overdue_invoices ?? 0}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200/80 bg-white/80 p-3 dark:border-gray-700 dark:bg-gray-900/70">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Paid</p>
                  <p className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
                    {invoiceSummary?.paid_invoices ?? 0}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {invoices.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No invoices found.
                  </p>
                ) : (
                  invoices.map((invoice) => {
                    const invoiceUrl = invoice.pdf_url || invoice.hosted_invoice_url;
                    return (
                      <div
                        key={invoice.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200/80 bg-white/80 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900/70"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {invoice.invoice_number}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Due {formatDate(invoice.due_date)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={statusClass(invoice.status)}
                          >
                            {toTitleCase(invoice.status)}
                          </Badge>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatMoney(invoice.total, invoice.currency)}
                          </span>
                          {invoiceUrl && (
                            <a
                              href={invoiceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                            >
                              Open
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white/85 p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900/70">
              <div className="flex items-center gap-2">
                <WalletCards className="text-violet-500" size={18} />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Payment Transactions
                </h3>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Integrates: payment create, status, history, refund, renewal.
              </p>

              <div className="mt-4 space-y-2">
                {paymentHistory.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No payment transactions available.
                  </p>
                ) : (
                  paymentHistory.map((payment) => (
                    <div
                      key={payment.transaction_id}
                      className="rounded-xl border border-gray-200/80 bg-white/80 p-3 dark:border-gray-700 dark:bg-gray-900/70"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {payment.plan_name || "Subscription Payment"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(payment.created_at)} · {toTitleCase(payment.gateway)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={statusClass(payment.status)}
                          >
                            {toTitleCase(payment.status)}
                          </Badge>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {formatMoney(payment.amount, payment.currency)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={checkingStatusFor === payment.transaction_id}
                          onClick={() =>
                            void handleCheckPaymentStatus(payment.transaction_id)
                          }
                        >
                          {checkingStatusFor === payment.transaction_id ? (
                            <Loader2 className="animate-spin" size={14} />
                          ) : (
                            <Clock3 size={14} />
                          )}
                          Check Status
                        </Button>

                        {payment.status === "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={refundingFor === payment.transaction_id}
                            onClick={() => void handleRefund(payment.transaction_id)}
                          >
                            {refundingFor === payment.transaction_id ? (
                              <Loader2 className="animate-spin" size={14} />
                            ) : (
                              <RotateCw size={14} />
                            )}
                            Request Refund
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white/85 p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900/70">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-300">
                  <Calendar size={16} />
                  <span className="text-sm font-medium">Renewal Guard</span>
                </div>
                <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Manual renewal status and actions
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {renewalStatus
                    ? `Plan ${renewalStatus.plan_name} expires on ${formatDate(
                        renewalStatus.end_date
                      )}. Auto-renew: ${renewalStatus.auto_renew ? "On" : "Off"}.`
                    : "Renewal status is not available for this workspace."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={statusClass(
                    renewalStatus?.renewal_required ? "pending" : "active"
                  )}
                >
                  {renewalStatus?.renewal_required
                    ? "Renewal Required"
                    : "Healthy"}
                </Badge>
                <Button
                  className="bg-linear-to-r from-emerald-500 to-teal-600 text-white"
                  disabled={renewing}
                  onClick={handleRenewSubscription}
                >
                  {renewing ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <RotateCw size={16} />
                  )}
                  Renew Subscription
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Cancel Subscription Confirmation Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelConfirm}
        title="Cancel Subscription"
        description="Are you sure you want to cancel your subscription? You will lose access to all premium features at the end of your current billing cycle."
        confirmText="Yes, Cancel"
        cancelText="Keep Subscription"
        confirmVariant="danger"
        isLoading={canceling}
        icon={<AlertCircle size={28} className="text-red-500" />}
      />
    </div>
  );
}

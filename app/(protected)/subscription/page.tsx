"use client";

import { useState, useEffect } from "react";
import { SubscriptionService } from "@/lib/services/subscription-service";
import { Plan, Subscription, BillingCycle, FeatureComparison } from "@/lib/types/subscription";
import { toast } from "react-toastify";
import { ConfirmModal } from "@/components/common";
import {
  Check,
  CreditCard,
  Loader2,
  AlertCircle,
  Crown,
  Star,
  Users,
  Zap,
  Shield,
  Sparkles,
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
  Info,
  X,
  ChevronDown,
} from "lucide-react";

// Feature comparison data for the UI
const featureComparisons: FeatureComparison[] = [
  {
    code: "basic_reporting",
    name: "Basic Reporting",
    description: "Essential analytics and basic reports",
    basic: true,
    pro: true,
    enterprise: true,
  },
  {
    code: "adv_reporting",
    name: "Advanced Analytics",
    description: "Detailed insights, custom dashboards, and export features",
    basic: false,
    pro: true,
    enterprise: true,
  },
  {
    code: "team_mgmt",
    name: "Team Management",
    description: "Invite team members, role-based permissions",
    basic: false,
    pro: true,
    enterprise: true,
  },
  {
    code: "api_access",
    name: "API Access",
    description: "Full REST API access for integrations",
    basic: false,
    pro: false,
    enterprise: true,
  },
  {
    code: "max_members",
    name: "Team Members",
    description: "Maximum number of team members allowed",
    basic: "1 member",
    pro: "5 members",
    enterprise: "20 members",
  },
  {
    code: "priority_support",
    name: "Priority Support",
    description: "Dedicated support with faster response times",
    basic: false,
    pro: "Email support",
    enterprise: "Priority + Phone",
  },
];

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCurrentPlan, setShowCurrentPlan] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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
      }
    } catch {
      // Plans are public, subscription might 404 if none exists
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planSlug: string) => {
    setSubscribing(planSlug);
    try {
      const subscription = await SubscriptionService.subscribe({
        plan_slug: planSlug,
        billing_cycle: billingCycle,
      });
      setCurrentSubscription(subscription);
      toast.success("Subscribed successfully!");
    } catch (error: any) {
      toast.error(error?.message || "Failed to subscribe");
    } finally {
      setSubscribing(null);
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
      toast.success("Subscription canceled successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to cancel subscription");
    } finally {
      setCanceling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-700 border border-green-200",
      trial: "bg-blue-100 text-blue-700 border border-blue-200",
      past_due: "bg-yellow-100 text-yellow-700 border border-yellow-200",
      canceled: "bg-red-100 text-red-700 border border-red-200",
    };
    
    const icons = {
      active: <Check size={12} />,
      trial: <Sparkles size={12} />,
      past_due: <AlertCircle size={12} />,
      canceled: <X size={12} />,
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {status === "past_due" ? "Past Due" : status.toUpperCase()}
      </span>
    );
  };

  const getPlanIcon = (slug: string) => {
    switch(slug) {
      case "basic": return <Zap className="text-blue-500" size={24} />;
      case "pro": return <Star className="text-violet-500" size={24} />;
      case "enterprise": return <Crown className="text-yellow-500" size={24} />;
      default: return <Shield className="text-gray-500" size={24} />;
    }
  };

  const calculateSavings = (monthlyPrice: string, yearlyPrice: string) => {
    if (!monthlyPrice || !yearlyPrice) return 0;
    const monthlyVal = parseFloat(monthlyPrice);
    const yearlyVal = parseFloat(yearlyPrice);
    if (isNaN(monthlyVal) || isNaN(yearlyVal) || monthlyVal <= 0) return 0;
    const annualFromMonthly = monthlyVal * 12;
    if (annualFromMonthly <= yearlyVal) return 0;
    const savings = ((annualFromMonthly - yearlyVal) / annualFromMonthly) * 100;
    return Math.round(savings);
  };

  const getOverallMaxSavings = () => {
    let maxSavings = 0;
    for (const plan of plans) {
      const saving = calculateSavings(plan.price_monthly, plan.price_yearly);
      if (saving > maxSavings) maxSavings = saving;
    }
    return maxSavings;
  };

  const capitalizeName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="animate-spin text-violet-600 mx-auto mb-4" size={40} />
          <p className="text-gray-500">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
            <CreditCard className="text-white" size={24} />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
            Subscription Plans
          </h1>
        </div>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Choose the perfect plan for your AI chatbot needs. Upgrade or downgrade anytime.
        </p>
      </div>

      {/* Current Subscription Card */}
      {currentSubscription && (
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-2xl mb-8 relative overflow-hidden">
          <button
            onClick={() => setShowCurrentPlan(!showCurrentPlan)}
            className="w-full p-6 flex items-center justify-between hover:bg-violet-100/50 transition-colors cursor-pointer rounded-2xl"
          >
            <div className="flex items-center gap-4">
              {getPlanIcon(currentSubscription.plan.slug)}
              <div className="text-left">
                <h2 className="text-xl font-bold text-gray-900">
                  {capitalizeName(currentSubscription.plan.name)} Plan
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  {getStatusBadge(currentSubscription.status)}
                  <span className="text-sm text-gray-600 capitalize">
                    {currentSubscription.billing_cycle} billing
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {showCurrentPlan ? "Hide Details" : "Show Details"}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-gray-600 transition-transform ${showCurrentPlan ? "rotate-180" : ""}`}
              />
            </div>
          </button>
          
          {showCurrentPlan && (
            <div className="px-6 pb-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="grid md:grid-cols-2 gap-8 relative">
                <div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/70 rounded-lg p-3">
                      <div className="text-xs text-gray-500 font-medium">Started</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {new Date(currentSubscription.start_date).toLocaleDateString()}
                      </div>
                    </div>
                    {currentSubscription.end_date && (
                      <div className="bg-white/70 rounded-lg p-3">
                        <div className="text-xs text-gray-500 font-medium">Ends</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {new Date(currentSubscription.end_date).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {currentSubscription.plan.features.map((feature) => (
                      <span
                        key={feature.id}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-violet-100 text-violet-700 text-xs font-medium rounded-full"
                      >
                        <Check size={10} />
                        {feature.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col justify-between">
                  <div className="space-y-3">
                    {currentSubscription.plan.quotas.map((quota) => (
                      <div key={quota.id} className="flex items-center justify-between bg-white/70 rounded-lg p-3">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {quota.feature_code.replace(/_/g, " ")}
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {quota.limit === 0 ? "Unlimited" : quota.limit}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {currentSubscription.status !== "canceled" && (
                    <button
                      onClick={handleCancelClick}
                      disabled={canceling}
                      className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <X size={16} />
                      Cancel Subscription
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center mb-8">
        <div className="bg-gray-100 rounded-xl p-1 flex items-center">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              billingCycle === "monthly"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              billingCycle === "yearly"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="flex items-center gap-2">
              Yearly
              {getOverallMaxSavings() > 0 && (
                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                  Save {getOverallMaxSavings()}%
                </span>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Plans Available</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            No subscription plans are currently available. Please contact support or try again later.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
            {plans.map((plan) => {
              const isCurrentPlan =
                currentSubscription?.plan.slug === plan.slug &&
                currentSubscription?.status !== "canceled";
              const price = billingCycle === "monthly" ? plan.price_monthly : plan.price_yearly;
              const isPopular = plan.slug === "pro";
              const isEnterprise = plan.slug === "enterprise";
              
              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-2xl border-2 p-8 flex flex-col transform transition-all hover:scale-105 ${
                    isPopular
                      ? "border-violet-500 shadow-2xl shadow-violet-500/25"
                      : isCurrentPlan
                        ? "border-green-400 shadow-xl shadow-green-500/20"
                        : "border-gray-200 hover:border-gray-300 shadow-lg"
                  }`}
                >
                  {isCurrentPlan && isPopular ? (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                        ✓ Current Plan
                      </div>
                      <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                        🚀 Most Popular
                      </div>
                    </div>
                  ) : isCurrentPlan ? (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold px-6 py-2 rounded-full shadow-lg">
                        ✓ Current Plan
                      </div>
                    </div>
                  ) : isPopular ? (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-bold px-6 py-2 rounded-full shadow-lg">
                        🚀 Most Popular
                      </div>
                    </div>
                  ) : null}

                  <div className="text-center mb-8">
                    <div className="mb-4">
                      {getPlanIcon(plan.slug)}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {capitalizeName(plan.name)}
                    </h3>
                    <div className="mb-4">
                      <span className="text-5xl font-bold text-gray-900">
                        ${parseFloat(price).toFixed(0)}
                      </span>
                      <span className="text-gray-500 text-lg">
                        /{billingCycle === "monthly" ? "month" : "year"}
                      </span>
                    </div>
                    {billingCycle === "yearly" && (
                      <div className="text-sm text-green-600 font-semibold">
                        Save ${(parseFloat(plan.price_monthly) * 12 - parseFloat(plan.price_yearly)).toFixed(0)} per year
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="space-y-4 mb-8">
                      {plan.features.map((feature) => (
                        <div key={feature.id} className="flex items-start gap-3">
                          <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                            <Check size={12} className="text-green-600" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              {feature.name}
                            </span>
                            {feature.description && (
                              <p className="text-xs text-gray-500 mt-1">
                                {feature.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {plan.quotas.map((quota) => (
                        <div key={quota.id} className="flex items-start gap-3">
                          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                            <Users size={10} className="text-blue-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {quota.limit === 0 ? "Unlimited" : quota.limit}{" "}
                            {quota.feature_code.replace(/_/g, " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto">
                    {isCurrentPlan ? (
                      <div className="w-full py-4 text-center text-sm font-semibold text-green-700 bg-green-50 rounded-xl border border-green-200">
                        <Check className="inline mr-2" size={16} />
                        Your Current Plan
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSubscribe(plan.slug)}
                        disabled={subscribing === plan.slug}
                        className={`w-full py-4 text-sm font-bold rounded-xl transition-all transform disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 cursor-pointer ${
                          isPopular
                            ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg hover:shadow-xl"
                            : isEnterprise
                              ? "bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg hover:shadow-xl"
                              : "bg-gray-900 text-white hover:bg-gray-800 shadow-lg"
                        }`}
                      >
                        {subscribing === plan.slug ? (
                          <Loader2 className="animate-spin inline-block mr-2" size={16} />
                        ) : (
                          <>
                            {currentSubscription && currentSubscription.plan.slug !== plan.slug ? (
                              <>
                                {isUpgrade(currentSubscription.plan.slug, plan.slug) ? (
                                  <ArrowUpCircle className="inline mr-2" size={16} />
                                ) : (
                                  <ArrowDownCircle className="inline mr-2" size={16} />
                                )}
                                {isUpgrade(currentSubscription.plan.slug, plan.slug) ? "Upgrade" : "Switch"} to {capitalizeName(plan.name)}
                              </>
                            ) : (
                              <>Get Started with {capitalizeName(plan.name)}</>
                            )}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Feature Comparison Toggle */}
          <div className="text-center mb-8">
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors cursor-pointer"
            >
              <Info size={16} />
              {showComparison ? "Hide" : "Show"} Detailed Comparison
            </button>
          </div>

          {/* Detailed Feature Comparison Table */}
          {showComparison && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-8 text-center border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Detailed Feature Comparison
                </h3>
                <p className="text-gray-600">
                  Compare all features across our subscription plans
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-6 px-8 text-sm font-semibold text-gray-900">
                        Features
                      </th>
                      {plans.map((plan) => (
                        <th key={plan.id} className="text-center py-6 px-6 text-sm font-semibold text-gray-900">
                          <div className="flex flex-col items-center gap-2">
                            {getPlanIcon(plan.slug)}
                            {plan.name}
                            <span className="text-violet-600 font-bold">
                              ${parseFloat(billingCycle === "monthly" ? plan.price_monthly : plan.price_yearly).toFixed(0)}
                              <span className="text-xs text-gray-500 font-normal">
                                /{billingCycle === "monthly" ? "mo" : "yr"}
                              </span>
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {featureComparisons.map((feature, index) => (
                      <tr key={feature.code} className={`border-b border-gray-100 ${index % 2 === 0 ? "bg-gray-50/50" : ""}`}>
                        <td className="py-4 px-8">
                          <div>
                            <div className="font-medium text-gray-900">{feature.name}</div>
                            <div className="text-sm text-gray-500 mt-1">{feature.description}</div>
                          </div>
                        </td>
                        {plans.map((plan) => {
                          const planSlug = plan.slug as keyof typeof feature;
                          const hasFeature = feature[planSlug];
                          
                          return (
                            <td key={plan.id} className="py-4 px-6 text-center">
                              {typeof hasFeature === "boolean" ? (
                                hasFeature ? (
                                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                                    <Check size={14} className="text-white" />
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                                    <X size={14} className="text-gray-400" />
                                  </div>
                                )
                              ) : (
                                <span className="text-sm font-medium text-gray-900">{hasFeature}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* FAQ Section */}
      <div className="mt-16 text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Frequently Asked Questions
        </h3>
        <div className="grid md:grid-cols-2 gap-6 mt-8 text-left max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h4 className="font-semibold text-gray-900 mb-2">Can I change my plan anytime?</h4>
            <p className="text-sm text-gray-600">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h4 className="font-semibold text-gray-900 mb-2">What happens when I cancel?</h4>
            <p className="text-sm text-gray-600">
              Your subscription remains active until the end of your current billing period, then reverts to our free tier.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h4 className="font-semibold text-gray-900 mb-2">Do you offer refunds?</h4>
            <p className="text-sm text-gray-600">
              We offer a 30-day money-back guarantee for all new subscriptions. Contact support for assistance.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h4 className="font-semibold text-gray-900 mb-2">How does billing work?</h4>
            <p className="text-sm text-gray-600">
              You're charged at the beginning of each billing cycle. Annual plans are billed once per year upfront.
            </p>
          </div>
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

// Helper function to determine if switching to a new plan is an upgrade
function isUpgrade(currentSlug: string, newSlug: string): boolean {
  const planHierarchy = { basic: 1, pro: 2, enterprise: 3 };
  return planHierarchy[newSlug as keyof typeof planHierarchy] > planHierarchy[currentSlug as keyof typeof planHierarchy];
}

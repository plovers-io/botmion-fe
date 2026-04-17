"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { type IconSvgElement, HugeiconsIcon } from "@hugeicons/react";
import {
  Activity01Icon,
  BotIcon,
  CalendarAnalysisIcon,
  ChartBarLineIcon,
  Loading01Icon,
  SparklesIcon,
  RefreshIcon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { goeyToast as toast } from "goey-toast";
import { ChatbotService } from "@/lib/services/chatbot-service";
import { IntegrationService } from "@/lib/services/integration-service";
import type { Chatbot } from "@/lib/types/chatbot";
import type {
  TokenUsageAccountBreakdown,
  TokenTypeFilter,
  TokenUsageAnalyticsResponse,
  TokenUsageBreakdownPagination,
  TokenUsageChatbotBreakdown,
} from "@/lib/types/integration";

const tokenTypeOptions: Array<{ label: string; value: TokenTypeFilter }> = [
  { label: "Input Tokens", value: "input" },
  { label: "Output Tokens", value: "output" },
  { label: "Total Tokens", value: "total" },
];

const quickRanges = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

const breakdownPageSize = 4;

const emptyBreakdownPagination: TokenUsageBreakdownPagination = {
  count: 0,
  page: 1,
  page_size: breakdownPageSize,
  total_pages: 1,
  has_next: false,
  has_previous: false,
};

const emptyState: TokenUsageAnalyticsResponse = {
  filters: {
    chatbot_id: null,
    token_type: "total",
    start_date: null,
    end_date: null,
  },
  summary: {
    input_tokens: 0,
    output_tokens: 0,
    total_tokens: 0,
    request_count: 0,
  },
  top_account: null,
  top_chatbot: null,
  account_breakdown: [],
  account_breakdown_pagination: emptyBreakdownPagination,
  chatbot_breakdown: [],
  chatbot_breakdown_pagination: emptyBreakdownPagination,
  timeseries: [],
};

function formatNumber(value: number) {
  return value.toLocaleString();
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDateLabel(date: string) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function getSelectedTokenValue(
  row: TokenUsageAccountBreakdown | TokenUsageChatbotBreakdown,
  tokenType: TokenTypeFilter
) {
  if (tokenType === "input") return row.input_tokens;
  if (tokenType === "output") return row.output_tokens;
  return row.total_tokens;
}

function getSelectedSummaryValue(
  summary: TokenUsageAnalyticsResponse["summary"],
  tokenType: TokenTypeFilter
) {
  if (tokenType === "input") return summary.input_tokens;
  if (tokenType === "output") return summary.output_tokens;
  return summary.total_tokens;
}

function formatShare(value: number, total: number) {
  if (!total) return "0%";
  return new Intl.NumberFormat("en", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value / total);
}

function AppIcon({
  icon,
  className,
  size = 20,
}: {
  icon: IconSvgElement;
  className?: string;
  size?: number;
}) {
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={1.8} className={className} />;
}

function MetricCard({
  title,
  value,
  description,
  icon,
  accent,
}: {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <Card className="border-white/60 bg-white/85 shadow-sm backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-900/60">
      <CardContent className="p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-950 dark:text-gray-50">
              {value}
            </p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>
          </div>
          <div className={cn("rounded-2xl p-2.5 shadow-inner", accent)}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function BreakdownPagination({
  itemLabel,
  pagination,
  loading,
  onPrevious,
  onNext,
}: {
  itemLabel: string;
  pagination: TokenUsageBreakdownPagination;
  loading: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-t border-gray-200/80 pt-3 dark:border-gray-800">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Page {pagination.page} of {pagination.total_pages} · {formatNumber(pagination.count)} {itemLabel}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 cursor-pointer rounded-lg px-3"
          disabled={loading || !pagination.has_previous}
          onClick={onPrevious}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 cursor-pointer rounded-lg px-3"
          disabled={loading || !pagination.has_next}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function SectionEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 text-center dark:border-gray-700 dark:bg-gray-800/40">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{title}</p>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}

export default function TokenTrackerPage() {
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [data, setData] = useState<TokenUsageAnalyticsResponse>(emptyState);
  const [loading, setLoading] = useState(true);

  const [chatbotId, setChatbotId] = useState<number | "">("");
  const [tokenType, setTokenType] = useState<TokenTypeFilter>("total");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [accountPage, setAccountPage] = useState(1);
  const [chatbotPage, setChatbotPage] = useState(1);

  const selectedLabel = useMemo(() => {
    return tokenTypeOptions.find((item) => item.value === tokenType)?.label || "Total Tokens";
  }, [tokenType]);

  const loadUsage = useCallback(async (filters?: {
    chatbotId?: number | "";
    tokenType?: TokenTypeFilter;
    startDate?: string;
    endDate?: string;
    accountPage?: number;
    chatbotPage?: number;
  }) => {
    setLoading(true);
    try {
      const activeChatbotId = filters?.chatbotId ?? chatbotId;
      const activeTokenType = filters?.tokenType ?? tokenType;
      const activeStartDate = filters?.startDate ?? startDate;
      const activeEndDate = filters?.endDate ?? endDate;
      const activeAccountPage = filters?.accountPage ?? accountPage;
      const activeChatbotPage = filters?.chatbotPage ?? chatbotPage;
      const usageData = await IntegrationService.getTokenUsageAnalytics({
        chatbot_id: activeChatbotId ? Number(activeChatbotId) : undefined,
        token_type: activeTokenType,
        start_date: activeStartDate || undefined,
        end_date: activeEndDate || undefined,
        account_page: activeAccountPage,
        account_page_size: breakdownPageSize,
        chatbot_page: activeChatbotPage,
        chatbot_page_size: breakdownPageSize,
      });
      setData(usageData);
    } catch {
      toast.error("Load Failed", {
        description: "Could not load token analytics right now.",
      });
    } finally {
      setLoading(false);
    }
  }, [accountPage, chatbotId, chatbotPage, tokenType, startDate, endDate]);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        const [botList, usageData] = await Promise.all([
          ChatbotService.getChatbots(),
          IntegrationService.getTokenUsageAnalytics({
            token_type: "total",
            account_page: 1,
            account_page_size: breakdownPageSize,
            chatbot_page: 1,
            chatbot_page_size: breakdownPageSize,
          }),
        ]);
        setChatbots(botList);
        setData(usageData);
      } catch {
        toast.error("Load Failed", {
          description: "Could not load token analytics right now.",
        });
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const applyFilters = () => {
    setAccountPage(1);
    setChatbotPage(1);
    loadUsage({ accountPage: 1, chatbotPage: 1 });
  };

  const applyQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));

    const nextStart = start.toISOString().slice(0, 10);
    const nextEnd = end.toISOString().slice(0, 10);

    setStartDate(nextStart);
    setEndDate(nextEnd);
    setAccountPage(1);
    setChatbotPage(1);
    loadUsage({
      chatbotId,
      tokenType,
      startDate: nextStart,
      endDate: nextEnd,
      accountPage: 1,
      chatbotPage: 1,
    });
  };

  const resetFilters = () => {
    setChatbotId("");
    setTokenType("total");
    setStartDate("");
    setEndDate("");
    setAccountPage(1);
    setChatbotPage(1);
    loadUsage({
      chatbotId: "",
      tokenType: "total",
      startDate: "",
      endDate: "",
      accountPage: 1,
      chatbotPage: 1,
    });
  };

  const handleBreakdownPageChange = (type: "account" | "chatbot", nextPage: number) => {
    if (type === "account") {
      setAccountPage(nextPage);
      loadUsage({ accountPage: nextPage, chatbotPage });
      return;
    }

    setChatbotPage(nextPage);
    loadUsage({ accountPage, chatbotPage: nextPage });
  };

  const hasFilters = Boolean(chatbotId || startDate || endDate || tokenType !== "total");
  const selectedMetricTotal = useMemo(
    () => getSelectedSummaryValue(data.summary, tokenType),
    [data.summary, tokenType]
  );
  const canApplyFilters = hasFilters && !loading;
  const canResetFilters = hasFilters && !loading;

  const averageTokensPerRequest = useMemo(() => {
    if (!data.summary.request_count) return 0;
    return Math.round(data.summary.total_tokens / data.summary.request_count);
  }, [data.summary.request_count, data.summary.total_tokens]);

  const accountBreakdownPagination = data.account_breakdown_pagination ?? emptyBreakdownPagination;
  const chatbotBreakdownPagination = data.chatbot_breakdown_pagination ?? emptyBreakdownPagination;
  const topChatbot = data.top_chatbot ?? data.chatbot_breakdown[0] ?? null;
  const topAccount = data.top_account ?? data.account_breakdown[0] ?? null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_28%)] px-4 py-4 lg:px-5 lg:py-5">
      <div className="mx-auto max-w-375 space-y-4">
        <section className="overflow-hidden rounded-[28px] border border-cyan-100/70 bg-white/85 shadow-sm backdrop-blur-md dark:border-cyan-900/40 dark:bg-slate-950/75">
          <div className="grid gap-5 px-5 py-5 lg:grid-cols-[1.35fr_0.65fr] lg:px-6">
            <div>
              <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300">
                <AppIcon icon={SparklesIcon} className="size-3.5" />
                Professional Token Analytics
              </Badge>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
                  <AppIcon icon={ChartBarLineIcon} className="text-white" size={22} />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-gray-950 dark:text-white lg:text-3xl">
                    Token Tracker
                  </h1>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Monitor input, output, and total token usage across chatbots and accounts.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full border-gray-200 bg-white/70 px-3 py-1 text-gray-600 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-300">
                  {formatNumber(data.summary.request_count)} requests logged
                </Badge>
                <Badge variant="outline" className="rounded-full border-gray-200 bg-white/70 px-3 py-1 text-gray-600 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-300">
                  Viewing {selectedLabel.toLowerCase()}
                </Badge>
                {hasFilters && (
                  <Badge variant="outline" className="rounded-full border-cyan-200 bg-cyan-50 px-3 py-1 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300">
                    Filters applied
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-gray-200/80 bg-white/70 p-3.5 dark:border-gray-800 dark:bg-gray-900/40">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">Top Chatbot</p>
                <div className="mt-1.5 flex items-center justify-between gap-3">
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {topChatbot?.chatbot__name || "No usage yet"}
                  </p>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {topChatbot ? `${formatCompact(topChatbot.total_tokens)} total tokens` : "-"}
                  </p>
                </div>
                {!topChatbot && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Usage data will appear here once requests are tracked.
                  </p>
                )}
              </div>
              <div className="rounded-2xl border border-gray-200/80 bg-white/70 p-3.5 dark:border-gray-800 dark:bg-gray-900/40">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">Top Account</p>
                <div className="mt-1.5 flex items-center justify-between gap-3">
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {topAccount ? `${topAccount.first_name || ""} ${topAccount.last_name || ""}`.trim() || topAccount.email || "Unknown Account" : "No usage yet"}
                  </p>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {topAccount ? `${formatCompact(topAccount.total_tokens)} total tokens` : "-"}
                  </p>
                </div>
                {!topAccount && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Account breakdown will appear after tracked responses.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <Card className="border-white/60 bg-white/85 shadow-sm backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-900/60">
          <CardHeader className="flex flex-col gap-3 pb-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="text-base text-gray-950 dark:text-white">Filters</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Narrow analytics by chatbot, token direction, and reporting range.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickRanges.map((range) => (
                <Button
                  key={range.days}
                  variant="outline"
                  size="sm"
                  className="cursor-pointer rounded-full"
                  onClick={() => applyQuickRange(range.days)}
                >
                  <AppIcon icon={CalendarAnalysisIcon} className="size-3.5" />
                  {range.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 rounded-2xl bg-gray-200 p-1 dark:bg-gray-800/60">
              {tokenTypeOptions.map((option) => {
                const active = tokenType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTokenType(option.value)}
                    className={cn(
                      "rounded-xl px-4 cursor-pointer py-2 text-sm font-medium transition-all",
                      active
                        ? "bg-white text-cyan-700 shadow-sm dark:bg-slate-900 dark:text-cyan-300"
                        : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5 xl:items-end">
              <div className="space-y-2 xl:col-span-2">
                <Label>Chatbot</Label>
                <Select
                  value={chatbotId ? String(chatbotId) : "all"}
                  onValueChange={(value) => setChatbotId(value === "all" ? "" : Number(value))}
                >
                  <SelectTrigger className="h-11 min-h-11 w-full cursor-pointer rounded-xl border-gray-200 bg-white text-left shadow-sm dark:border-gray-700 dark:bg-gray-950">
                    <SelectValue placeholder="Choose a chatbot" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-200">
                    <SelectItem value="all" className="cursor-pointer">All chatbots</SelectItem>
                    {chatbots.map((bot) => (
                      <SelectItem key={bot.id} value={String(bot.id)} className="cursor-pointer">
                        {bot.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-11 min-h-11 rounded-xl" />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-11 min-h-11 rounded-xl" />
              </div>

              <div className="flex items-end gap-2">
                <Button onClick={applyFilters} disabled={!canApplyFilters} className="h-11 min-h-11 flex-1 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:cursor-not-allowed">
                  {loading ? (
                    <AppIcon icon={Loading01Icon} className="animate-spin" size={18} />
                  ) : (
                    <AppIcon icon={Activity01Icon} size={18} />
                  )}
                  Apply
                </Button>
                <Button onClick={resetFilters} disabled={!canResetFilters} variant="outline" className="h-11 min-h-11 rounded-xl disabled:cursor-not-allowed">
                  <AppIcon icon={RefreshIcon} size={18} />
                  Reset
                </Button>
              </div>
            </div>

            {hasFilters && (
              <div className="flex flex-wrap gap-2">
                {chatbotId && (
                  <Badge variant="outline" className="rounded-full px-3 py-1">
                    Chatbot: {chatbots.find((bot) => bot.id === Number(chatbotId))?.name || chatbotId}
                  </Badge>
                )}
                {startDate && <Badge variant="outline" className="rounded-full px-3 py-1">From {startDate}</Badge>}
                {endDate && <Badge variant="outline" className="rounded-full px-3 py-1">To {endDate}</Badge>}
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  Metric: {selectedLabel}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

      {loading ? (
        <div className="flex min-h-105 items-center justify-center rounded-[28px] border border-white/60 bg-white/80 shadow-sm backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-900/60">
          <div className="text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-cyan-50 dark:bg-cyan-950/40">
              <AppIcon icon={Loading01Icon} className="animate-spin text-cyan-500" size={26} />
            </div>
            <p className="mt-4 text-sm font-medium text-gray-700 dark:text-gray-200">Refreshing analytics</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Fetching the latest token activity for your dashboard.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard
              title="Input Tokens"
              value={formatNumber(data.summary.input_tokens)}
              description="Prompt-side usage across all tracked responses"
              icon={<AppIcon icon={SparklesIcon} className="size-5 text-cyan-700 dark:text-cyan-300" />}
              accent="bg-cyan-50 dark:bg-cyan-950/40"
            />
            <MetricCard
              title="Output Tokens"
              value={formatNumber(data.summary.output_tokens)}
              description="Assistant response generation tokens"
              icon={<AppIcon icon={Activity01Icon} className="size-5 text-blue-700 dark:text-blue-300" />}
              accent="bg-blue-50 dark:bg-blue-950/40"
            />
            <MetricCard
              title="Total Tokens"
              value={formatNumber(data.summary.total_tokens)}
              description={`Current focus: ${selectedLabel.toLowerCase()}`}
              icon={<AppIcon icon={ChartBarLineIcon} className="size-5 text-slate-700 dark:text-slate-300" />}
              accent="bg-blue-50 dark:bg-blue-950/40"
            />
            <MetricCard
              title="Requests & Average"
              value={formatNumber(data.summary.request_count)}
              description={`${formatNumber(averageTokensPerRequest)} avg total tokens per request`}
              icon={<AppIcon icon={UserMultipleIcon} className="size-5 text-violet-700 dark:text-violet-300" />}
              accent="bg-violet-50 dark:bg-violet-950/40"
            />
          </div>

          <Card className="border-white/60 bg-white/85 shadow-sm backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-900/60">
            <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-base text-gray-950 dark:text-white">Daily Trend</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Compare input, output, and total token movement across the selected period.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full px-3 py-1">Primary metric: {selectedLabel}</Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1">{data.timeseries.length} data points</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {data.timeseries.length === 0 ? (
                <SectionEmpty
                  title="No trend data for this range"
                  description="Try a wider date range or clear filters to see token activity over time."
                />
              ) : (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.timeseries} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#dbe3ea" vertical={false} />
                      <XAxis dataKey="date" tickFormatter={formatDateLabel} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} />
                      <Tooltip
                        formatter={(value) => [formatNumber(Number(value || 0)), "Tokens"]}
                        labelFormatter={(label) => formatDateLabel(String(label))}
                        contentStyle={{
                          borderRadius: 16,
                          borderColor: "#e5e7eb",
                          boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08)",
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="input_tokens" stroke="#06b6d4" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} name="Input" />
                      <Line type="monotone" dataKey="output_tokens" stroke="#2563eb" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} name="Output" />
                      <Line type="monotone" dataKey="total_tokens" stroke="#0f172a" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} name="Total" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card className="border-white/60 bg-white/85 shadow-sm backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-900/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-gray-950 dark:text-white">Account Breakdown</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Which accounts are driving the highest {selectedLabel.toLowerCase()} in the selected range.
                </p>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {data.account_breakdown.length === 0 ? (
                  <SectionEmpty
                    title="No account activity"
                    description="Account-level usage will appear here after tracked chatbot conversations are generated."
                  />
                ) : (
                  data.account_breakdown.map((row, index) => {
                    const selectedValue = getSelectedTokenValue(row, tokenType);
                    const width = selectedMetricTotal ? (selectedValue / selectedMetricTotal) * 100 : 0;
                    const accountRank =
                      (accountBreakdownPagination.page - 1) *
                        accountBreakdownPagination.page_size +
                      index +
                      1;
                    return (
                      <div key={`${row.account_user_id}-${row.email}`} className="rounded-2xl border border-gray-200/80 bg-gray-50/70 p-2.5 dark:border-gray-800 dark:bg-gray-800/40">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[11px]">#{accountRank}</Badge>
                              <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                {`${row.first_name || ""} ${row.last_name || ""}`.trim() || row.email || "Unknown Account"}
                              </p>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">{row.email || "No email available"}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCompact(selectedValue)}</p>
                            <p className="text-xs text-gray-500">{formatShare(selectedValue, selectedMetricTotal)} of filtered total</p>
                          </div>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          <div className="h-full rounded-full bg-linear-to-r from-cyan-500 to-blue-600" style={{ width: `${width}%` }} />
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400 sm:grid-cols-4">
                          <p>Input: <span className="font-medium text-gray-700 dark:text-gray-200">{formatNumber(row.input_tokens)}</span></p>
                          <p>Output: <span className="font-medium text-gray-700 dark:text-gray-200">{formatNumber(row.output_tokens)}</span></p>
                          <p>Total: <span className="font-medium text-gray-700 dark:text-gray-200">{formatNumber(row.total_tokens)}</span></p>
                          <p>Requests: <span className="font-medium text-gray-700 dark:text-gray-200">{formatNumber(row.request_count)}</span></p>
                        </div>
                      </div>
                    );
                  })
                )}
                {accountBreakdownPagination.count > 0 && (
                  <BreakdownPagination
                    itemLabel="accounts"
                    pagination={accountBreakdownPagination}
                    loading={loading}
                    onPrevious={() => handleBreakdownPageChange("account", accountBreakdownPagination.page - 1)}
                    onNext={() => handleBreakdownPageChange("account", accountBreakdownPagination.page + 1)}
                  />
                )}
              </CardContent>
            </Card>

            <Card className="border-white/60 bg-white/85 shadow-sm backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-900/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-gray-950 dark:text-white">Chatbot Breakdown</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Understand which chatbot experiences are consuming the most {selectedLabel.toLowerCase()}.
                </p>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {data.chatbot_breakdown.length === 0 ? (
                  <SectionEmpty
                    title="No chatbot activity"
                    description="Chatbot-level usage will appear here once tracked requests are available."
                  />
                ) : (
                  data.chatbot_breakdown.map((row, index) => {
                    const selectedValue = getSelectedTokenValue(row, tokenType);
                    const width = selectedMetricTotal ? (selectedValue / selectedMetricTotal) * 100 : 0;
                    const chatbotRank =
                      (chatbotBreakdownPagination.page - 1) *
                        chatbotBreakdownPagination.page_size +
                      index +
                      1;
                    return (
                      <div key={row.chatbot_id} className="rounded-2xl border border-gray-200/80 bg-gray-50/70 p-2.5 dark:border-gray-800 dark:bg-gray-800/40">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="flex size-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-200 dark:ring-cyan-400/35">
                              <AppIcon icon={BotIcon} className="size-4 text-current" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[11px]">#{chatbotRank}</Badge>
                                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{row.chatbot__name}</p>
                              </div>
                              <p className="mt-1 text-xs text-gray-500"></p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCompact(selectedValue)}</p>
                            <p className="text-xs text-gray-500">{formatShare(selectedValue, selectedMetricTotal)} of filtered total</p>
                          </div>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          <div className="h-full rounded-full bg-linear-to-r from-slate-800 to-cyan-500 dark:from-cyan-400 dark:to-blue-500" style={{ width: `${width}%` }} />
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400 sm:grid-cols-4">
                          <p>Input: <span className="font-medium text-gray-700 dark:text-gray-200">{formatNumber(row.input_tokens)}</span></p>
                          <p>Output: <span className="font-medium text-gray-700 dark:text-gray-200">{formatNumber(row.output_tokens)}</span></p>
                          <p>Total: <span className="font-medium text-gray-700 dark:text-gray-200">{formatNumber(row.total_tokens)}</span></p>
                          <p>Requests: <span className="font-medium text-gray-700 dark:text-gray-200">{formatNumber(row.request_count)}</span></p>
                        </div>
                      </div>
                    );
                  })
                )}
                {chatbotBreakdownPagination.count > 0 && (
                  <BreakdownPagination
                    itemLabel="chatbots"
                    pagination={chatbotBreakdownPagination}
                    loading={loading}
                    onPrevious={() => handleBreakdownPageChange("chatbot", chatbotBreakdownPagination.page - 1)}
                    onNext={() => handleBreakdownPageChange("chatbot", chatbotBreakdownPagination.page + 1)}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
      </div>
    </div>
  );
}

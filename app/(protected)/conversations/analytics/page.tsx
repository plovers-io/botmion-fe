"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, MessageSquare, Activity, BarChart3, Clock3 } from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ChatbotService } from "@/lib/services/chatbot-service";
import { ConversationService } from "@/lib/services/conversation-service";
import type { Chatbot } from "@/lib/types/chatbot";
import type {
  ConversationAnalyticsResponse,
  PlatformType,
} from "@/lib/types/conversation";

const EMPTY_DATA: ConversationAnalyticsResponse = {
  filters: {
    chatbot_id: null,
    platform: null,
    start_date: null,
    end_date: null,
  },
  summary: {
    total_conversations: 0,
    active_conversations: 0,
    total_messages: 0,
    avg_messages_per_conversation: 0,
  },
  platform_breakdown: [],
  status_breakdown: [],
  chatbot_breakdown: [],
  timeseries: [],
};

const PLATFORM_OPTIONS: Array<{ label: string; value: PlatformType | "all" }> = [
  { label: "All Platforms", value: "all" },
  { label: "Web", value: "web" },
  { label: "Messenger", value: "messenger" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "Slack", value: "slack" },
];

function formatDateLabel(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default function ConversationsAnalyticsPage() {
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [analytics, setAnalytics] = useState<ConversationAnalyticsResponse>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);

  const [chatbotId, setChatbotId] = useState<number | "">("");
  const [platform, setPlatform] = useState<PlatformType | "all">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [bots, data] = await Promise.all([
        ChatbotService.getChatbots(),
        ConversationService.getConversationAnalytics({
          chatbot_id: chatbotId ? Number(chatbotId) : undefined,
          platform: platform === "all" ? undefined : platform,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        }),
      ]);
      setChatbots(bots);
      setAnalytics(data);
    } catch {
      setAnalytics(EMPTY_DATA);
    } finally {
      setLoading(false);
    }
  }, [chatbotId, endDate, platform, startDate]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const hasTimeseries = useMemo(() => analytics.timeseries.length > 0, [analytics.timeseries.length]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <BarChart3 size={26} className="text-emerald-600" />
          Conversation Analytics
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Track conversation volume, activity, and engagement trends across chatbots.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="chatbot">Chatbot</Label>
            <select
              id="chatbot"
              className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              value={chatbotId}
              onChange={(e) => setChatbotId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">All chatbots</option>
              {chatbots.map((bot) => (
                <option key={bot.id} value={bot.id}>
                  {bot.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="platform">Platform</Label>
            <select
              id="platform"
              className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as PlatformType | "all")}
            >
              {PLATFORM_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="start-date">Start Date</Label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <div>
            <Label htmlFor="end-date">End Date</Label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <div className="md:col-span-4 flex gap-2">
            <Button onClick={loadAnalytics} disabled={loading} className="bg-emerald-500 hover:bg-emerald-600 text-white">
              {loading ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              Apply Filters
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setChatbotId("");
                setPlatform("all");
                setStartDate("");
                setEndDate("");
              }}
              disabled={loading}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Total Conversations</p>
            <p className="text-2xl font-bold mt-1 flex items-center gap-2"><MessageSquare size={18} className="text-emerald-600" />{analytics.summary.total_conversations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Active Conversations</p>
            <p className="text-2xl font-bold mt-1 flex items-center gap-2"><Activity size={18} className="text-blue-600" />{analytics.summary.active_conversations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Total Messages</p>
            <p className="text-2xl font-bold mt-1 flex items-center gap-2"><BarChart3 size={18} className="text-purple-600" />{analytics.summary.total_messages}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Avg Msg/Conversation</p>
            <p className="text-2xl font-bold mt-1 flex items-center gap-2"><Clock3 size={18} className="text-amber-600" />{analytics.summary.avg_messages_per_conversation}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversation Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {loading ? (
            <div className="h-full flex items-center justify-center text-sm text-gray-500">
              <Loader2 size={18} className="animate-spin mr-2" /> Loading trend...
            </div>
          ) : hasTimeseries ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.timeseries} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatDateLabel} />
                <YAxis allowDecimals={false} />
                <Tooltip labelFormatter={(label) => formatDateLabel(String(label))} />
                <Line type="monotone" dataKey="conversation_count" stroke="#10b981" strokeWidth={2} dot={false} name="Conversations" />
                <Line type="monotone" dataKey="message_count" stroke="#2563eb" strokeWidth={2} dot={false} name="Messages" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-gray-500">No analytics data for selected filters.</div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analytics.platform_breakdown.length === 0 ? (
              <p className="text-sm text-gray-500">No data available.</p>
            ) : (
              analytics.platform_breakdown.map((item) => (
                <div key={item.platform} className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-800 px-3 py-2 text-sm">
                  <span className="capitalize">{item.platform}</span>
                  <span className="font-semibold">{item.total}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Chatbots by Conversations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analytics.chatbot_breakdown.length === 0 ? (
              <p className="text-sm text-gray-500">No data available.</p>
            ) : (
              analytics.chatbot_breakdown.slice(0, 8).map((item) => (
                <div key={item.chatbot_id} className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-800 px-3 py-2 text-sm">
                  <span className="truncate pr-4">{item.chatbot__name}</span>
                  <span className="font-semibold">{item.conversation_count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

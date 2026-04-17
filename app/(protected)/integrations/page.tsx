"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plug,
  Loader2,
  Trash2,
  Plus,
  CheckCircle2,
  XCircle,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { IntegrationService } from "@/lib/services/integration-service";
import { ChatbotService } from "@/lib/services/chatbot-service";
import type {
  Integration,
} from "@/lib/types/integration";
import type { Chatbot } from "@/lib/types/chatbot";
import { goeyToast as toast } from "goey-toast";

// ─── Messenger SVG icon ──────────────────────────────────────────────────────

function MessengerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient
          id="mGrad"
          x1="24"
          y1="2"
          x2="24"
          y2="46.01"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00B2FF" />
          <stop offset="1" stopColor="#006AFF" />
        </linearGradient>
      </defs>
      <path
        d="M24 2C11.85 2 2 11.21 2 23.16c0 6.23 2.55 11.56 6.72 15.33a1.76 1.76 0 01.59 1.31l.12 4.1a1.76 1.76 0 002.52 1.53l4.58-2.02a1.76 1.76 0 011.17-.1c2 .55 4.13.85 6.3.85 12.15 0 22-9.21 22-21.16C46 11.21 36.15 2 24 2z"
        fill="url(#mGrad)"
      />
      <path
        d="M10.56 29.47l6.58-10.44a3.3 3.3 0 014.78-.88l5.23 3.92a1.32 1.32 0 001.59 0l7.06-5.36c.94-.72 2.17.43 1.36 1.27l-6.58 10.44a3.3 3.3 0 01-4.78.88l-5.23-3.92a1.32 1.32 0 00-1.59 0l-7.06 5.36c-.94.72-2.17-.43-1.36-1.27z"
        fill="#fff"
      />
    </svg>
  );
}

// ─── Upcoming platforms ──────────────────────────────────────────────────────

const upcomingPlatforms = [
  {
    name: "WhatsApp",
    description: "Deploy your chatbot on WhatsApp Business",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none">
        <path
          d="M24 4C12.95 4 4 12.95 4 24c0 3.54.93 6.86 2.55 9.73L4 44l10.57-2.47A19.87 19.87 0 0024 44c11.05 0 20-8.95 20-20S35.05 4 24 4z"
          fill="#25D366"
        />
        <path
          d="M34.6 29.23c-.58-.29-3.43-1.69-3.96-1.88-.53-.2-.92-.29-1.3.29-.39.58-1.5 1.88-1.84 2.27-.34.39-.68.44-1.26.15-.58-.29-2.45-.9-4.67-2.88-1.73-1.54-2.89-3.44-3.23-4.02-.34-.58-.04-.9.25-1.19.26-.26.58-.68.87-1.02.29-.34.39-.58.58-.97.2-.39.1-.73-.05-1.02-.15-.29-1.3-3.14-1.79-4.3-.47-1.13-.95-.98-1.3-1-.34-.02-.73-.02-1.12-.02-.39 0-1.02.15-1.55.73-.53.58-2.03 1.98-2.03 4.83s2.08 5.6 2.37 5.99c.29.39 4.09 6.25 9.92 8.76 1.39.6 2.47.96 3.31 1.23 1.39.44 2.66.38 3.66.23 1.12-.17 3.43-1.4 3.92-2.76.49-1.35.49-2.51.34-2.76-.15-.24-.53-.39-1.12-.68z"
          fill="#fff"
        />
      </svg>
    ),
  },
  {
    name: "Slack",
    description: "Integrate your chatbot with Slack workspaces",
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 48 48" fill="none">
        <path
          d="M10.1 30.2a5 5 0 11-5-5h5v5zM12.6 30.2a5 5 0 1110 0v12.5a5 5 0 11-10 0V30.2z"
          fill="#E01E5A"
        />
        <path
          d="M17.6 10.1a5 5 0 115-5v5h-5zM17.6 12.6a5 5 0 110 10H5.1a5 5 0 010-10h12.5z"
          fill="#36C5F0"
        />
        <path
          d="M37.8 17.6a5 5 0 115 5h-5v-5zM35.3 17.6a5 5 0 11-10 0V5.1a5 5 0 0110 0v12.5z"
          fill="#2EB67D"
        />
        <path
          d="M30.3 37.8a5 5 0 11-5 5v-5h5zM30.3 35.3a5 5 0 110-10h12.5a5 5 0 010 10H30.3z"
          fill="#ECB22E"
        />
      </svg>
    ),
  },
];

// ─── Page component ──────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Form fields
  const [selectedChatbotId, setSelectedChatbotId] = useState<number | "">("");

  // ─── Load data ──────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [intList, botList] = await Promise.all([
        IntegrationService.getIntegrations(),
        ChatbotService.getChatbots(),
      ]);
      setIntegrations(intList);
      setChatbots(botList);
    } catch {
      toast.error("Load Failed", { description: "Could not load integrations" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Create integration ─────────────────────────────────────────────

  const handleStartOAuth = async () => {
    if (!selectedChatbotId) {
      toast.error("Missing chatbot", { description: "Please select a chatbot first" });
      return;
    }

    setOauthLoading(true);
    try {
      const redirectUri = `${window.location.origin}/integrations/messenger/callback`;
      const response = await IntegrationService.getMessengerOAuthURL({
        chatbot_id: Number(selectedChatbotId),
        redirect_uri: redirectUri,
      });

      window.location.href = response.authorization_url;
    } catch (error: unknown) {
      const err = error as { message?: string };
      const msg = err?.message || "Failed to start Facebook OAuth";
      toast.error("Error", { description: msg });
    } finally {
      setOauthLoading(false);
    }
  };

  // ─── Delete integration ─────────────────────────────────────────────

  const handleDelete = async (id: number) => {
    if (!window.confirm("Disconnect this integration? Messages from this platform will stop working."))
      return;
    setDeleting(id);
    try {
      await IntegrationService.deleteIntegration(id);
      toast.success("Disconnected", { description: "Integration removed" });
      loadData();
    } catch {
      toast.error("Error", { description: "Failed to disconnect integration" });
    } finally {
      setDeleting(null);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setSelectedChatbotId("");
  };

  // ─── Connected messenger integrations ───────────────────────────────

  const messengerIntegrations = integrations.filter((i) => i.platform === "messenger");

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Plug className="text-white" size={20} />
          </div>
          Integrations
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">
          Connect your chatbots to messaging platforms.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
        </div>
      ) : (
        <div className="space-y-8">
          {/* ─── Messenger Section ─────────────────────────────── */}
          <Card className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border-gray-100 dark:border-gray-700/50 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <MessengerIcon className="w-7 h-7" />
                  Facebook Messenger
                </CardTitle>
                {!showForm && (
                  <Button
                    onClick={() => setShowForm(true)}
                    size="sm"
                    className="bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    <Plus size={14} />
                    Connect Page
                  </Button>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Route messages from your Facebook Page to a chatbot.
              </p>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Connection form */}
              {showForm && (
                <>
                  <div className="bg-blue-50/50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Connect a Facebook Page
                    </h3>

                    <div className="space-y-2">
                      <Label>Chatbot *</Label>
                      <select
                        value={selectedChatbotId}
                        onChange={(e) =>
                          setSelectedChatbotId(e.target.value ? Number(e.target.value) : "")
                        }
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                      >
                        <option value="">Select a chatbot...</option>
                        {chatbots.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      After selecting chatbot, you will be redirected to Facebook to authorize and select pages.
                      Page ID and access token will be filled automatically.
                    </p>

                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        onClick={handleStartOAuth}
                        disabled={oauthLoading || !selectedChatbotId}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {oauthLoading ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <LogIn size={14} />
                        )}
                        {oauthLoading ? "Redirecting..." : "Continue with Facebook"}
                      </Button>
                      <Button
                        onClick={resetForm}
                        variant="ghost"
                        size="sm"
                        disabled={oauthLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Connected list */}
              {messengerIntegrations.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  <MessengerIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No Messenger integrations yet.</p>
                  <p className="text-xs mt-1">
                    Click &quot;Connect Page&quot; to link a Facebook Page to one of your chatbots.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messengerIntegrations.map((integration) => {
                    const cfg = (integration.safe_config || integration.config || {}) as {
                      page_id?: string;
                      page_name?: string;
                    };
                    return (
                      <div
                        key={integration.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30"
                      >
                        <div className="flex items-center gap-3">
                          <MessengerIcon className="w-6 h-6" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {cfg.page_name || `Page ${cfg.page_id || "Unknown"}`}
                            </p>
                            <p className="text-xs text-gray-400">
                              Chatbot: {integration.chatbot_name || `#${integration.chatbot}`} &middot;
                              Page ID: {cfg.page_id || "—"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="secondary"
                            className={
                              integration.is_active
                                ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200"
                                : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200"
                            }
                          >
                            {integration.is_active ? (
                              <CheckCircle2 size={12} className="mr-1" />
                            ) : (
                              <XCircle size={12} className="mr-1" />
                            )}
                            {integration.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            onClick={() => handleDelete(integration.id)}
                            size="icon-sm"
                            variant="ghost"
                            disabled={deleting === integration.id}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                          >
                            {deleting === integration.id ? (
                              <Loader2 className="animate-spin" size={14} />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ─── Upcoming Platforms ──────────────────────────────── */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Coming Soon
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingPlatforms.map((p) => (
                <Card
                  key={p.name}
                  className="bg-white/50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-700/50 shadow-sm opacity-70"
                >
                  <CardContent className="flex items-center gap-4 py-5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                      {p.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {p.name}
                      </p>
                      <p className="text-xs text-gray-400">{p.description}</p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-gray-100 dark:bg-gray-700 text-gray-500 text-[11px]"
                    >
                      Soon
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

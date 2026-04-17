"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { IntegrationService } from "@/lib/services/integration-service";
import type {
  IntegrationCreateRequest,
  MessengerOAuthPage,
} from "@/lib/types/integration";
import { goeyToast as toast } from "goey-toast";

function MessengerOAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasRun = useRef(false);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [chatbotId, setChatbotId] = useState<number | null>(null);
  const [pages, setPages] = useState<MessengerOAuthPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState("");

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const createIntegration = async (targetChatbotId: number, page: MessengerOAuthPage) => {
    setCreating(true);
    try {
      const payload: IntegrationCreateRequest = {
        chatbot: targetChatbotId,
        platform: "messenger",
        config: {
          page_id: page.page_id,
          page_name: page.page_name,
          page_access_token: page.page_access_token,
        },
      };

      await IntegrationService.createIntegration(payload);
      toast.success("Connected", {
        description: `${page.page_name || page.page_id} connected to chatbot successfully.`,
      });
      router.replace("/integrations");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create integration";
      toast.error("Failed", { description: message });
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (error) {
      const description = errorDescription || "Facebook authentication was cancelled or failed.";
      toast.error("Facebook OAuth failed", { description });
      router.replace("/integrations");
      return;
    }

    if (!code || !state) {
      toast.error("Invalid callback", { description: "Missing OAuth code or state." });
      router.replace("/integrations");
      return;
    }

    const run = async () => {
      try {
        const redirectUri = `${window.location.origin}/integrations/messenger/callback`;
        const response = await IntegrationService.exchangeMessengerOAuthCode({
          code,
          state,
          redirect_uri: redirectUri,
        });

        const availablePages = response.pages || [];
        setChatbotId(response.chatbot_id);
        setPages(availablePages);

        if (availablePages.length === 0) {
          toast.error("No pages found", {
            description: "No Facebook pages were returned for this account.",
          });
          router.replace("/integrations");
          return;
        }

        if (availablePages.length === 1) {
          await createIntegration(response.chatbot_id, availablePages[0]);
          return;
        }

        setSelectedPageId(availablePages[0].page_id);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to complete Facebook OAuth";
        toast.error("OAuth error", { description: message });
        router.replace("/integrations");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [code, state, error, errorDescription, router]);

  const selectedPage = pages.find((page) => page.page_id === selectedPageId) || null;

  const handleConnectSelected = async () => {
    if (!chatbotId || !selectedPage) {
      toast.error("Missing selection", { description: "Please select a page to connect." });
      return;
    }
    await createIntegration(chatbotId, selectedPage);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-3 text-blue-600" size={32} />
          <p className="text-sm text-gray-500 dark:text-gray-400">Completing Facebook authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg">Choose Facebook Page</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Multiple pages were found. Select one page to connect with your chatbot.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Facebook Page</Label>
            <select
              value={selectedPageId}
              onChange={(e) => setSelectedPageId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            >
              {pages.map((page) => (
                <option key={page.page_id} value={page.page_id}>
                  {page.page_name || page.page_id}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleConnectSelected}
            disabled={creating || !selectedPage}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {creating ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
            {creating ? "Connecting..." : "Connect Selected Page"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MessengerOAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="animate-spin" size={30} />
        </div>
      }
    >
      <MessengerOAuthCallbackContent />
    </Suspense>
  );
}

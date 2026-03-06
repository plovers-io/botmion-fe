"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { ConversationService } from "@/lib/services/conversation-service";
import { PublicChatResponse } from "@/lib/types/conversation";
import { Bot, Send, User, Loader2, Sparkles } from "lucide-react";

interface ChatBubble {
  id: string | number;
  uuid?: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  status?: string;
}

export default function PublicChatPage() {
  const params = useParams();
  const chatbotUuid = params.uuid as string;

  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Initialize session
  useEffect(() => {
    const storageKey = `botmion_session_${chatbotUuid}`;
    let stored = localStorage.getItem(storageKey);
    if (!stored) {
      stored = crypto.randomUUID();
      localStorage.setItem(storageKey, stored);
    }
    setSessionId(stored);
    return () => {
      pollTimersRef.current.forEach((t) => clearTimeout(t));
    };
  }, [chatbotUuid]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const startPolling = useCallback((msgUuid: string, attempt = 0) => {
    const MAX_ATTEMPTS = 40;
    const INTERVAL_MS = 1500;

    const timer = setTimeout(async () => {
      pollTimersRef.current.delete(msgUuid);
      try {
        const msg = await ConversationService.getMessage(msgUuid);
        if (msg.status === "processing" && attempt < MAX_ATTEMPTS) {
          startPolling(msgUuid, attempt + 1);
          return;
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.uuid === msgUuid
              ? {
                  ...m,
                  content:
                    msg.status !== "processing"
                      ? msg.content
                      : "The response took too long. Please try again.",
                  status: msg.status !== "processing" ? msg.status : "failed",
                }
              : m
          )
        );
      } catch {
        if (attempt < MAX_ATTEMPTS) {
          startPolling(msgUuid, attempt + 1);
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.uuid === msgUuid
                ? { ...m, content: "Could not retrieve response. Please try again.", status: "failed" }
                : m
            )
          );
        }
      }
    }, INTERVAL_MS);

    pollTimersRef.current.set(msgUuid, timer);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || sending || !sessionId) return;

    const userContent = input.trim();
    setInput("");

    const userBubble: ChatBubble = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userContent,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userBubble]);

    const typingId = `typing-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: typingId, role: "assistant", content: "", timestamp: new Date().toISOString(), status: "typing" },
    ]);

    setSending(true);

    try {
      const response: PublicChatResponse = await ConversationService.publicChat({
        content: userContent,
        chatbot_uuid: chatbotUuid,
        session_id: sessionId,
      });

      if (response.session_id) {
        const storageKey = `botmion_session_${chatbotUuid}`;
        localStorage.setItem(storageKey, response.session_id);
        setSessionId(response.session_id);
      }

      const asst = response.assistant_message;
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== typingId)
          .concat({
            id: asst.id,
            uuid: asst.uuid,
            role: "assistant",
            content: asst.content,
            timestamp: asst.created_at,
            status: asst.status,
          })
      );

      if (asst.status === "processing") {
        startPolling(asst.uuid);
      }
    } catch {
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== typingId)
          .concat({
            id: `error-${Date.now()}`,
            role: "assistant",
            content: "Sorry, something went wrong. Please try again.",
            timestamp: new Date().toISOString(),
            status: "failed",
          })
      );
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="w-10 h-10 bg-linear-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
          <Bot className="text-white" size={20} />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Chat Assistant
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-gray-400 font-medium">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-16 h-16 bg-linear-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/10 dark:to-teal-500/10 rounded-2xl flex items-center justify-center mb-4">
              <Sparkles size={28} className="text-emerald-500" />
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              How can I help you?
            </p>
            <p className="text-xs text-gray-400 max-w-65">
              Ask me anything and I&apos;ll do my best to help.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  msg.role === "assistant"
                    ? "bg-linear-to-br from-emerald-500 to-teal-500 shadow-sm"
                    : "bg-blue-500 shadow-sm"
                }`}
              >
                {msg.role === "assistant" ? (
                  <Bot size={13} className="text-white" />
                ) : (
                  <User size={13} className="text-white" />
                )}
              </div>

              {(msg.status === "typing" || msg.status === "processing") ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-700/50">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              ) : (
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
                    msg.role === "user"
                      ? "bg-emerald-500 text-white rounded-tr-md"
                      : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700/50 rounded-tl-md"
                  } ${msg.status === "failed" ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300" : ""}`}
                >
                  <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                  <p
                    className={`text-[10px] mt-1.5 tabular-nums ${
                      msg.role === "user"
                        ? "text-emerald-200"
                        : msg.status === "failed"
                        ? "text-red-400"
                        : "text-gray-300 dark:text-gray-500"
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              disabled={sending}
              className="w-full resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 disabled:opacity-50 transition-all max-h-32"
              style={{ minHeight: "40px" }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "40px";
                el.style.height = Math.min(el.scrollHeight, 128) + "px";
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-10 w-10 shrink-0 shadow-md shadow-emerald-500/20 disabled:opacity-40 transition-all flex items-center justify-center cursor-pointer"
          >
            {sending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
        <p className="text-[10px] text-gray-300 dark:text-gray-600 text-center mt-2">
          Powered by Botmion
        </p>
      </div>
    </div>
  );
}

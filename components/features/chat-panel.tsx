"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ConversationService } from "@/lib/services/conversation-service";
import { Message, ChatMessageResponse } from "@/lib/types/conversation";
import { Chatbot } from "@/lib/types/chatbot";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Send,
  User,
  Loader2,
  X,
  Sparkles,
  RotateCcw,
  Mic,
  Square,
  Volume2,
} from "lucide-react";

interface ChatPanelProps {
  chatbot: Chatbot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChatBubble {
  id: string | number;
  uuid?: string;          // used for polling processing messages
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  status?: string;
}

export function ChatPanel({ chatbot, open, onOpenChange }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | number | null>(null);
  const [pendingVoiceBlob, setPendingVoiceBlob] = useState<Blob | null>(null);
  const [pendingVoiceSeconds, setPendingVoiceSeconds] = useState<number>(0);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number | null>(null);
  const cancelRecordingRef = useRef(false);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  // Reset when chatbot changes; cancel any outstanding polls
  useEffect(() => {
    if (chatbot) {
      pollTimersRef.current.forEach((t) => clearTimeout(t));
      pollTimersRef.current.clear();
      setMessages([]);
      setConversationId(null);
      setInput("");
      setRecording(false);
      setVoiceBusy(false);
      setPendingVoiceBlob(null);
      setPendingVoiceSeconds(0);
    }
  }, [chatbot?.id]);

  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setPendingVoiceBlob(null);
    };
  }, []);

  const detectSpeechLanguage = (text: string) => {
    return /[\u0980-\u09FF]/.test(text) ? "bn-BD" : "en-US";
  };

  const pickBestVoice = (voices: SpeechSynthesisVoice[], lang: string) => {
    const normalizedLang = lang.toLowerCase();
    const userPreferred = localStorage.getItem(
      normalizedLang.startsWith("bn") ? "botmion_voice_bn" : "botmion_voice_en"
    );

    if (userPreferred) {
      const explicit = voices.find((v) => v.name === userPreferred);
      if (explicit) return explicit;
    }

    const preferredKeywords = normalizedLang.startsWith("bn")
      ? ["bangla", "bengali", "bn-bd", "bn_in", "google"]
      : ["en-us", "english", "google", "microsoft", "natural"];

    const langMatched = voices.filter((voice) => voice.lang.toLowerCase().startsWith(normalizedLang.slice(0, 2)));
    const prioritized = (langMatched.length ? langMatched : voices).sort((a, b) => {
      const score = (v: SpeechSynthesisVoice) => {
        const name = `${v.name} ${v.lang}`.toLowerCase();
        let s = 0;
        preferredKeywords.forEach((k, idx) => {
          if (name.includes(k)) s += 10 - idx;
        });
        if (!v.localService) s += 1;
        return s;
      };
      return score(b) - score(a);
    });

    return prioritized[0];
  };

  const speakText = (id: string | number, text: string) => {
    if (!("speechSynthesis" in window) || !text.trim()) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const lang = detectSpeechLanguage(text);
    const startSpeaking = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      const voices = synth.getVoices();
      const chosen = pickBestVoice(voices, lang);
      if (chosen) {
        utterance.voice = chosen;
      }
      utterance.rate = lang.startsWith("bn") ? 0.9 : 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      setSpeakingId(id);
      synth.speak(utterance);
    };

    if (synth.getVoices().length === 0) {
      const onVoicesChanged = () => {
        synth.removeEventListener("voiceschanged", onVoicesChanged);
        startSpeaking();
      };
      synth.addEventListener("voiceschanged", onVoicesChanged);
      setTimeout(() => {
        synth.removeEventListener("voiceschanged", onVoicesChanged);
        if (!synth.speaking) {
          startSpeaking();
        }
      }, 400);
      return;
    }

    startSpeaking();
  };

  /**
   * Poll a processing assistant message until it completes (or times out).
   * Updates the bubble in-place once finished.
   */
  const startPolling = useCallback((msgUuid: string, attempt = 0) => {
    const MAX_ATTEMPTS = 40; // 40 × 1500ms = 60s timeout
    const INTERVAL_MS = 1500;

    const timer = setTimeout(async () => {
      pollTimersRef.current.delete(msgUuid);
      try {
        const msg = await ConversationService.getMessage(msgUuid);
        if (msg.status === "processing" && attempt < MAX_ATTEMPTS) {
          // Still processing — schedule next poll
          startPolling(msgUuid, attempt + 1);
          return;
        }
        // Completed, failed, or timed out
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

  const handleSend = async (overrideContent?: string) => {
    const content = overrideContent || input.trim();
    if (!content || !chatbot || sending) return;

    setInput("");

    // Optimistic: add user message immediately
    const userBubble: ChatBubble = {
      id: `user-${Date.now()}`,
      role: "user",
      content: content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userBubble]);

    // Typing indicator
    const typingId = `typing-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: typingId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        status: "typing",
      },
    ]);

    setSending(true);

    try {
      const response: ChatMessageResponse = await ConversationService.sendMessage({
        content: content,
        chatbot_id: chatbot.id,
        conversation_id: conversationId,
        platform: "web",
      });

      if (!conversationId) {
        setConversationId(response.conversation_id);
      }

      const asst = response.assistant_message;

      // Replace typing indicator with the placeholder (status may be "processing")
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

      // If Celery hasn't finished yet, start polling
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
            content: "Sorry, I couldn't process your message. Please try again.",
            timestamp: new Date().toISOString(),
            status: "failed",
          })
      );
    } finally {
      setSending(false);
    }
  };

  const handleVoiceUpload = async (audio: Blob) => {
    if (!chatbot || sending || voiceBusy || !audio.size) return;

    const typingId = `typing-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: typingId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        status: "typing",
      },
    ]);
    setVoiceBusy(true);

    try {
      const response = await ConversationService.sendAudioMessage({
        audio,
        chatbot_id: chatbot.id,
        conversation_id: conversationId,
        platform: "web",
        language_hint: navigator.language.startsWith("bn") ? "bn" : "auto",
        duration_ms: 0,
      });

      if (!conversationId) {
        setConversationId(response.conversation_id);
      }

      const user = response.user_message;
      const asst = response.assistant_message;

      setMessages((prev) =>
        prev
          .filter((m) => m.id !== typingId)
          .concat({
            id: user.id,
            uuid: user.uuid,
            role: "user",
            content: user.content,
            timestamp: user.created_at,
            status: user.status,
          })
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
            content: "Sorry, voice input could not be processed. Please try again.",
            timestamp: new Date().toISOString(),
            status: "failed",
          })
      );
    } finally {
      setVoiceBusy(false);
    }
  };

  const sendPendingVoice = async () => {
    if (!pendingVoiceBlob || voiceBusy || sending) return;
    const blob = pendingVoiceBlob;
    setPendingVoiceBlob(null);
    setPendingVoiceSeconds(0);
    await handleVoiceUpload(blob);
  };

  const cancelPendingVoice = () => {
    setPendingVoiceBlob(null);
    setPendingVoiceSeconds(0);
    chunksRef.current = [];
  };

  const startRecording = async () => {
    if (recording || voiceBusy || sending) return;
    if (!navigator.mediaDevices?.getUserMedia) return;

    try {
      setPendingVoiceBlob(null);
      setPendingVoiceSeconds(0);
      cancelRecordingRef.current = false;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (!cancelRecordingRef.current && blob.size > 0) {
          const startedAt = recordingStartedAtRef.current;
          const durationMs = startedAt ? Math.max(0, Date.now() - startedAt) : 0;
          setPendingVoiceSeconds(Math.max(1, Math.round(durationMs / 1000)));
          setPendingVoiceBlob(blob);
        }
        cancelRecordingRef.current = false;
        recordingStartedAtRef.current = null;
      };

      recorderRef.current = recorder;
      recorder.start();
      recordingStartedAtRef.current = Date.now();
      setRecording(true);
    } catch {
      setRecording(false);
    }
  };

  const stopRecording = (discard = false) => {
    if (!recorderRef.current || recorderRef.current.state === "inactive") return;
    cancelRecordingRef.current = discard;
    recorderRef.current.stop();
    setRecording(false);
  };

  const cancelRecording = () => {
    stopRecording(true);
  };

  const toggleRecording = () => {
    if (recording) {
      stopRecording();
      return;
    }
    startRecording();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setInput("");
    inputRef.current?.focus();
  };

  if (!chatbot || !open) return null;

  return (
    <div className="fixed right-4 top-4 z-50 w-[min(440px,calc(100vw-2rem))] h-[calc(100vh-2rem)] rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-2xl border border-gray-200/70 dark:border-gray-700/60 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Bot className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                {chatbot.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-gray-400 font-medium">Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleNewChat}
              title="New conversation"
              className="text-gray-400 hover:text-emerald-600"
            >
              <RotateCcw size={15} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-gray-50/50 dark:bg-gray-950/50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-16 h-16 bg-linear-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/10 dark:to-teal-500/10 rounded-2xl flex items-center justify-center mb-4">
                <Sparkles size={28} className="text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Test your chatbot
              </p>
              <p className="text-xs text-gray-400 max-w-65">
                Send a message to see how {chatbot.name} responds using its training data.
              </p>
              {/* Quick prompts */}
              <div className="flex flex-wrap justify-center gap-2 mt-5">
                {["Hi there!", "What can you do?", "Help me"].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="px-3 py-1.5 text-xs rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-emerald-300 hover:text-emerald-600 dark:hover:border-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""} animate-fade-in-up`}
              >
                {/* Avatar */}
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

                {/* Bubble */}
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
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    {msg.role === "assistant" && msg.content && (
                      <button
                        onClick={() => speakText(msg.id, msg.content)}
                        className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer"
                        type="button"
                      >
                        <Volume2 size={12} />
                        {speakingId === msg.id ? "Playing..." : "Play"}
                      </button>
                    )}
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

        {/* Input Area */}
        <div className="border-t border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-900 px-4 py-3">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                disabled={sending || voiceBusy || recording || !!pendingVoiceBlob}
                className="w-full resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 disabled:opacity-50 transition-all max-h-32"
                style={{ minHeight: "40px" }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "40px";
                  el.style.height = Math.min(el.scrollHeight, 128) + "px";
                }}
              />
            </div>
            <Button
              type="button"
              onClick={toggleRecording}
              disabled={sending || voiceBusy || !!pendingVoiceBlob}
              size="icon-sm"
              className={`rounded-xl h-10 w-10 shrink-0 transition-all ${
                recording
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
              } disabled:opacity-40`}
              title={recording ? "Stop recording" : "Start recording"}
            >
              {voiceBusy ? <Loader2 size={16} className="animate-spin" /> : recording ? <Square size={14} /> : <Mic size={16} />}
            </Button>
            {recording && (
              <Button
                type="button"
                onClick={cancelRecording}
                size="icon-sm"
                className="rounded-xl h-10 w-10 shrink-0 bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300"
                title="Cancel recording"
              >
                <X size={14} />
              </Button>
            )}
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || sending || voiceBusy || recording || !!pendingVoiceBlob}
              size="icon-sm"
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-10 w-10 shrink-0 shadow-md shadow-emerald-500/20 disabled:opacity-40 transition-all"
            >
              {sending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </Button>
          </div>
          {pendingVoiceBlob && (
            <div className="mt-2 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900/60 dark:bg-emerald-900/20">
              <p className="text-xs text-emerald-700 dark:text-emerald-200">
                Voice ready ({pendingVoiceSeconds}s). Send or cancel.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={cancelPendingVoice}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={sendPendingVoice}
                  className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  Send Voice
                </Button>
              </div>
            </div>
          )}
          <p className="text-[10px] text-gray-300 dark:text-gray-600 text-center mt-2">
            {recording
              ? "Recording... tap stop to review voice"
              : pendingVoiceBlob
              ? "Voice is ready. You can send or cancel."
              : voiceBusy
              ? "Transcribing voice..."
              : "Shift+Enter for new line"}
          </p>
        </div>
      </div>
  );
}

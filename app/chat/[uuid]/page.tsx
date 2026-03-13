"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ConversationService } from "@/lib/services/conversation-service";
import { ChatbotService } from "@/lib/services/chatbot-service";
import { PublicChatResponse } from "@/lib/types/conversation";
import { PublicChatbotConfig } from "@/lib/types/chatbot";
import { Bot, Send, User, Loader2, Sparkles, Mic, Square, Volume2, X } from "lucide-react";

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
  const searchParams = useSearchParams();
  const chatbotUuid = params.uuid as string;
  const isPreview = searchParams.get('preview') === '1';

  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [config, setConfig] = useState<PublicChatbotConfig | null>(null);
  const [recording, setRecording] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | number | null>(null);
  const [pendingVoiceBlob, setPendingVoiceBlob] = useState<Blob | null>(null);
  const [pendingVoiceSeconds, setPendingVoiceSeconds] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollTimersRef = useRef<Map<string, { close: () => void }>>(new Map());
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number | null>(null);
  const cancelRecordingRef = useRef(false);
  // Synchronous guard — React state updates are async and cannot reliably prevent
  // duplicate sends when the user presses Enter rapidly or during IME composition.
  const isSendingRef = useRef(false);

  // Derived theme values
  const primaryColor = (config?.widget?.theme_config?.primary_color as string) || "#10b981";
  const headerTitle = config?.ui?.header || config?.persona?.name || "Chat Assistant";
  const subHeaderText = config?.ui?.sub_header || "";
  const avatarUrl = config?.ui?.icon_avatar || "";
  const welcomeMsg = config?.interaction?.welcome_message || "How can I help you?";
  const quickQuestions = config?.interaction?.predefined_questions || [];

  // Fetch chatbot config
  useEffect(() => {
    ChatbotService.getPublicConfig(chatbotUuid, isPreview)
      .then(setConfig)
      .catch(() => {});
  }, [chatbotUuid, isPreview]);

  // Listen for real-time preview updates from settings page via postMessage
  useEffect(() => {
    if (!isPreview) return;
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== "BOTMION_PREVIEW_UPDATE") return;
      const incoming = event.data.config;
      if (!incoming) return;
      setConfig((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ui: { ...prev.ui, ...incoming.ui },
          persona: { ...prev.persona, ...incoming.persona },
          interaction: { ...prev.interaction, ...incoming.interaction },
          widget: prev.widget
            ? {
                ...prev.widget,
                theme_config: { ...prev.widget.theme_config, ...incoming.widget?.theme_config },
              }
            : prev.widget,
        } as typeof prev;
      });
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isPreview]);

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
      pollTimersRef.current.forEach((handle) => handle.close());
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

  const waitForResponse = useCallback((msgUuid: string) => {
    const handle = ConversationService.streamMessage(
      msgUuid,
      (data) => {
        pollTimersRef.current.delete(msgUuid);
        setMessages((prev) =>
          prev.map((m) =>
            m.uuid === msgUuid
              ? {
                  ...m,
                  content: data.status !== "timeout" ? data.content : "The response took too long. Please try again.",
                  status: data.status !== "timeout" ? data.status : "failed",
                }
              : m
          )
        );
      },
      () => {
        pollTimersRef.current.delete(msgUuid);
        setMessages((prev) =>
          prev.map((m) =>
            m.uuid === msgUuid
              ? { ...m, content: "Could not retrieve response. Please try again.", status: "failed" }
              : m
          )
        );
      },
    );
    pollTimersRef.current.set(msgUuid, handle);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isSendingRef.current || !sessionId) return;
    isSendingRef.current = true;

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
        waitForResponse(asst.uuid);
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
      isSendingRef.current = false;
      setSending(false);
    }
  };

  const handleVoiceUpload = async (audio: Blob) => {
    if (!sessionId || isSendingRef.current || !audio.size) return;
    isSendingRef.current = true;
    setVoiceBusy(true);

    const typingId = `typing-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: typingId, role: "assistant", content: "", timestamp: new Date().toISOString(), status: "typing" },
    ]);

    try {
      const response: PublicChatResponse = await ConversationService.publicAudioChat({
        audio,
        chatbot_uuid: chatbotUuid,
        session_id: sessionId,
        duration_ms: 0,
        language_hint: navigator.language.startsWith("bn") ? "bn" : "auto",
      });

      if (response.session_id) {
        const storageKey = `botmion_session_${chatbotUuid}`;
        localStorage.setItem(storageKey, response.session_id);
        setSessionId(response.session_id);
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
        waitForResponse(asst.uuid);
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
      isSendingRef.current = false;
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
    // Skip while IME is composing (e.g. Banglish / phonetic Bengali input)
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-800 shadow-sm"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shadow-md">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="w-full h-full rounded-xl object-cover" />
          ) : (
            <Bot className="text-white" size={20} />
          )}
        </div>
        <div>
          <h1 className="text-sm font-semibold text-white">
            {headerTitle}
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
            <span className="text-[11px] text-white/70 font-medium">
              {subHeaderText || "Online"}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Sparkles size={28} style={{ color: primaryColor }} />
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {welcomeMsg}
            </p>
            <p className="text-xs text-gray-400 max-w-65">
              Ask me anything and I&apos;ll do my best to help.
            </p>
            {quickQuestions.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-sm">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(q); }}
                    className="text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
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
                    ? "shadow-sm"
                    : "bg-blue-500 shadow-sm"
                }`}
                style={msg.role === "assistant" ? { background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` } : undefined}
              >
                {msg.role === "assistant" ? (
                  avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="w-full h-full rounded-lg object-cover" />
                  ) : (
                    <Bot size={13} className="text-white" />
                  )
                ) : (
                  <User size={13} className="text-white" />
                )}
              </div>

              {(msg.status === "typing" || msg.status === "processing") ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-700/50">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full animate-bounce [animation-delay:0ms]" style={{ backgroundColor: primaryColor }} />
                    <span className="w-2 h-2 rounded-full animate-bounce [animation-delay:150ms]" style={{ backgroundColor: primaryColor }} />
                    <span className="w-2 h-2 rounded-full animate-bounce [animation-delay:300ms]" style={{ backgroundColor: primaryColor }} />
                  </div>
                </div>
              ) : (
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
                    msg.role === "user"
                      ? "text-white rounded-tr-md"
                      : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700/50 rounded-tl-md"
                  } ${msg.status === "failed" ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300" : ""}`}
                  style={msg.role === "user" ? { backgroundColor: primaryColor } : undefined}
                >
                  <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
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
          <button
            type="button"
            onClick={toggleRecording}
            disabled={sending || voiceBusy || !!pendingVoiceBlob}
            className={`rounded-xl h-10 w-10 shrink-0 shadow-md transition-all flex items-center justify-center cursor-pointer ${
              recording ? "bg-red-500 text-white" : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
            } disabled:opacity-40`}
            title={recording ? "Stop recording" : "Start recording"}
          >
            {voiceBusy ? <Loader2 size={16} className="animate-spin" /> : recording ? <Square size={15} /> : <Mic size={16} />}
          </button>
          {recording && (
            <button
              type="button"
              onClick={cancelRecording}
              className="rounded-xl h-10 w-10 shrink-0 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300 shadow-md transition-all flex items-center justify-center cursor-pointer"
              title="Cancel recording"
            >
              <X size={15} />
            </button>
          )}
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending || voiceBusy || recording || !!pendingVoiceBlob}
            className="text-white rounded-xl h-10 w-10 shrink-0 shadow-md disabled:opacity-40 transition-all flex items-center justify-center cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            {sending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
        {pendingVoiceBlob && (
          <div className="mt-2 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900/60 dark:bg-emerald-900/20">
            <p className="text-xs text-emerald-700 dark:text-emerald-200">
              Voice ready ({pendingVoiceSeconds}s). Send or cancel.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelPendingVoice}
                className="text-xs px-2.5 py-1 rounded-md bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={sendPendingVoice}
                className="text-xs px-2.5 py-1 rounded-md text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Send Voice
              </button>
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
            : "Powered by Botmion"}
        </p>
      </div>
    </div>
  );
}

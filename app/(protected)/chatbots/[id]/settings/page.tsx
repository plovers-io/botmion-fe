"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatbotService } from "@/lib/services/chatbot-service";
import {
  Chatbot,
  BotType,
  BotStatus,
  ChatbotUpdateRequest,
  ResponseStyle,
  AnswerStyle,
  WindowSize,
} from "@/lib/types/chatbot";
import { goeyToast as toast } from "goey-toast";
import {
  ArrowLeft,
  Bot,
  Loader2,
  Save,
  Palette,
  Brain,
  Sliders,
  Shield,
  MessageSquare,
  Code2,
  Copy,
  Check,
  Plus,
  X,
  Settings2,
  Sparkles,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ─── Tab definitions ──────────────────────────────────────────────────────────

type SettingsTab =
  | "general"
  | "appearance"
  | "persona"
  | "ai"
  | "rag"
  | "interaction"
  | "embed";

const tabs: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { key: "general", label: "General", icon: <Settings2 size={16} /> },
  { key: "appearance", label: "Appearance", icon: <Palette size={16} /> },
  { key: "persona", label: "Persona", icon: <Sparkles size={16} /> },
  { key: "ai", label: "AI Tuning", icon: <Brain size={16} /> },
  { key: "rag", label: "RAG Config", icon: <Sliders size={16} /> },
  { key: "interaction", label: "Interaction", icon: <MessageSquare size={16} /> },
  { key: "embed", label: "Embed / Widget", icon: <Code2 size={16} /> },
];

// ─── Helper select options ────────────────────────────────────────────────────

const botTypes: { value: BotType; label: string }[] = [
  { value: "faq", label: "FAQ" },
  { value: "support", label: "Support" },
  { value: "sales", label: "Sales" },
  { value: "custom", label: "Custom" },
];

const botStatuses: { value: BotStatus; label: string; color: string }[] = [
  { value: "draft", label: "Draft", color: "bg-yellow-100 text-yellow-700" },
  { value: "published", label: "Published", color: "bg-green-100 text-green-700" },
  { value: "archived", label: "Archived", color: "bg-gray-100 text-gray-500" },
];

const responseStyles: { value: ResponseStyle; label: string; desc: string }[] = [
  { value: "chat", label: "Chat", desc: "Conversational, friendly tone" },
  { value: "gpt", label: "GPT", desc: "Precise, formal response style" },
];

const answerStyles: { value: AnswerStyle; label: string; desc: string }[] = [
  { value: "short", label: "Short", desc: "Brief, to-the-point answers" },
  { value: "balanced", label: "Balanced", desc: "Moderate detail" },
  { value: "detailed", label: "Detailed", desc: "Comprehensive responses" },
];

const windowSizes: { value: WindowSize; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "fullscreen", label: "Full Screen" },
];

// ─── Snapshot types for change tracking ───────────────────────────────────────

interface GeneralSnapshot {
  name: string;
  type: BotType;
  status: BotStatus;
}

interface AppearanceSnapshot {
  header: string;
  subHeader: string;
  iconAvatar: string;
  windowSize: WindowSize;
  primaryColor: string;
  widgetPosition: "bottom-right" | "bottom-left";
}

interface PersonaSnapshot {
  personaName: string;
  personalityPrompt: string;
}

interface AITuningSnapshot {
  modelName: string;
  responseStyle: ResponseStyle;
  answerStyle: AnswerStyle;
  maxTokens: number;
}

interface RAGSnapshot {
  topK: number;
  scoreThreshold: number;
  retrievalStrategy: string;
  includeSources: boolean;
  rerank: boolean;
}

interface InteractionSnapshot {
  welcomeMessage: string;
  popupMessage: string;
  fallbackMessage: string;
  predefinedQuestions: string[];
  requireNameEmail: boolean;
  collectFeedback: boolean;
}

interface EmbedSnapshot {
  allowedOrigins: string[];
}

// ─── Deep equality helper ─────────────────────────────────────────────────────

function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => isEqual(v, b[i]));
  }
  if (typeof a === "object" && a !== null && b !== null) {
    const ka = Object.keys(a as Record<string, unknown>);
    const kb = Object.keys(b as Record<string, unknown>);
    if (ka.length !== kb.length) return false;
    return ka.every((k) =>
      isEqual(
        (a as Record<string, unknown>)[k],
        (b as Record<string, unknown>)[k]
      )
    );
  }
  return false;
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function ChatbotSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const chatbotId = Number(params.id);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [bot, setBot] = useState<Chatbot | null>(null);

  // ─── Form state mirrors the Chatbot shape ──────────────────────────

  // General
  const [name, setName] = useState("");
  const [type, setType] = useState<BotType>("faq");
  const [status, setStatus] = useState<BotStatus>("draft");

  // Appearance / UI
  const [header, setHeader] = useState("");
  const [subHeader, setSubHeader] = useState("");
  const [iconAvatar, setIconAvatar] = useState("");
  const [windowSize, setWindowSize] = useState<WindowSize>("medium");
  const [primaryColor, setPrimaryColor] = useState("#10b981");
  const [widgetPosition, setWidgetPosition] = useState<"bottom-right" | "bottom-left">("bottom-right");

  // Persona
  const [personaName, setPersonaName] = useState("");
  const [personalityPrompt, setPersonalityPrompt] = useState("");

  // AI Tuning
  const [modelName, setModelName] = useState("gpt-4o-mini");
  const [responseStyle, setResponseStyle] = useState<ResponseStyle>("chat");
  const [answerStyle, setAnswerStyle] = useState<AnswerStyle>("balanced");
  const [maxTokens, setMaxTokens] = useState(1024);

  // RAG Config
  const [topK, setTopK] = useState(5);
  const [scoreThreshold, setScoreThreshold] = useState(0.2);
  const [retrievalStrategy, setRetrievalStrategy] = useState("similarity");
  const [includeSources, setIncludeSources] = useState(true);
  const [rerank, setRerank] = useState(false);

  // Interaction
  const [welcomeMessage, setWelcomeMessage] = useState("Hello! How can I help you?");
  const [popupMessage, setPopupMessage] = useState("");
  const [fallbackMessage, setFallbackMessage] = useState("");
  const [predefinedQuestions, setPredefinedQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [requireNameEmail, setRequireNameEmail] = useState(false);
  const [collectFeedback, setCollectFeedback] = useState(false);

  // Embed / widget security
  const [allowedOrigins, setAllowedOrigins] = useState<string[]>([]);
  const [newOrigin, setNewOrigin] = useState("");

  // Embed copy state
  const [copiedSnippet, setCopiedSnippet] = useState<"script" | "iframe" | null>(null);

  // Preview refresh key
  const [previewKey, setPreviewKey] = useState(0);

  // ─── Snapshots for change detection per section ─────────────────────

  const [generalSnap, setGeneralSnap] = useState<GeneralSnapshot | null>(null);
  const [appearanceSnap, setAppearanceSnap] = useState<AppearanceSnapshot | null>(null);
  const [personaSnap, setPersonaSnap] = useState<PersonaSnapshot | null>(null);
  const [aiSnap, setAiSnap] = useState<AITuningSnapshot | null>(null);
  const [ragSnap, setRagSnap] = useState<RAGSnapshot | null>(null);
  const [interactionSnap, setInteractionSnap] = useState<InteractionSnapshot | null>(null);
  const [embedSnap, setEmbedSnap] = useState<EmbedSnapshot | null>(null);

  // ─── Current values as snapshot objects ─────────────────────────────

  const currentGeneral: GeneralSnapshot = useMemo(
    () => ({ name: name.trim(), type, status }),
    [name, type, status]
  );
  const currentAppearance: AppearanceSnapshot = useMemo(
    () => ({ header, subHeader, iconAvatar, windowSize, primaryColor, widgetPosition }),
    [header, subHeader, iconAvatar, windowSize, primaryColor, widgetPosition]
  );
  const currentPersona: PersonaSnapshot = useMemo(
    () => ({ personaName, personalityPrompt }),
    [personaName, personalityPrompt]
  );
  const currentAI: AITuningSnapshot = useMemo(
    () => ({ modelName, responseStyle, answerStyle, maxTokens }),
    [modelName, responseStyle, answerStyle, maxTokens]
  );
  const currentRAG: RAGSnapshot = useMemo(
    () => ({ topK, scoreThreshold, retrievalStrategy, includeSources, rerank }),
    [topK, scoreThreshold, retrievalStrategy, includeSources, rerank]
  );
  const currentInteraction: InteractionSnapshot = useMemo(
    () => ({
      welcomeMessage,
      popupMessage,
      fallbackMessage,
      predefinedQuestions: [...predefinedQuestions],
      requireNameEmail,
      collectFeedback,
    }),
    [welcomeMessage, popupMessage, fallbackMessage, predefinedQuestions, requireNameEmail, collectFeedback]
  );
  const currentEmbed: EmbedSnapshot = useMemo(
    () => ({
      allowedOrigins: [...allowedOrigins],
    }),
    [allowedOrigins]
  );

  // ─── Section dirty detection ────────────────────────────────────────

  const generalDirty = generalSnap ? !isEqual(currentGeneral, generalSnap) : false;
  const appearanceDirty = appearanceSnap ? !isEqual(currentAppearance, appearanceSnap) : false;
  const personaDirty = personaSnap ? !isEqual(currentPersona, personaSnap) : false;
  const aiDirty = aiSnap ? !isEqual(currentAI, aiSnap) : false;
  const ragDirty = ragSnap ? !isEqual(currentRAG, ragSnap) : false;
  const interactionDirty = interactionSnap ? !isEqual(currentInteraction, interactionSnap) : false;
  const embedDirty = embedSnap ? !isEqual(currentEmbed, embedSnap) : false;

  const isDirtyMap: Record<SettingsTab, boolean> = {
    general: generalDirty,
    appearance: appearanceDirty,
    persona: personaDirty,
    ai: aiDirty,
    rag: ragDirty,
    interaction: interactionDirty,
    embed: embedDirty,
  };

  // ─── Send preview updates to iframe via postMessage ─────────────────

  const sendPreviewUpdate = useCallback(() => {
    const iframe = previewIframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      {
        type: "BOTMION_PREVIEW_UPDATE",
        config: {
          ui: { header, sub_header: subHeader, icon_avatar: iconAvatar, window_size: windowSize },
          persona: { name: personaName },
          interaction: {
            welcome_message: welcomeMessage,
            predefined_questions: predefinedQuestions,
          },
          widget: { theme_config: { primary_color: primaryColor, position: widgetPosition } },
        },
      },
      "*"
    );
  }, [header, subHeader, iconAvatar, windowSize, personaName, welcomeMessage, predefinedQuestions, primaryColor, widgetPosition]);

  // Send preview update whenever visual settings change
  useEffect(() => {
    sendPreviewUpdate();
  }, [sendPreviewUpdate]);

  // ─── Load chatbot ───────────────────────────────────────────────────

  const loadBot = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ChatbotService.getChatbot(chatbotId);
      setBot(data);
      populateForm(data);
    } catch {
      toast.error("Load Failed", { description: "Could not load chatbot settings" });
      router.push("/chatbots");
    } finally {
      setLoading(false);
    }
  }, [chatbotId, router]);

  useEffect(() => {
    if (chatbotId) loadBot();
  }, [chatbotId, loadBot]);

  const populateForm = (b: Chatbot) => {
    const n = b.name;
    const t = b.type;
    const s = b.status;
    setName(n);
    setType(t);
    setStatus(s);

    const h = b.ui?.header || "";
    const sh = b.ui?.sub_header || "";
    const ia = b.ui?.icon_avatar || "";
    const ws = b.ui?.window_size || "medium";
    setHeader(h);
    setSubHeader(sh);
    setIconAvatar(ia);
    setWindowSize(ws);

    const theme = b.widget?.theme_config;
    const pc = (theme?.primary_color as string) || "#10b981";
    const wp = (theme?.position as "bottom-right" | "bottom-left") || "bottom-right";
    setPrimaryColor(pc);
    setWidgetPosition(wp);

    const pn = b.persona?.name || "";
    const pp = b.persona?.personality_prompt || "";
    setPersonaName(pn);
    setPersonalityPrompt(pp);

    const mn = b.ai_tuning?.model_name || "gpt-4o-mini";
    const rs = b.ai_tuning?.response_style || "chat";
    const as_ = b.ai_tuning?.answer_style || "balanced";
    const mt = b.ai_tuning?.max_tokens || 1024;
    setModelName(mn);
    setResponseStyle(rs);
    setAnswerStyle(as_);
    setMaxTokens(mt);

    const tk = b.rag_config?.top_k ?? 5;
    const st = b.rag_config?.score_threshold ?? 0.2;
    const retrStrat = b.rag_config?.retrieval_strategy || "similarity";
    const is_ = b.rag_config?.include_sources ?? true;
    const rr = b.rag_config?.rerank ?? false;
    setTopK(tk);
    setScoreThreshold(st);
    setRetrievalStrategy(retrStrat);
    setIncludeSources(is_);
    setRerank(rr);

    const wm = b.interaction?.welcome_message || "Hello! How can I help you?";
    const pm = b.interaction?.popup_message || "";
    const fm = b.interaction?.fallback_message || "";
    const pq = b.interaction?.predefined_questions || [];
    const rne = b.interaction?.require_name_email || false;
    const cf = b.interaction?.collect_feedback || false;
    setWelcomeMessage(wm);
    setPopupMessage(pm);
    setFallbackMessage(fm);
    setPredefinedQuestions(pq);
    setRequireNameEmail(rne);
    setCollectFeedback(cf);
    const ao = [...(b.widget?.allowed_origins || [])];
    setAllowedOrigins(ao);
    setNewOrigin("");

    // Set snapshots
    setGeneralSnap({ name: n, type: t, status: s });
    setAppearanceSnap({ header: h, subHeader: sh, iconAvatar: ia, windowSize: ws, primaryColor: pc, widgetPosition: wp });
    setPersonaSnap({ personaName: pn, personalityPrompt: pp });
    setAiSnap({ modelName: mn, responseStyle: rs, answerStyle: as_, maxTokens: mt });
    setRagSnap({ topK: tk, scoreThreshold: st, retrievalStrategy: retrStrat, includeSources: is_, rerank: rr });
    setInteractionSnap({ welcomeMessage: wm, popupMessage: pm, fallbackMessage: fm, predefinedQuestions: [...pq], requireNameEmail: rne, collectFeedback: cf });
    setEmbedSnap({ allowedOrigins: [...ao] });
  };

  // ─── Build payload for only the changed section ─────────────────────

  const buildSectionPayload = (tab: SettingsTab): ChatbotUpdateRequest | null => {
    switch (tab) {
      case "general":
        if (!generalDirty) return null;
        {
          const p: ChatbotUpdateRequest = {};
          if (generalSnap && name.trim() !== generalSnap.name) p.name = name.trim();
          if (generalSnap && type !== generalSnap.type) p.type = type;
          if (generalSnap && status !== generalSnap.status) p.status = status;
          return Object.keys(p).length ? p : null;
        }
      case "appearance":
        if (!appearanceDirty) return null;
        {
          const uiChanges: Record<string, unknown> = {};
          const widgetChanges: Record<string, unknown> = {};
          if (appearanceSnap) {
            if (header !== appearanceSnap.header) uiChanges.header = header;
            if (subHeader !== appearanceSnap.subHeader) uiChanges.sub_header = subHeader;
            if (iconAvatar !== appearanceSnap.iconAvatar) uiChanges.icon_avatar = iconAvatar;
            if (windowSize !== appearanceSnap.windowSize) uiChanges.window_size = windowSize;
            if (primaryColor !== appearanceSnap.primaryColor) widgetChanges.primary_color = primaryColor;
            if (widgetPosition !== appearanceSnap.widgetPosition) widgetChanges.position = widgetPosition;
          }
          const p: ChatbotUpdateRequest = {};
          if (Object.keys(uiChanges).length) p.ui = uiChanges as ChatbotUpdateRequest["ui"];
          if (Object.keys(widgetChanges).length) p.widget = { theme_config: widgetChanges };
          return Object.keys(p).length ? p : null;
        }
      case "persona":
        if (!personaDirty) return null;
        {
          const changes: Record<string, unknown> = {};
          if (personaSnap) {
            if (personaName !== personaSnap.personaName) changes.name = personaName;
            if (personalityPrompt !== personaSnap.personalityPrompt)
              changes.personality_prompt = personalityPrompt;
          }
          return Object.keys(changes).length ? { persona: changes as ChatbotUpdateRequest["persona"] } : null;
        }
      case "ai":
        if (!aiDirty) return null;
        {
          const changes: Record<string, unknown> = {};
          if (aiSnap) {
            if (modelName !== aiSnap.modelName) changes.model_name = modelName;
            if (responseStyle !== aiSnap.responseStyle) changes.response_style = responseStyle;
            if (answerStyle !== aiSnap.answerStyle) changes.answer_style = answerStyle;
            if (maxTokens !== aiSnap.maxTokens) changes.max_tokens = maxTokens;
          }
          return Object.keys(changes).length ? { ai_tuning: changes as ChatbotUpdateRequest["ai_tuning"] } : null;
        }
      case "rag":
        if (!ragDirty) return null;
        {
          const changes: Record<string, unknown> = {};
          if (ragSnap) {
            if (topK !== ragSnap.topK) changes.top_k = topK;
            if (scoreThreshold !== ragSnap.scoreThreshold) changes.score_threshold = scoreThreshold;
            if (retrievalStrategy !== ragSnap.retrievalStrategy) changes.retrieval_strategy = retrievalStrategy;
            if (includeSources !== ragSnap.includeSources) changes.include_sources = includeSources;
            if (rerank !== ragSnap.rerank) changes.rerank = rerank;
          }
          return Object.keys(changes).length ? { rag_config: changes as ChatbotUpdateRequest["rag_config"] } : null;
        }
      case "interaction":
        if (!interactionDirty) return null;
        {
          const changes: Record<string, unknown> = {};
          if (interactionSnap) {
            if (welcomeMessage !== interactionSnap.welcomeMessage) changes.welcome_message = welcomeMessage;
            if (popupMessage !== interactionSnap.popupMessage) changes.popup_message = popupMessage;
            if (fallbackMessage !== interactionSnap.fallbackMessage) changes.fallback_message = fallbackMessage;
            if (!isEqual(predefinedQuestions, interactionSnap.predefinedQuestions))
              changes.predefined_questions = predefinedQuestions;
            if (requireNameEmail !== interactionSnap.requireNameEmail) changes.require_name_email = requireNameEmail;
            if (collectFeedback !== interactionSnap.collectFeedback) changes.collect_feedback = collectFeedback;
          }
          return Object.keys(changes).length ? { interaction: changes as ChatbotUpdateRequest["interaction"] } : null;
        }
      case "embed":
        if (!embedDirty) return null;
        return {
          widget: {
            allowed_origins: [...allowedOrigins],
          },
        };
      default:
        return null;
    }
  };

  // ─── Per-section save handler ───────────────────────────────────────

  const handleSectionSave = async (tab: SettingsTab) => {
    if (!bot) return;
    const payload = buildSectionPayload(tab);
    if (!payload) return;

    setSaving(true);
    try {
      const updated = await ChatbotService.updateChatbot(bot.id, payload);
      setBot(updated);
      // Update only the snapshot for this section (keep other sections' dirty state)
      updateSnapshot(tab, updated);
      setPreviewKey((k) => k + 1);
      toast.success("Saved", { description: `${tabs.find((t) => t.key === tab)?.label} settings saved` });
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error("Save Failed", { description: err?.message || "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  const updateSnapshot = (tab: SettingsTab, b: Chatbot) => {
    switch (tab) {
      case "general":
        setGeneralSnap({ name: b.name, type: b.type, status: b.status });
        break;
      case "appearance": {
        const theme = b.widget?.theme_config;
        setAppearanceSnap({
          header: b.ui?.header || "",
          subHeader: b.ui?.sub_header || "",
          iconAvatar: b.ui?.icon_avatar || "",
          windowSize: b.ui?.window_size || "medium",
          primaryColor: (theme?.primary_color as string) || "#10b981",
          widgetPosition: (theme?.position as "bottom-right" | "bottom-left") || "bottom-right",
        });
        break;
      }
      case "persona":
        setPersonaSnap({ personaName: b.persona?.name || "", personalityPrompt: b.persona?.personality_prompt || "" });
        break;
      case "ai":
        setAiSnap({
          modelName: b.ai_tuning?.model_name || "gpt-4o-mini",
          responseStyle: b.ai_tuning?.response_style || "chat",
          answerStyle: b.ai_tuning?.answer_style || "balanced",
          maxTokens: b.ai_tuning?.max_tokens || 1024,
        });
        break;
      case "rag":
        setRagSnap({
          topK: b.rag_config?.top_k ?? 5,
          scoreThreshold: b.rag_config?.score_threshold ?? 0.2,
          retrievalStrategy: b.rag_config?.retrieval_strategy || "similarity",
          includeSources: b.rag_config?.include_sources ?? true,
          rerank: b.rag_config?.rerank ?? false,
        });
        break;
      case "interaction":
        setInteractionSnap({
          welcomeMessage: b.interaction?.welcome_message || "",
          popupMessage: b.interaction?.popup_message || "",
          fallbackMessage: b.interaction?.fallback_message || "",
          predefinedQuestions: [...(b.interaction?.predefined_questions || [])],
          requireNameEmail: b.interaction?.require_name_email || false,
          collectFeedback: b.interaction?.collect_feedback || false,
        });
        break;
      case "embed":
        setEmbedSnap({
          allowedOrigins: [...(b.widget?.allowed_origins || [])],
        });
        setAllowedOrigins([...(b.widget?.allowed_origins || [])]);
        setNewOrigin("");
        break;
    }
  };

  const normalizeOrigin = (value: string) => {
    const raw = value.trim();
    if (!raw) return "";
    try {
      const url = new URL(raw);
      if (!["http:", "https:"].includes(url.protocol)) return "";
      return `${url.protocol}//${url.host}`.toLowerCase();
    } catch {
      return "";
    }
  };

  const addAllowedOrigin = () => {
    const normalized = normalizeOrigin(newOrigin);
    if (!normalized) {
      toast.error("Invalid Origin", {
        description: "Use full origin format like https://example.com",
      });
      return;
    }
    if (allowedOrigins.includes(normalized)) {
      toast.info("Already Added", { description: "This domain already exists." });
      return;
    }
    setAllowedOrigins((prev) => [...prev, normalized]);
    setNewOrigin("");
  };

  const removeAllowedOrigin = (origin: string) => {
    setAllowedOrigins((prev) => prev.filter((item) => item !== origin));
  };

  // ─── Tab switch with auto-save prompt ───────────────────────────────

  const switchTab = (newTab: SettingsTab) => {
    if (activeTab !== newTab && isDirtyMap[activeTab]) {
      const shouldSave = window.confirm(
        `You have unsaved changes in ${tabs.find((t) => t.key === activeTab)?.label}. Save before switching?`
      );
      if (shouldSave) {
        handleSectionSave(activeTab).then(() => setActiveTab(newTab));
        return;
      }
      // Discard: reload snapshot values for current tab
      if (bot) populateForm(bot);
    }
    setActiveTab(newTab);
  };

  // ─── Predefined questions helpers ──────────────────────────────────

  const addQuestion = () => {
    if (newQuestion.trim() && predefinedQuestions.length < 10) {
      setPredefinedQuestions((prev) => [...prev, newQuestion.trim()]);
      setNewQuestion("");
    }
  };

  const removeQuestion = (idx: number) => {
    setPredefinedQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  // ─── Copy embed snippet ───────────────────────────────────────────

  const copySnippet = (type: "script" | "iframe") => {
    if (!bot) return;
    const text =
      type === "script"
        ? `<script src="${ChatbotService.getEmbedScriptUrl(bot.uuid)}" async></script>`
        : `<iframe\n  src="${ChatbotService.getIframeUrl(bot.uuid)}"\n  width="400"\n  height="600"\n  frameborder="0"\n  style="border:none; border-radius:12px; box-shadow:0 4px 24px rgba(0,0,0,0.12);"\n></iframe>`;
    navigator.clipboard.writeText(text);
    setCopiedSnippet(type);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  // ─── Save button component ─────────────────────────────────────────

  const SectionSaveButton = ({ tab }: { tab: SettingsTab }) => {
    const dirty = isDirtyMap[tab];
    return (
      <Button
        onClick={() => handleSectionSave(tab)}
        disabled={saving || !dirty}
        size="sm"
        className={`transition-all ${
          dirty
            ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
            : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
        }`}
      >
        {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
        {saving ? "Saving..." : dirty ? "Save Changes" : "No Changes"}
      </Button>
    );
  };

  // ─── Loading state ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Loader2 className="animate-spin text-emerald-600" size={28} />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!bot) return null;

  // ─── Embed snippets ────────────────────────────────────────────────

  const scriptSnippet = `<script src="${ChatbotService.getEmbedScriptUrl(bot.uuid)}" async></script>`;
  const iframeSnippet = `<iframe\n  src="${ChatbotService.getIframeUrl(bot.uuid)}"\n  width="400"\n  height="600"\n  frameborder="0"\n  style="border:none; border-radius:12px; box-shadow:0 4px 24px rgba(0,0,0,0.12);"\n></iframe>`;
  const usesLocalhostEmbed =
    scriptSnippet.includes("localhost") ||
    scriptSnippet.includes("127.0.0.1") ||
    iframeSnippet.includes("localhost") ||
    iframeSnippet.includes("127.0.0.1");

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="p-4 lg:p-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => router.push("/chatbots")}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Bot className="text-white" size={16} />
              </div>
              {bot.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
              Customize every aspect of your chatbot
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-5">
        {/* ─── Left: Settings Area ─────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex gap-4">
          {/* ─── Sidebar Tabs ──────────────────────────────────────── */}
          <div className="w-44 shrink-0 hidden lg:block">
            <nav className="space-y-0.5 sticky top-24">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => switchTab(tab.key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeTab === tab.key
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {isDirtyMap[tab.key] && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-amber-400" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* ─── Mobile Tab Bar ──────────────────────────────────── */}
          <div className="lg:hidden mb-3 w-full overflow-x-auto">
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => switchTab(tab.key)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === tab.key
                      ? "bg-white dark:bg-gray-700 text-emerald-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                  {isDirtyMap[tab.key] && " •"}
                </button>
              ))}
            </div>
          </div>

          {/* ─── Tab Content ─────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
          {/* General Tab */}
          {activeTab === "general" && (
            <Card className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border-gray-100 dark:border-gray-700/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <Settings2 size={18} className="text-emerald-600" />
                    General Settings
                  </CardTitle>
                  <SectionSaveButton tab="general" />
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Chatbot Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Chatbot" />
                </div>

                <div className="space-y-2">
                  <Label>Bot Type</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {botTypes.map((bt) => (
                      <button
                        key={bt.value}
                        onClick={() => setType(bt.value)}
                        className={`p-3 rounded-lg border-2 text-center text-sm font-medium transition-all cursor-pointer ${
                          type === bt.value
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700"
                            : "border-gray-200 dark:border-gray-700 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {bt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex gap-3">
                    {botStatuses.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setStatus(s.value)}
                        className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer ${
                          status === s.value
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <Badge variant="secondary" className={s.color}>
                          {s.label}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">UUID</p>
                  <code className="text-sm text-gray-700 dark:text-gray-300 font-mono">{bot.uuid}</code>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <Card className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border-gray-100 dark:border-gray-700/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <Palette size={18} className="text-emerald-600" />
                    Appearance
                  </CardTitle>
                  <SectionSaveButton tab="appearance" />
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label>Header Title</Label>
                    <Input value={header} onChange={(e) => setHeader(e.target.value)} placeholder="Chat Assistant" />
                  </div>
                  <div className="space-y-2">
                    <Label>Sub Header</Label>
                    <Input value={subHeader} onChange={(e) => setSubHeader(e.target.value)} placeholder="We're here to help" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Icon / Avatar URL</Label>
                  <Input value={iconAvatar} onChange={(e) => setIconAvatar(e.target.value)} placeholder="https://example.com/icon.png" />
                  {iconAvatar && (
                    <div className="mt-2 w-12 h-12 rounded-xl overflow-hidden border border-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={iconAvatar} alt="Bot avatar" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Chat Window Size</Label>
                  <div className="flex gap-3">
                    {windowSizes.map((ws) => (
                      <button
                        key={ws.value}
                        onClick={() => setWindowSize(ws.value)}
                        className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer ${
                          windowSize === ws.value
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700"
                            : "border-gray-200 dark:border-gray-700 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {ws.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-32 font-mono text-sm"
                        placeholder="#10b981"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Widget Position</Label>
                    <div className="flex gap-3">
                      {(["bottom-right", "bottom-left"] as const).map((pos) => (
                        <button
                          key={pos}
                          onClick={() => setWidgetPosition(pos)}
                          className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer capitalize ${
                            widgetPosition === pos
                              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700"
                              : "border-gray-200 dark:border-gray-700 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {pos.replace("-", " ")}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Preview */}
                <Separator />
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden max-w-sm">
                    <div
                      className="px-4 py-3 flex items-center gap-3"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                        {iconAvatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={iconAvatar} alt="" className="w-full h-full rounded-xl object-cover" />
                        ) : (
                          <Bot size={18} className="text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold">{header || "Chat Assistant"}</p>
                        {subHeader && <p className="text-white/70 text-xs">{subHeader}</p>}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 px-4 py-6 text-center">
                      <p className="text-xs text-gray-400">Chat preview area</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Persona Tab */}
          {activeTab === "persona" && (
            <Card className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border-gray-100 dark:border-gray-700/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <Sparkles size={18} className="text-emerald-600" />
                    Persona & Personality
                  </CardTitle>
                  <SectionSaveButton tab="persona" />
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Persona Name</Label>
                  <Input
                    value={personaName}
                    onChange={(e) => setPersonaName(e.target.value)}
                    placeholder="e.g. Aria, Botmion Assistant"
                  />
                  <p className="text-xs text-gray-400">The name your chatbot will use when referring to itself.</p>
                </div>

                <div className="space-y-2">
                  <Label>Personality Prompt (System Instruction)</Label>
                  <Textarea
                    value={personalityPrompt}
                    onChange={(e) => setPersonalityPrompt(e.target.value)}
                    rows={8}
                    placeholder="You are a helpful customer support agent. Be polite, concise, and always try to resolve the user's issue..."
                    className="resize-none font-mono text-sm"
                  />
                  <p className="text-xs text-gray-400">
                    This prompt defines the personality and behaviour of your chatbot. It is sent as the system message in every conversation.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Tuning Tab */}
          {activeTab === "ai" && (
            <Card className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border-gray-100 dark:border-gray-700/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <Brain size={18} className="text-emerald-600" />
                    AI Tuning
                  </CardTitle>
                  <SectionSaveButton tab="ai" />
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>AI Model</Label>
                  <Input
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="gpt-4o-mini"
                  />
                  <p className="text-xs text-gray-400">OpenAI model to use (e.g. gpt-4o, gpt-4o-mini, gpt-3.5-turbo).</p>
                </div>

                <div className="space-y-2">
                  <Label>Response Style</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {responseStyles.map((rs) => (
                      <button
                        key={rs.value}
                        onClick={() => setResponseStyle(rs.value)}
                        className={`p-3 rounded-lg border-2 text-left transition-all cursor-pointer ${
                          responseStyle === rs.value
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{rs.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{rs.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Answer Length</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {answerStyles.map((as) => (
                      <button
                        key={as.value}
                        onClick={() => setAnswerStyle(as.value)}
                        className={`p-3 rounded-lg border-2 text-center transition-all cursor-pointer ${
                          answerStyle === as.value
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{as.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{as.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Max Tokens</Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={128}
                      max={4096}
                      step={128}
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(Number(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <span className="text-sm font-mono text-gray-700 dark:text-gray-300 w-16 text-right">{maxTokens}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* RAG Config Tab */}
          {activeTab === "rag" && (
            <Card className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border-gray-100 dark:border-gray-700/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <Sliders size={18} className="text-emerald-600" />
                    RAG Configuration
                  </CardTitle>
                  <SectionSaveButton tab="rag" />
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label>Top K (chunks to retrieve)</Label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min={1}
                        max={20}
                        value={topK}
                        onChange={(e) => setTopK(Number(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <span className="text-sm font-mono text-gray-700 dark:text-gray-300 w-8 text-right">{topK}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Score Threshold</Label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={scoreThreshold}
                        onChange={(e) => setScoreThreshold(Number(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <span className="text-sm font-mono text-gray-700 dark:text-gray-300 w-12 text-right">
                        {scoreThreshold.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Retrieval Strategy</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {["similarity", "mmr"].map((strat) => (
                      <button
                        key={strat}
                        onClick={() => setRetrievalStrategy(strat)}
                        className={`p-3 rounded-lg border-2 text-center text-sm font-medium transition-all cursor-pointer capitalize ${
                          retrievalStrategy === strat
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700"
                            : "border-gray-200 dark:border-gray-700 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {strat === "similarity" ? "Cosine Similarity" : "MMR (Max Marginal Relevance)"}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={includeSources}
                      onChange={(e) => setIncludeSources(e.target.checked)}
                      className="w-4 h-4 rounded accent-emerald-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Include Sources</p>
                      <p className="text-xs text-gray-500">Show source documents in responses</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={rerank}
                      onChange={(e) => setRerank(e.target.checked)}
                      className="w-4 h-4 rounded accent-emerald-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Re-rank Results</p>
                      <p className="text-xs text-gray-500">Re-rank retrieved chunks for better accuracy</p>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interaction Tab */}
          {activeTab === "interaction" && (
            <Card className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border-gray-100 dark:border-gray-700/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <MessageSquare size={18} className="text-emerald-600" />
                    Interaction Settings
                  </CardTitle>
                  <SectionSaveButton tab="interaction" />
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Welcome Message</Label>
                  <Textarea
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    rows={3}
                    placeholder="Hello! How can I help you today?"
                    className="resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label>Popup Message</Label>
                    <Input
                      value={popupMessage}
                      onChange={(e) => setPopupMessage(e.target.value)}
                      placeholder="Need help? Click here to chat!"
                    />
                    <p className="text-xs text-gray-400">Shows as a tooltip near the chat bubble.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Fallback Message</Label>
                    <Input
                      value={fallbackMessage}
                      onChange={(e) => setFallbackMessage(e.target.value)}
                      placeholder="I'm unable to answer that. Want to speak to an agent?"
                    />
                    <p className="text-xs text-gray-400">Shown when the bot can&apos;t find an answer.</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Predefined Quick Questions</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addQuestion()}
                      placeholder="Add a quick question..."
                      className="flex-1"
                    />
                    <Button
                      onClick={addQuestion}
                      disabled={!newQuestion.trim() || predefinedQuestions.length >= 10}
                      size="sm"
                      variant="outline"
                    >
                      <Plus size={14} />
                      Add
                    </Button>
                  </div>
                  {predefinedQuestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {predefinedQuestions.map((q, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm px-3 py-1.5 rounded-lg"
                        >
                          <span className="max-w-48 truncate">{q}</span>
                          <button onClick={() => removeQuestion(i)} className="hover:text-red-500 cursor-pointer">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400">
                    {predefinedQuestions.length}/10 — These appear as suggestion chips in the chat widget.
                  </p>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={requireNameEmail}
                      onChange={(e) => setRequireNameEmail(e.target.checked)}
                      className="w-4 h-4 rounded accent-emerald-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Require Name & Email</p>
                      <p className="text-xs text-gray-500">Collect visitor info before chat starts</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={collectFeedback}
                      onChange={(e) => setCollectFeedback(e.target.checked)}
                      className="w-4 h-4 rounded accent-emerald-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Collect Feedback</p>
                      <p className="text-xs text-gray-500">Allow users to rate bot responses</p>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Embed / Widget Tab */}
          {activeTab === "embed" && (
            <div className="space-y-5">
              <Card className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border-gray-100 dark:border-gray-700/50 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-3 text-base">
                      <Shield size={18} className="text-emerald-600" />
                      Allowed Domains
                    </CardTitle>
                    <SectionSaveButton tab="embed" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-500">
                    Only these site origins can load widget config and send public widget messages.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={newOrigin}
                      onChange={(e) => setNewOrigin(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addAllowedOrigin()}
                      placeholder="https://example.com"
                      className="font-mono"
                    />
                    <Button type="button" variant="outline" onClick={addAllowedOrigin}>
                      <Plus size={14} />
                      Add
                    </Button>
                  </div>

                  {allowedOrigins.length === 0 ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      No domain configured. In production, add your web app domains before embedding.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {allowedOrigins.map((origin) => (
                        <div
                          key={origin}
                          className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300"
                        >
                          <span className="font-mono">{origin}</span>
                          <button
                            type="button"
                            onClick={() => removeAllowedOrigin(origin)}
                            className="hover:text-red-500"
                            aria-label={`Remove ${origin}`}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status notice */}
              {bot.status !== "published" && (
                <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
                  <Shield size={18} className="text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-400">Chatbot Not Published</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-500">
                      Set the chatbot status to <strong>Published</strong> in the General tab for the widget to work on external sites.
                    </p>
                  </div>
                </div>
              )}

              {/* Script Tag Embed */}
              <Card className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border-gray-100 dark:border-gray-700/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-base">
                    <Code2 size={18} className="text-emerald-600" />
                    JavaScript Snippet
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-500">
                    Add this script tag to your website&apos;s HTML just before the closing <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">&lt;/body&gt;</code> tag. A floating chat bubble will appear.
                  </p>
                  <div className="relative">
                    <pre className="bg-gray-900 text-green-400 text-sm p-4 rounded-xl overflow-x-auto font-mono">
                      {scriptSnippet}
                    </pre>
                    <Button
                      onClick={() => copySnippet("script")}
                      size="icon-sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700"
                    >
                      {copiedSnippet === "script" ? <Check size={14} /> : <Copy size={14} />}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Iframe Embed */}
              <Card className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border-gray-100 dark:border-gray-700/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-base">
                    <Globe size={18} className="text-emerald-600" />
                    Iframe Embed
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-500">
                    Embed the chatbot directly into a page section using an iframe.
                  </p>
                  <div className="relative">
                    <pre className="bg-gray-900 text-green-400 text-sm p-4 rounded-xl overflow-x-auto font-mono whitespace-pre">
                      {iframeSnippet}
                    </pre>
                    <Button
                      onClick={() => copySnippet("iframe")}
                      size="icon-sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700"
                    >
                      {copiedSnippet === "iframe" ? <Check size={14} /> : <Copy size={14} />}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Direct Link */}
              <Card className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border-gray-100 dark:border-gray-700/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-base">
                    <Globe size={18} className="text-emerald-600" />
                    Direct Link
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Input
                      value={ChatbotService.getIframeUrl(bot.uuid)}
                      readOnly
                      className="font-mono text-sm flex-1"
                    />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(ChatbotService.getIframeUrl(bot.uuid));
                        toast.success("Copied!", { description: "Direct link copied to clipboard" });
                      }}
                      size="sm"
                      variant="outline"
                    >
                      <Copy size={14} />
                      Copy
                    </Button>
                    <Button
                      onClick={() => window.open(ChatbotService.getIframeUrl(bot.uuid), "_blank")}
                      size="sm"
                      variant="outline"
                    >
                      Open
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        </div>

        {/* ─── Right: Live Preview ─────────────────────────────────── */}
        <div className="w-[380px] shrink-0 hidden xl:block">
          <div className="sticky top-24">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Live Preview</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewKey((k) => k + 1)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Refresh
              </Button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg bg-white dark:bg-gray-900" style={{ height: "600px" }}>
              <iframe
                ref={previewIframeRef}
                key={previewKey}
                src={ChatbotService.getIframeUrl(bot.uuid, true)}
                className="w-full h-full border-0"
                title="Chatbot Preview"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Changes are previewed in real-time. Save to persist.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

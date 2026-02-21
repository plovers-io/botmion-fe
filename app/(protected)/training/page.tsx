"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/store/auth-store-v2";
import { ChatbotService } from "@/lib/services/chatbot-service";
import { TrainingService } from "@/lib/services/training-service";
import { Chatbot } from "@/lib/types/chatbot";
import {
  KnowledgeSource,
  Document,
  DocumentDetail,
  DocumentStatus,
} from "@/lib/types/training";
import { toast } from "react-toastify";
import {
  Brain,
  Bot,
  Loader2,
  Plus,
  FileText,
  Globe,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Zap,
  Upload,
  ChevronDown,
  BookOpen,
  Eye,
  Hash,
  Calendar,
  File as FileIcon,
} from "lucide-react";

// ─── Status config ────────────────────────────────────────────────────────────

const statusConfig: Record<
  DocumentStatus,
  { label: string; icon: React.ReactNode; color: string }
> = {
  pending: {
    label: "Pending",
    icon: <Clock size={14} />,
    color: "bg-yellow-100 text-yellow-700",
  },
  processing: {
    label: "Processing",
    icon: <Loader2 size={14} className="animate-spin" />,
    color: "bg-blue-100 text-blue-700",
  },
  completed: {
    label: "Trained",
    icon: <CheckCircle2 size={14} />,
    color: "bg-green-100 text-green-700",
  },
  failed: {
    label: "Failed",
    icon: <AlertTriangle size={14} />,
    color: "bg-red-100 text-red-700",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function TrainingPage() {
  const { user } = useAuthStore();

  // Data state
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [selectedChatbotId, setSelectedChatbotId] = useState<number | null>(null);

  // Source creation modal
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [sourceName, setSourceName] = useState("");
  const [sourceType, setSourceType] = useState<"internal" | "external">("internal");
  const [creatingSource, setCreatingSource] = useState(false);

  // Document creation modal
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [docText, setDocText] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [creatingDoc, setCreatingDoc] = useState(false);

  // Document preview modal
  const [previewDoc, setPreviewDoc] = useState<DocumentDetail | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Delete confirmation
  const [deletingDocId, setDeletingDocId] = useState<number | null>(null);

  // Training
  const [trainingDocId, setTrainingDocId] = useState<number | null>(null);

  // ─── Load initial data ──────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [chatbotData, sourceData, docData] = await Promise.all([
        ChatbotService.getChatbots(),
        TrainingService.getKnowledgeSources(),
        TrainingService.getDocuments(),
      ]);
      setChatbots(chatbotData);
      setSources(sourceData);
      setDocuments(docData);

      if (chatbotData.length > 0) {
        setSelectedChatbotId((prev) => prev ?? chatbotData[0].id);
      }
    } catch {
      setChatbots([]);
      setSources([]);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Filtered data ─────────────────────────────────────────────────

  const filteredSources = sources.filter(
    (s) => !selectedChatbotId || s.chatbot === selectedChatbotId
  );

  const filteredSourceIds = new Set(filteredSources.map((s) => s.id));

  const filteredDocuments = documents.filter((d) =>
    filteredSourceIds.has(d.source)
  );

  // ─── Source handlers ────────────────────────────────────────────────

  const handleCreateSource = async () => {
    if (!sourceName.trim() || !selectedChatbotId) return;
    setCreatingSource(true);
    try {
      const newSource = await TrainingService.createKnowledgeSource({
        chatbot_id: selectedChatbotId,
        source_type: sourceType,
        name: sourceName.trim(),
      });
      setSources((prev) => [newSource, ...prev]);
      setShowSourceModal(false);
      setSourceName("");
      setSourceType("internal");
      toast.success("Knowledge source created!");
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err?.message || "Failed to create knowledge source");
    } finally {
      setCreatingSource(false);
    }
  };

  const handleDeleteSource = async (id: number) => {
    try {
      await TrainingService.deleteKnowledgeSource(id);
      setSources((prev) => prev.filter((s) => s.id !== id));
      setDocuments((prev) => prev.filter((d) => d.source !== id));
      toast.success("Knowledge source deleted");
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err?.message || "Failed to delete");
    }
  };

  // ─── Document handlers ─────────────────────────────────────────────

  const handleCreateDocument = async () => {
    if (!docTitle.trim() || !selectedSourceId) return;
    setCreatingDoc(true);
    try {
      const newDoc = await TrainingService.createDocument({
        source_id: selectedSourceId,
        title: docTitle.trim(),
        raw_text: docText.trim() || undefined,
        file: docFile || undefined,
      });
      setDocuments((prev) => [newDoc, ...prev]);
      resetDocModal();
      toast.success("Document added!");
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err?.message || "Failed to add document");
    } finally {
      setCreatingDoc(false);
    }
  };

  const handleDeleteDocument = async (id: number) => {
    setDeletingDocId(id);
    try {
      await TrainingService.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      toast.success("Document deleted");
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err?.message || "Failed to delete document");
    } finally {
      setDeletingDocId(null);
    }
  };

  const handlePreviewDocument = async (id: number) => {
    setLoadingPreview(true);
    try {
      const detail = await TrainingService.getDocument(id);
      setPreviewDoc(detail);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err?.message || "Failed to load document");
    } finally {
      setLoadingPreview(false);
    }
  };

  // ─── Training handler ───────────────────────────────────────────────

  const handleTrain = async (docId: number) => {
    setTrainingDocId(docId);
    try {
      const result = await TrainingService.trainDocument(docId);
      toast.success(`Training complete — ${result.chunks_count} chunks created`);
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId ? { ...d, status: "completed" as DocumentStatus } : d
        )
      );
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err?.message || "Training failed");
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId ? { ...d, status: "failed" as DocumentStatus } : d
        )
      );
    } finally {
      setTrainingDocId(null);
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────────

  const getSourceName = (sourceId: number) =>
    sources.find((s) => s.id === sourceId)?.name ?? "—";

  const resetDocModal = () => {
    setShowDocModal(false);
    setSelectedSourceId(null);
    setDocTitle("");
    setDocText("");
    setDocFile(null);
  };

  // ─── Loading state ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="animate-spin text-violet-600 mx-auto mb-4" size={40} />
          <p className="text-gray-500">Loading training center...</p>
        </div>
      </div>
    );
  }

  const hasCompany = !!user?.company;
  const hasChatbots = chatbots.length > 0;

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="text-violet-600" size={28} />
            Training Center
          </h1>
          <p className="text-gray-500 mt-1">
            Train your chatbots with knowledge base documents for intelligent RAG responses.
          </p>
        </div>
      </div>

      {/* Warning states */}
      {!hasCompany && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mb-6">
          <AlertCircle className="text-amber-600 mt-0.5 shrink-0" size={20} />
          <div>
            <h4 className="text-sm font-semibold text-amber-900 mb-1">Company Required</h4>
            <p className="text-sm text-amber-700">
              Please create a company first from the Company page before using the Training Center.
            </p>
          </div>
        </div>
      )}

      {hasCompany && !hasChatbots && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 mb-6">
          <Bot className="text-blue-600 mt-0.5 shrink-0" size={20} />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">No Chatbots Found</h4>
            <p className="text-sm text-blue-700">
              Create a chatbot first from the Chatbots page to start training with knowledge base.
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {hasCompany && hasChatbots && (
        <div className="space-y-6">
          {/* Chatbot Selector */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Chatbot to Train
            </label>
            <div className="relative">
              <select
                value={selectedChatbotId || ""}
                onChange={(e) => setSelectedChatbotId(Number(e.target.value))}
                className="w-full appearance-none px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent cursor-pointer"
              >
                {chatbots.map((bot) => (
                  <option key={bot.id} value={bot.id}>
                    {bot.name} ({bot.type})
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Knowledge Sources Section */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-violet-600" />
                <h2 className="text-lg font-semibold text-gray-900">Knowledge Sources</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {filteredSources.length}
                </span>
              </div>
              <button
                onClick={() => setShowSourceModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors cursor-pointer"
              >
                <Plus size={16} />
                Add Source
              </button>
            </div>

            {filteredSources.length === 0 ? (
              <div className="p-8 text-center">
                <BookOpen size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  No knowledge sources yet. Add your first source to start training.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredSources.map((source) => {
                  const sourceDocCount = documents.filter((d) => d.source === source.id).length;
                  return (
                    <div
                      key={source.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            source.source_type === "internal" ? "bg-violet-50" : "bg-blue-50"
                          }`}
                        >
                          {source.source_type === "internal" ? (
                            <FileText size={18} className="text-violet-600" />
                          ) : (
                            <Globe size={18} className="text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{source.name}</p>
                          <p className="text-xs text-gray-400 capitalize">
                            {source.source_type}
                            {" · "}
                            {sourceDocCount} doc{sourceDocCount !== 1 ? "s" : ""}
                            {source.last_synced_at &&
                              ` · Synced ${new Date(source.last_synced_at).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedSourceId(source.id);
                            setShowDocModal(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors cursor-pointer"
                        >
                          <Upload size={12} />
                          Add Doc
                        </button>
                        <button
                          onClick={() => handleDeleteSource(source.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete source"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Documents Section */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-violet-600" />
                <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {filteredDocuments.length}
                </span>
              </div>
            </div>

            {filteredDocuments.length === 0 ? (
              <div className="p-8 text-center">
                <FileText size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  No documents yet. Add documents to a knowledge source, then train them.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredDocuments.map((doc) => {
                  const stat = statusConfig[doc.status] ?? statusConfig.pending;
                  const isTraining = trainingDocId === doc.id;
                  const isDeleting = deletingDocId === doc.id;

                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                          <FileText size={18} className="text-gray-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${stat.color}`}
                            >
                              {stat.icon}
                              {stat.label}
                            </span>
                            <span className="text-xs text-gray-400">
                              {getSourceName(doc.source)}
                            </span>
                            {doc.created_at && (
                              <span className="text-xs text-gray-400">
                                {new Date(doc.created_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {doc.error_message && (
                            <p className="text-xs text-red-500 mt-1 truncate">{doc.error_message}</p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-3 shrink-0">
                        <button
                          onClick={() => handlePreviewDocument(doc.id)}
                          disabled={loadingPreview}
                          className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          title="Preview document"
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          onClick={() => handleTrain(doc.id)}
                          disabled={isTraining || doc.status === "processing"}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {isTraining ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Zap size={12} />
                          )}
                          {isTraining ? "Training..." : "Train"}
                        </button>

                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          disabled={isDeleting || isTraining}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete document"
                        >
                          {isDeleting ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Create Knowledge Source Modal ─────────────────────────────── */}
      {showSourceModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowSourceModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Add Knowledge Source</h2>
              <button
                onClick={() => setShowSourceModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Source Name
                </label>
                <input
                  type="text"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="e.g. Product Documentation"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Source Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSourceType("internal")}
                    className={`p-3 rounded-lg border-2 text-left transition-all cursor-pointer ${
                      sourceType === "internal"
                        ? "border-violet-500 bg-violet-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText
                        size={16}
                        className={sourceType === "internal" ? "text-violet-600" : "text-gray-400"}
                      />
                      <span className="text-sm font-medium text-gray-900">Internal</span>
                    </div>
                    <p className="text-xs text-gray-500">Upload files &amp; text</p>
                  </button>
                  <button
                    onClick={() => setSourceType("external")}
                    className={`p-3 rounded-lg border-2 text-left transition-all cursor-pointer ${
                      sourceType === "external"
                        ? "border-violet-500 bg-violet-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Globe
                        size={16}
                        className={sourceType === "external" ? "text-violet-600" : "text-gray-400"}
                      />
                      <span className="text-sm font-medium text-gray-900">External</span>
                    </div>
                    <p className="text-xs text-gray-500">Web URLs &amp; APIs</p>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowSourceModal(false)}
                disabled={creatingSource}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSource}
                disabled={creatingSource || !sourceName.trim()}
                className="flex-1 px-4 py-2.5 bg-violet-600 text-white hover:bg-violet-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {creatingSource ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={16} />
                    Creating...
                  </span>
                ) : (
                  "Create Source"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add Document Modal ────────────────────────────────────────── */}
      {showDocModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && resetDocModal()}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-xl font-bold text-gray-900">Add Document</h2>
              <button
                onClick={resetDocModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Source selector if not pre-selected */}
              {!selectedSourceId && filteredSources.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Knowledge Source <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value=""
                      onChange={(e) => setSelectedSourceId(Number(e.target.value))}
                      className="w-full appearance-none px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent cursor-pointer"
                    >
                      <option value="" disabled>— Select a source —</option>
                      {filteredSources.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                </div>
              )}

              {selectedSourceId && (
                <div className="flex items-center gap-2 p-3 bg-violet-50 rounded-lg">
                  <BookOpen size={14} className="text-violet-600" />
                  <span className="text-sm text-violet-700 font-medium">
                    Adding to: {getSourceName(selectedSourceId)}
                  </span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Document Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. FAQ Document"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Raw Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Content (Text)
                </label>
                <textarea
                  value={docText}
                  onChange={(e) => setDocText(e.target.value)}
                  placeholder="Paste your knowledge base text here..."
                  rows={5}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Or Upload File
                </label>
                <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-violet-400 hover:bg-violet-50/50 transition-colors">
                  <div className="text-center">
                    <Upload size={20} className="text-gray-400 mx-auto mb-1" />
                    {docFile ? (
                      <p className="text-sm text-violet-600 font-medium">{docFile.name}</p>
                    ) : (
                      <p className="text-sm text-gray-500">Click to upload a file</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">PDF, TXT, DOCX, MD, CSV</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.txt,.docx,.md,.csv"
                    onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  />
                </label>
                {docFile && (
                  <button
                    onClick={() => setDocFile(null)}
                    className="mt-1.5 text-xs text-red-500 hover:underline"
                  >
                    Remove file
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white rounded-b-2xl">
              <button
                onClick={resetDocModal}
                disabled={creatingDoc}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDocument}
                disabled={creatingDoc || !docTitle.trim() || !selectedSourceId}
                className="flex-1 px-4 py-2.5 bg-violet-600 text-white hover:bg-violet-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {creatingDoc ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={16} />
                    Adding...
                  </span>
                ) : (
                  "Add Document"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Document Preview Modal ────────────────────────────────────── */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setPreviewDoc(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-violet-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 truncate">{previewDoc.title}</h2>
                  <p className="text-xs text-gray-400">{getSourceName(previewDoc.source)}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 cursor-pointer shrink-0 ml-3"
              >
                <X size={20} />
              </button>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap gap-4 px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Status</span>
                <span
                  className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                    statusConfig[previewDoc.status]?.color ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {statusConfig[previewDoc.status]?.icon}
                  {statusConfig[previewDoc.status]?.label ?? previewDoc.status}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Hash size={13} />
                <span>{previewDoc.chunks_count ?? 0} chunks</span>
              </div>

              {previewDoc.created_at && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Calendar size={13} />
                  <span>{new Date(previewDoc.created_at).toLocaleString()}</span>
                </div>
              )}

              {previewDoc.file && (
                <div className="flex items-center gap-1.5 text-xs text-violet-600">
                  <FileIcon size={13} />
                  <a
                    href={previewDoc.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-violet-800"
                  >
                    View uploaded file
                  </a>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {previewDoc.error_message && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 font-medium mb-1">Error</p>
                  <p className="text-sm text-red-500">{previewDoc.error_message}</p>
                </div>
              )}

              {previewDoc.raw_text ? (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                    Document Content
                  </p>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 rounded-lg p-4 border border-gray-200 overflow-auto max-h-80">
                    {previewDoc.raw_text}
                  </pre>
                </div>
              ) : previewDoc.file ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileIcon size={36} className="text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 mb-1">
                    This document was uploaded as a file.
                  </p>
                  <a
                    href={previewDoc.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-violet-600 underline hover:text-violet-800"
                  >
                    Open file in new tab
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText size={36} className="text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">No content preview available.</p>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setPreviewDoc(null)}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const id = previewDoc.id;
                  setPreviewDoc(null);
                  handleTrain(id);
                }}
                disabled={
                  trainingDocId === previewDoc.id || previewDoc.status === "processing"
                }
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white hover:bg-violet-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Zap size={15} />
                Train This Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay for preview */}
      {loadingPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 flex items-center gap-3 shadow-xl">
            <Loader2 className="animate-spin text-violet-600" size={20} />
            <span className="text-sm font-medium text-gray-700">Loading document...</span>
          </div>
        </div>
      )}
    </div>
  );
}

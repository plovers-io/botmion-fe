"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/store/auth-store-v2";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { useWorkspaceRole } from "@/lib/hooks/use-workspace-role";
import { ChatbotService } from "@/lib/services/chatbot-service";
import { TrainingService } from "@/lib/services/training-service";
import { Chatbot } from "@/lib/types/chatbot";
import {
  KnowledgeSource,
  Document,
  DocumentStatus,
  QAPair,
  ImageDocument,
} from "@/lib/types/training";
import { goeyToast as toast } from "goey-toast";
import {
  Brain,
  Bot,
  Loader2,
  Plus,
  FileText,
  Globe,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Zap,
  Upload,
  BookOpen,
  Eye,
  Hash,
  Calendar,
  File as FileIcon,
  Link2,
  HelpCircle,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";

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

  // Workspace & role
  const currentWorkspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);
  const { canEdit, canDelete, isViewer } = useWorkspaceRole();

  // Data state
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [imageDocuments, setImageDocuments] = useState<ImageDocument[]>([]);

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
  const [docUrl, setDocUrl] = useState("");
  const [docInputType, setDocInputType] = useState<"text" | "file" | "url" | "qa">("text");
  const [qaPairs, setQaPairs] = useState<QAPair[]>([{ question: "", answer: "" }]);
  const [creatingDoc, setCreatingDoc] = useState(false);

  // Image document creation modal
  const [showImageDocModal, setShowImageDocModal] = useState(false);
  const [selectedImageSourceId, setSelectedImageSourceId] = useState<number | null>(null);
  const [imageDocTitle, setImageDocTitle] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageMetadataText, setImageMetadataText] = useState("");
  const [creatingImageDoc, setCreatingImageDoc] = useState(false);
  const [processingImageDocId, setProcessingImageDocId] = useState<number | null>(null);
  const [deletingImageDocId, setDeletingImageDocId] = useState<number | null>(null);

  // Document preview modal
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Delete confirmation
  const [deletingDocId, setDeletingDocId] = useState<number | null>(null);
  const [pendingDeleteDocId, setPendingDeleteDocId] = useState<number | null>(null);

  // Training
  const [trainingDocId, setTrainingDocId] = useState<number | null>(null);

  // ─── Load initial data ──────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [chatbotData, sourceData, docData, imageDocData] = await Promise.all([
        ChatbotService.getChatbots(),
        TrainingService.getKnowledgeSources(),
        TrainingService.getDocuments(),
        TrainingService.getImageDocuments(),
      ]);
      setChatbots(chatbotData);
      setSources(sourceData);
      setDocuments(docData);
      setImageDocuments(imageDocData);

      if (chatbotData.length > 0) {
        setSelectedChatbotId((prev) => prev ?? chatbotData[0].id);
      }
    } catch {
      setChatbots([]);
      setSources([]);
      setDocuments([]);
      setImageDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, currentWorkspaceId]);

  // ─── Filtered data ─────────────────────────────────────────────────

  const filteredSources = sources.filter(
    (s) => !selectedChatbotId || s.chatbot === selectedChatbotId
  );

  const filteredSourceIds = new Set(filteredSources.map((s) => s.id));

  const filteredDocuments = documents.filter((d) =>
    filteredSourceIds.has(d.source)
  );

  const filteredImageDocuments = imageDocuments.filter((d) =>
    filteredSourceIds.has(d.source)
  );

  const refreshImageDocuments = useCallback(async () => {
    try {
      const data = await TrainingService.getImageDocuments();
      setImageDocuments(data);
    } catch {
      // Silent refresh failure: keep current UI state.
    }
  }, []);

  useEffect(() => {
    const hasProcessing = filteredImageDocuments.some((doc) => doc.status === "processing");
    if (!hasProcessing) return;

    const timer = setInterval(() => {
      refreshImageDocuments();
    }, 4000);

    return () => clearInterval(timer);
  }, [filteredImageDocuments, refreshImageDocuments]);

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
      toast.success("Source Created", { description: "New knowledge source has been added" });
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error("Creation Failed", { description: err?.message || "Failed to create knowledge source" });
    } finally {
      setCreatingSource(false);
    }
  };

  const handleDeleteSource = async (id: number) => {
    try {
      await TrainingService.deleteKnowledgeSource(id);
      setSources((prev) => prev.filter((s) => s.id !== id));
      setDocuments((prev) => prev.filter((d) => d.source !== id));
      setImageDocuments((prev) => prev.filter((d) => d.source !== id));
      toast.success("Source Deleted", { description: "Knowledge source has been removed" });
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error("Delete Failed", { description: err?.message || "Failed to delete knowledge source" });
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
        raw_text: docInputType === "text" && docText.trim() ? docText.trim() : undefined,
        file: docInputType === "file" && docFile ? docFile : undefined,
        url: docInputType === "url" && docUrl.trim() ? docUrl.trim() : undefined,
        qa_pairs: docInputType === "qa" && qaPairs.some((p) => p.question.trim() && p.answer.trim())
          ? qaPairs.filter((p) => p.question.trim() && p.answer.trim())
          : undefined,
      });
      setDocuments((prev) => [newDoc, ...prev]);
      resetDocModal();
      toast.success("Document Added", { description: "Your document is ready for training" });
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error("Upload Failed", { description: err?.message || "Failed to add document" });
    } finally {
      setCreatingDoc(false);
    }
  };

  const handleDeleteDocument = async (id: number) => {
    setDeletingDocId(id);
    try {
      await TrainingService.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      toast.success("Document Deleted", { description: "The document and its knowledge have been permanently removed from the chatbot." });
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error("Delete Failed", { description: err?.message || "Failed to delete document" });
    } finally {
      setDeletingDocId(null);
      setPendingDeleteDocId(null);
    }
  };

  const handlePreviewDocument = async (id: number) => {
    setLoadingPreview(true);
    try {
      const doc = await TrainingService.getDocument(id);
      setPreviewDoc(doc);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error("Load Failed", { description: err?.message || "Failed to load document" });
    } finally {
      setLoadingPreview(false);
    }
  };

  // ─── Training handler ───────────────────────────────────────────────

  const handleCreateImageDocument = async () => {
    if (!selectedImageSourceId || !imageFile || !imageDocTitle.trim()) return;
    setCreatingImageDoc(true);
    try {
      let parsedMetadata: Record<string, unknown> | undefined;
      if (imageMetadataText.trim()) {
        const maybeMetadata = JSON.parse(imageMetadataText.trim());
        if (!maybeMetadata || typeof maybeMetadata !== "object" || Array.isArray(maybeMetadata)) {
          throw new Error("Metadata must be a valid JSON object.");
        }
        parsedMetadata = maybeMetadata as Record<string, unknown>;
      }

      const created = await TrainingService.createImageDocument({
        source_id: selectedImageSourceId,
        title: imageDocTitle.trim(),
        image_file: imageFile,
        metadata: parsedMetadata,
      });
      setImageDocuments((prev) => [created, ...prev]);
      setShowImageDocModal(false);
      setSelectedImageSourceId(null);
      setImageDocTitle("");
      setImageFile(null);
      setImageMetadataText("");
      toast.success("Image Added", { description: "Image document uploaded successfully" });
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error("Upload Failed", { description: err?.message || "Failed to upload image" });
    } finally {
      setCreatingImageDoc(false);
    }
  };

  const handleProcessImage = async (id: number) => {
    setProcessingImageDocId(id);
    try {
      const result = await TrainingService.processImageDocument(id);
      toast.success("Processing Started", { description: result.message || "Image embedding started" });
      setImageDocuments((prev) =>
        prev.map((doc) =>
          doc.id === id ? { ...doc, status: "processing" as DocumentStatus } : doc
        )
      );
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error("Process Failed", { description: err?.message || "Failed to process image" });
    } finally {
      setProcessingImageDocId(null);
    }
  };

  const handleDeleteImageDocument = async (id: number) => {
    setDeletingImageDocId(id);
    try {
      await TrainingService.deleteImageDocument(id);
      setImageDocuments((prev) => prev.filter((doc) => doc.id !== id));
      toast.success("Image Deleted", { description: "Image document removed" });
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error("Delete Failed", { description: err?.message || "Failed to delete image" });
    } finally {
      setDeletingImageDocId(null);
    }
  };

  const handleTrain = async (docId: number) => {
    setTrainingDocId(docId);
    try {
      const result = await TrainingService.trainDocument(docId);
      toast.success("Training Complete", { description: `${result.chunks_count} chunks created successfully` });
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId ? { ...d, status: "completed" as DocumentStatus } : d
        )
      );
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error("Training Failed", { description: err?.message || "Something went wrong during training" });
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
    setDocUrl("");
    setDocInputType("text");
    setQaPairs([{ question: "", answer: "" }]);
  };

  // ─── Loading state ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <Loader2 className="animate-spin text-emerald-600" size={28} />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Loading training center...</p>
        </div>
      </div>
    );
  }

  const hasChatbots = chatbots.length > 0;

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Brain className="text-white" size={20} />
            </div>
            Training Center
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">
            Train your chatbots with knowledge base documents for intelligent RAG responses.
          </p>
        </div>
      </div>

      {/* Warning states */}
      {!hasChatbots && (
        <div className="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200/60 rounded-2xl p-4 flex items-start gap-3 mb-6 animate-fade-in-up">
          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
            <Bot className="text-blue-600" size={18} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">No Chatbots Found</h4>
            <p className="text-sm text-blue-700">
              Create a chatbot first from the Chatbots page to start training with knowledge base.
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {hasChatbots && (
        <div className="space-y-6">
          {/* Chatbot Selector */}
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-5 shadow-sm">
            <Label>Select Chatbot to Train</Label>
            <Select
              value={selectedChatbotId ? String(selectedChatbotId) : undefined}
              onValueChange={(value) => setSelectedChatbotId(Number(value))}
            >
              <SelectTrigger className="mt-2 h-11 w-full cursor-pointer rounded-lg border-gray-300 bg-white text-left text-sm">
                <SelectValue placeholder="Select chatbot" />
              </SelectTrigger>
              <SelectContent>
                {chatbots.map((bot) => (
                  <SelectItem key={bot.id} value={String(bot.id)} className="cursor-pointer">
                    {bot.name} ({bot.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Knowledge Sources Section */}
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center">
                  <BookOpen size={16} className="text-emerald-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Knowledge Sources</h2>
                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                  {filteredSources.length}
                </span>
              </div>
              {canEdit && (
                <Button
                  onClick={() => setShowSourceModal(true)}
                  size="sm"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/20"
                >
                  <Plus size={16} />
                  Add Source
                </Button>
              )}
            </div>

            {filteredSources.length === 0 ? (
              <div className="p-8 text-center">
                <BookOpen size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
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
                      className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            source.source_type === "internal" ? "bg-emerald-50 dark:bg-emerald-900/30" : "bg-blue-50 dark:bg-blue-900/30"
                          }`}
                        >
                          {source.source_type === "internal" ? (
                            <FileText size={18} className="text-emerald-600" />
                          ) : (
                            <Globe size={18} className="text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{source.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {source.source_type}
                            {" · "}
                            {sourceDocCount} doc{sourceDocCount !== 1 ? "s" : ""}
                            {source.last_synced_at &&
                              ` · Synced ${new Date(source.last_synced_at).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {canEdit && (
                          <Button
                            onClick={() => {
                              setSelectedSourceId(source.id);
                              setShowDocModal(true);
                            }}
                            variant="ghost"
                            size="xs"
                            className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                          >
                            <Upload size={12} />
                            Add Doc
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            onClick={() => handleDeleteSource(source.id)}
                            variant="ghost"
                            size="icon-xs"
                            className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                            title="Delete source"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Documents Section */}
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center">
                  <FileText size={16} className="text-emerald-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Documents</h2>
                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                  {filteredDocuments.length}
                </span>
              </div>
            </div>

            {filteredDocuments.length === 0 ? (
              <div className="p-8 text-center">
                <FileText size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
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
                      className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 bg-gray-50 dark:bg-gray-700/60 rounded-lg flex items-center justify-center shrink-0">
                          <FileText size={18} className="text-gray-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{doc.title}</p>
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
                        <Button
                          onClick={() => handlePreviewDocument(doc.id)}
                          disabled={loadingPreview}
                          variant="ghost"
                          size="icon-xs"
                          className="text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                          title="Preview document"
                        >
                          <Eye size={14} />
                        </Button>

                        {canEdit && (
                          <Button
                            onClick={() => handleTrain(doc.id)}
                            disabled={isTraining || doc.status === "processing"}
                            size="xs"
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-sm"
                          >
                            {isTraining ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Zap size={12} />
                            )}
                            {isTraining ? "Training..." : "Train"}
                          </Button>
                        )}

                        {canDelete && (
                          <Button
                            onClick={() => setPendingDeleteDocId(doc.id)}
                            disabled={isDeleting || isTraining}
                            variant="ghost"
                            size="icon-xs"
                            className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                            title="Delete document"
                          >
                            {isDeleting ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Image Documents Section */}
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center">
                  <ImageIcon size={16} className="text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Image Embedding</h2>
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                  {filteredImageDocuments.length}
                </span>
              </div>
              {canEdit && (
                <Button
                  onClick={() => {
                    setSelectedImageSourceId(filteredSources[0]?.id || null);
                    setShowImageDocModal(true);
                  }}
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-md"
                >
                  <Plus size={16} />
                  Add Image
                </Button>
              )}
            </div>

            {filteredImageDocuments.length === 0 ? (
              <div className="p-8 text-center">
                <ImageIcon size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No image documents yet. Upload image files and trigger embedding.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredImageDocuments.map((doc) => {
                  const stat = statusConfig[doc.status] ?? statusConfig.pending;
                  const isProcessing = processingImageDocId === doc.id;
                  const isDeleting = deletingImageDocId === doc.id;

                  return (
                    <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 shrink-0 flex items-center justify-center">
                          {doc.thumbnail || doc.image_file ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={(doc.thumbnail || doc.image_file) as string} alt={doc.title} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={16} className="text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{doc.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${stat.color}`}>
                              {stat.icon}
                              {stat.label}
                            </span>
                            <span className="text-xs text-gray-400">{getSourceName(doc.source)}</span>
                            {doc.file_format ? (
                              <span className="text-xs text-gray-400 uppercase">{doc.file_format}</span>
                            ) : null}
                            {doc.width && doc.height ? (
                              <span className="text-xs text-gray-400">{doc.width}x{doc.height}</span>
                            ) : null}
                            {doc.metadata && Object.keys(doc.metadata).length > 0 ? (
                              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                {Object.keys(doc.metadata).length} metadata fields
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {canEdit && (
                          <Button
                            onClick={() => handleProcessImage(doc.id)}
                            disabled={doc.status === "processing" || isProcessing}
                            variant="ghost"
                            size="xs"
                            className="text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                          >
                            {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                            Process
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            onClick={() => handleDeleteImageDocument(doc.id)}
                            disabled={isDeleting}
                            variant="ghost"
                            size="icon-xs"
                            className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                            title="Delete image"
                          >
                            {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={14} />}
                          </Button>
                        )}
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
      <Dialog open={showSourceModal} onOpenChange={setShowSourceModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Knowledge Source</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="source-name">Source Name</Label>
              <Input
                id="source-name"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="e.g. Product Documentation"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Source Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSourceType("internal")}
                  className={`p-3 rounded-lg border-2 text-left transition-all cursor-pointer ${
                    sourceType === "internal"
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FileText
                      size={16}
                      className={sourceType === "internal" ? "text-emerald-600" : "text-gray-400"}
                    />
                    <span className={`text-sm font-medium ${
                      sourceType === "internal" ? "text-emerald-900 dark:text-emerald-100" : "text-gray-900 dark:text-gray-100"
                    }`}>
                      Internal
                    </span>
                  </div>
                  <p className={`text-xs ${
                    sourceType === "internal" ? "text-emerald-700 dark:text-emerald-300" : "text-gray-500 dark:text-gray-400"
                  }`}>
                    Upload files &amp; text
                  </p>
                </button>
                <button
                  onClick={() => setSourceType("external")}
                  className={`p-3 rounded-lg border-2 text-left transition-all cursor-pointer ${
                    sourceType === "external"
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Globe
                      size={16}
                      className={sourceType === "external" ? "text-emerald-600" : "text-gray-400"}
                    />
                    <span className={`text-sm font-medium ${
                      sourceType === "external" ? "text-emerald-900 dark:text-emerald-100" : "text-gray-900 dark:text-gray-100"
                    }`}>
                      External
                    </span>
                  </div>
                  <p className={`text-xs ${
                    sourceType === "external" ? "text-emerald-700 dark:text-emerald-300" : "text-gray-500 dark:text-gray-400"
                  }`}>
                    Web URLs &amp; APIs
                  </p>
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSourceModal(false)}
              disabled={creatingSource}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSource}
              disabled={creatingSource || !sourceName.trim()}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/20"
            >
              {creatingSource ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Creating...
                </>
              ) : (
                "Create Source"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Image Document Modal */}
      <Dialog open={showImageDocModal} onOpenChange={setShowImageDocModal}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon size={18} className="text-blue-600" />
              Add Image Document
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-2">
              <Label>Knowledge Source</Label>
              <Select
                value={selectedImageSourceId ? String(selectedImageSourceId) : undefined}
                onValueChange={(value) => setSelectedImageSourceId(Number(value))}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSources.map((source) => (
                    <SelectItem key={source.id} value={String(source.id)}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Image Title</Label>
              <Input
                value={imageDocTitle}
                onChange={(e) => setImageDocTitle(e.target.value)}
                placeholder="e.g. Company Banner, Product Hero"
              />
            </div>

            <div className="space-y-2">
              <Label>Upload Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-gray-400">Supported formats: JPG, PNG, WebP (based on backend validation).</p>
            </div>

            <div className="space-y-2">
              <Label>Metadata (Optional JSON)</Label>
              <Textarea
                value={imageMetadataText}
                onChange={(e) => setImageMetadataText(e.target.value)}
                rows={4}
                placeholder='{"animal_type":"horse","age":"5 years","speed":"55 km/h","food_habits":["grass","hay"]}'
              />
              <p className="text-xs text-gray-400">
                Provide optional structured facts. This metadata is stored with image embedding payload.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImageDocModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateImageDocument}
              disabled={!selectedImageSourceId || !imageDocTitle.trim() || !imageFile || creatingImageDoc}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              {creatingImageDoc ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Upload Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Add Document Modal ────────────────────────────────────────── */}
      <Dialog open={showDocModal} onOpenChange={(open) => { if (!open) resetDocModal(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Document</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Source selector if not pre-selected */}
            {!selectedSourceId && filteredSources.length > 0 && (
              <div className="space-y-2">
                <Label>
                  Knowledge Source <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedSourceId ? String(selectedSourceId) : undefined}
                  onValueChange={(value) => setSelectedSourceId(Number(value))}
                >
                  <SelectTrigger className="h-11 w-full cursor-pointer rounded-lg border-gray-300 bg-white text-left text-sm">
                    <SelectValue placeholder="- Select a source -" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSources.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)} className="cursor-pointer">
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedSourceId && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg">
                <BookOpen size={14} className="text-emerald-600" />
                <span className="text-sm text-emerald-700 font-medium">
                  Adding to: {getSourceName(selectedSourceId)}
                </span>
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="doc-title">
                Document Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="doc-title"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="e.g. FAQ Document"
                autoFocus
              />
            </div>

            {/* Input Type Tabs */}
            <div className="space-y-3">
              <Label>Content Type</Label>
              <div className="grid grid-cols-4 gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                {([
                  { key: "text", label: "Text", icon: <FileText size={14} /> },
                  { key: "file", label: "File", icon: <Upload size={14} /> },
                  { key: "url", label: "URL", icon: <Link2 size={14} /> },
                  { key: "qa", label: "Q&A", icon: <HelpCircle size={14} /> },
                ] as const).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setDocInputType(tab.key)}
                    className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      docInputType === tab.key
                        ? "bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-400 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Raw Text Input */}
            {docInputType === "text" && (
              <div className="space-y-2">
                <Label htmlFor="doc-text">Content (Text)</Label>
                <Textarea
                  id="doc-text"
                  value={docText}
                  onChange={(e) => setDocText(e.target.value)}
                  placeholder="Paste your knowledge base text here..."
                  rows={5}
                  className="resize-none"
                />
              </div>
            )}

            {/* File Upload */}
            {docInputType === "file" && (
              <div className="space-y-2">
                <Label>Upload File</Label>
                <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors">
                  <div className="text-center">
                    <Upload size={20} className="text-gray-400 mx-auto mb-1" />
                    {docFile ? (
                      <p className="text-sm text-emerald-600 font-medium">{docFile.name}</p>
                    ) : (
                      <p className="text-sm text-gray-500">Click to upload a file</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">PDF, TXT, DOCX, MD, CSV, PPTX</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.txt,.docx,.md,.csv,.pptx"
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
            )}

            {/* URL Input */}
            {docInputType === "url" && (
              <div className="space-y-2">
                <Label htmlFor="doc-url">Website URL</Label>
                <Input
                  id="doc-url"
                  type="url"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  placeholder="https://example.com/page-to-crawl"
                />
                <p className="text-xs text-gray-400">
                  The page content will be crawled and extracted as training data.
                </p>
              </div>
            )}

            {/* Q&A Pairs */}
            {docInputType === "qa" && (
              <div className="space-y-3">
                <Label>Question & Answer Pairs</Label>
                {qaPairs.map((pair, idx) => (
                  <div key={idx} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg space-y-2 relative">
                    {qaPairs.length > 1 && (
                      <button
                        onClick={() => setQaPairs((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    )}
                    <div className="space-y-1">
                      <Label className="text-xs">Question {idx + 1}</Label>
                      <Input
                        value={pair.question}
                        onChange={(e) => {
                          const updated = [...qaPairs];
                          updated[idx] = { ...updated[idx], question: e.target.value };
                          setQaPairs(updated);
                        }}
                        placeholder="e.g. What are your business hours?"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Answer</Label>
                      <Textarea
                        value={pair.answer}
                        onChange={(e) => {
                          const updated = [...qaPairs];
                          updated[idx] = { ...updated[idx], answer: e.target.value };
                          setQaPairs(updated);
                        }}
                        placeholder="We are open Monday to Friday, 9 AM to 5 PM."
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                  </div>
                ))}
                {qaPairs.length < 20 && (
                  <Button
                    onClick={() => setQaPairs((prev) => [...prev, { question: "", answer: "" }])}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Plus size={14} />
                    Add Another Q&A Pair
                  </Button>
                )}
                <p className="text-xs text-gray-400">
                  {qaPairs.filter((p) => p.question.trim() && p.answer.trim()).length} of {qaPairs.length} pairs filled
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={resetDocModal}
              disabled={creatingDoc}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateDocument}
              disabled={creatingDoc || !docTitle.trim() || !selectedSourceId}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/20"
            >
              {creatingDoc ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Adding...
                </>
              ) : (
                "Add Document"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Document Preview Modal ────────────────────────────────────── */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => { if (!open) setPreviewDoc(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                <FileText size={18} className="text-emerald-600" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="truncate">{previewDoc?.title}</DialogTitle>
                <p className="text-xs text-gray-400">{previewDoc ? getSourceName(previewDoc.source) : ""}</p>
              </div>
            </div>
          </DialogHeader>

          {previewDoc && (
            <>
              {/* Meta info */}
              <div className="flex flex-wrap gap-4 px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">Status</span>
                  <Badge
                    variant="secondary"
                    className={statusConfig[previewDoc.status]?.color ?? "bg-gray-100 text-gray-600"}
                  >
                    {statusConfig[previewDoc.status]?.icon}
                    {statusConfig[previewDoc.status]?.label ?? previewDoc.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Hash size={13} />
                  <span>{(previewDoc as any).chunks_count ?? "N/A"} chunks</span>
                </div>

                {previewDoc.created_at && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Calendar size={13} />
                    <span>{new Date(previewDoc.created_at).toLocaleString()}</span>
                  </div>
                )}

                {previewDoc.file && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                    <FileIcon size={13} />
                    <a
                      href={previewDoc.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-emerald-800"
                    >
                      View uploaded file
                    </a>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto py-2">
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
                      className="text-sm text-emerald-600 underline hover:text-emerald-800"
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
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPreviewDoc(null)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    const id = previewDoc.id;
                    setPreviewDoc(null);
                    handleTrain(id);
                  }}
                  disabled={
                    trainingDocId === previewDoc.id || previewDoc.status === "processing"
                  }
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/20"
                >
                  <Zap size={15} />
                  Train This Document
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Loading overlay for preview */}
      {loadingPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 flex items-center gap-3 shadow-xl">
            <Loader2 className="animate-spin text-emerald-600" size={20} />
            <span className="text-sm font-medium text-gray-700">Loading document...</span>
          </div>
        </div>
      )}

      {/* ─── Delete Document Confirmation Modal ────────────────────────── */}
      <ConfirmDialog
        isOpen={pendingDeleteDocId !== null}
        onClose={() => setPendingDeleteDocId(null)}
        onConfirm={() => {
          if (pendingDeleteDocId !== null) {
            handleDeleteDocument(pendingDeleteDocId);
          }
        }}
        title="Delete Document?"
        description="This will permanently remove the document and all its trained knowledge from the chatbot. The chatbot will no longer be able to answer questions based on this document."
        confirmText="Delete Document"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={deletingDocId !== null}
        icon={<Trash2 size={24} className="text-red-500" />}
      />
    </div>
  );
}

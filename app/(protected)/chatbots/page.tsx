"use client";

import { useState, useEffect } from "react";
import { ChatbotService } from "@/lib/services/chatbot-service";
import { Chatbot, BotType } from "@/lib/types/chatbot";
import { useAuthStore } from "@/lib/store/auth-store-v2";
import { ConfirmModal } from "@/components/common";
import { toast } from "react-toastify";
import {
  Bot,
  Plus,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
  MessageSquare,
  ShieldQuestion,
  Megaphone,
  Settings2,
  X,
  AlertCircle,
} from "lucide-react";

const botTypeConfig: Record<
  BotType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  faq: {
    label: "FAQ",
    icon: <ShieldQuestion size={16} />,
    color: "bg-blue-100 text-blue-700",
  },
  support: {
    label: "Support",
    icon: <MessageSquare size={16} />,
    color: "bg-green-100 text-green-700",
  },
  sales: {
    label: "Sales",
    icon: <Megaphone size={16} />,
    color: "bg-orange-100 text-orange-700",
  },
  custom: {
    label: "Custom",
    icon: <Settings2 size={16} />,
    color: "bg-purple-100 text-purple-700",
  },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  published: { label: "Published", color: "bg-green-100 text-green-700" },
  draft: { label: "Draft", color: "bg-yellow-100 text-yellow-700" },
  archived: { label: "Archived", color: "bg-gray-100 text-gray-500" },
};

export default function ChatbotsPage() {
  const { user } = useAuthStore();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBot, setSelectedBot] = useState<Chatbot | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<BotType>("faq");

  useEffect(() => {
    loadChatbots();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId !== null) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openMenuId]);

  const loadChatbots = async () => {
    setLoading(true);
    try {
      const data = await ChatbotService.getChatbots();
      setChatbots(data);
    } catch {
      // User might not have any chatbots yet
      setChatbots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formName.trim()) {
      toast.error("Please enter a chatbot name");
      return;
    }

    setCreating(true);
    try {
      const newBot = await ChatbotService.createChatbot({
        name: formName.trim(),
        type: formType,
      });
      setChatbots((prev) => [newBot, ...prev]);
      setShowCreateModal(false);
      setFormName("");
      setFormType("faq");
      toast.success("Chatbot created successfully!");
    } catch (error: any) {
      toast.error(error?.message || "Failed to create chatbot");
    } finally {
      setCreating(false);
    }
  };

  const handleEditClick = (bot: Chatbot) => {
    setSelectedBot(bot);
    setFormName(bot.name);
    setFormType(bot.type);
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const handleUpdate = async () => {
    if (!selectedBot || !formName.trim()) return;

    setUpdating(true);
    try {
      const updated = await ChatbotService.updateChatbot(selectedBot.id, {
        name: formName.trim(),
        type: formType,
      });
      setChatbots((prev) =>
        prev.map((bot) => (bot.id === updated.id ? updated : bot))
      );
      setShowEditModal(false);
      setSelectedBot(null);
      setFormName("");
      setFormType("faq");
      toast.success("Chatbot updated successfully!");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update chatbot");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = (bot: Chatbot) => {
    setSelectedBot(bot);
    setShowDeleteModal(true);
    setOpenMenuId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBot) return;

    setDeleting(true);
    try {
      await ChatbotService.deleteChatbot(selectedBot.id);
      setChatbots((prev) => prev.filter((bot) => bot.id !== selectedBot.id));
      setShowDeleteModal(false);
      setSelectedBot(null);
      toast.success("Chatbot deleted successfully!");
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete chatbot");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2
            className="animate-spin text-violet-600 mx-auto mb-4"
            size={40}
          />
          <p className="text-gray-500">Loading chatbots...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Bot className="text-violet-600" size={28} />
            Chatbots
          </h1>
          <p className="text-gray-500 mt-1">
            Create and manage your AI chatbots.
          </p>
        </div>
        <button
          onClick={() => {
            setFormName("");
            setFormType("faq");
            setShowCreateModal(true);
          }}
          disabled={!user?.company}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          New Chatbot
        </button>
      </div>

      {/* Company Warning */}
      {!user?.company && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-amber-600 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-semibold text-amber-900 mb-1">
              Company Required
            </h4>
            <p className="text-sm text-amber-700">
              Please create a company first before creating chatbots. Go to the{" "}
              <a href="/company" className="font-semibold underline hover:text-amber-900">Company</a>{" "}
              page to get started.
            </p>
          </div>
        </div>
      )}

      {/* Chatbot Grid or Empty State */}
      {chatbots.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot size={32} className="text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No chatbots yet
          </h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
            Create your first AI chatbot to start automating conversations.
            Configure its personality, knowledge sources, and deploy it to your
            website.
          </p>
          <button
            onClick={() => {
              setFormName("");
              setFormType("faq");
              setShowCreateModal(true);
            }}
            disabled={!user?.company}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={18} />
            Create Your First Chatbot
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {chatbots.map((bot) => {
            const typeConf = botTypeConfig[bot.type] || botTypeConfig.custom;
            const statConf = statusConfig[bot.status] || statusConfig.draft;

            return (
              <div
                key={bot.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all hover:border-violet-200 group"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
                      <Bot size={20} className="text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 truncate max-w-[180px]">
                        {bot.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeConf.color}`}
                        >
                          {typeConf.icon}
                          {typeConf.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(
                          openMenuId === bot.id ? null : bot.id
                        );
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openMenuId === bot.id && (
                      <div className="absolute right-0 top-8 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                        <button
                          onClick={() => handleEditClick(bot)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(bot)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statConf.color}`}
                  >
                    {statConf.label}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(bot.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Chatbot Modal */}
      {showCreateModal && (
        <ChatbotFormModal
          title="Create New Chatbot"
          name={formName}
          type={formType}
          onNameChange={setFormName}
          onTypeChange={setFormType}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          submitText="Create Chatbot"
          isLoading={creating}
        />
      )}

      {/* Edit Chatbot Modal */}
      {showEditModal && (
        <ChatbotFormModal
          title="Edit Chatbot"
          name={formName}
          type={formType}
          onNameChange={setFormName}
          onTypeChange={setFormType}
          onClose={() => {
            setShowEditModal(false);
            setSelectedBot(null);
          }}
          onSubmit={handleUpdate}
          submitText="Save Changes"
          isLoading={updating}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedBot(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Chatbot"
        description={`Are you sure you want to delete "${selectedBot?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Keep It"
        confirmVariant="danger"
        isLoading={deleting}
        icon={<AlertCircle size={28} className="text-red-500" />}
      />
    </div>
  );
}

// ─── Chatbot Form Modal (Reused for Create & Edit) ─────────────────────────

interface ChatbotFormModalProps {
  title: string;
  name: string;
  type: BotType;
  onNameChange: (value: string) => void;
  onTypeChange: (value: BotType) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitText: string;
  isLoading: boolean;
}

function ChatbotFormModal({
  title,
  name,
  type,
  onNameChange,
  onTypeChange,
  onClose,
  onSubmit,
  submitText,
  isLoading,
}: ChatbotFormModalProps) {
  const botTypes: { value: BotType; label: string; desc: string }[] = [
    { value: "faq", label: "FAQ", desc: "Answer frequently asked questions" },
    {
      value: "support",
      label: "Support",
      desc: "Handle customer support queries",
    },
    {
      value: "sales",
      label: "Sales",
      desc: "Assist with sales and lead generation",
    },
    {
      value: "custom",
      label: "Custom",
      desc: "Build a custom chatbot from scratch",
    },
  ];

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Chatbot Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g. Customer Support Bot"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Bot Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {botTypes.map((bt) => {
                const conf = botTypeConfig[bt.value];
                return (
                  <button
                    key={bt.value}
                    onClick={() => onTypeChange(bt.value)}
                    className={`p-3 rounded-lg border-2 text-left transition-all cursor-pointer ${
                      type === bt.value
                        ? "border-violet-500 bg-violet-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`p-1 rounded ${conf.color}`}>
                        {conf.icon}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {bt.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{bt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isLoading || !name.trim()}
            className="flex-1 px-4 py-2.5 bg-violet-600 text-white hover:bg-violet-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={16} />
                Loading...
              </span>
            ) : (
              submitText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

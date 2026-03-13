"use client";

import { useState, useEffect } from "react";
import { ChatbotService } from "@/lib/services/chatbot-service";
import { Chatbot, BotType } from "@/lib/types/chatbot";
import { ConfirmModal } from "@/components/common";
import { ChatPanel } from "@/components/features/chat-panel";
import { goeyToast as toast } from "goey-toast";
import { useRouter } from "next/navigation";
import { type IconSvgElement, HugeiconsIcon } from "@hugeicons/react";
import { BotIcon } from "@hugeicons/core-free-icons";
import {
  Plus,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
  MessageSquare,
  ShieldQuestion,
  Megaphone,
  Settings2,
  AlertCircle,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

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

function ChatbotIcon({ className, size = 20 }: { className?: string; size?: number }) {
  return <HugeiconsIcon icon={BotIcon as IconSvgElement} size={size} className={className} strokeWidth={1.8} />;
}

export default function ChatbotsPage() {
  const router = useRouter();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBot, setSelectedBot] = useState<Chatbot | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Chat panel state
  const [chatBot, setChatBot] = useState<Chatbot | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const handleChatOpen = (bot: Chatbot) => {
    setChatBot(bot);
    setChatOpen(true);
  };

  // Form state
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<BotType>("faq");

  useEffect(() => {
    loadChatbots();
  }, []);

  const loadChatbots = async () => {
    setLoading(true);
    try {
      const data = await ChatbotService.getChatbots();
      setChatbots(data);
    } catch {
      setChatbots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formName.trim()) {
      toast.error("Validation Error", { description: "Please enter a chatbot name" });
      return;
    }
    setCreating(true);
    try {
      const newBot = await ChatbotService.createChatbot({ name: formName.trim(), type: formType });
      setChatbots((prev) => [newBot, ...prev]);
      setShowCreateModal(false);
      setFormName("");
      setFormType("faq");
      toast.success("Chatbot Created", { description: "Your new chatbot is ready to use" });
    } catch (error: any) {
      toast.error("Creation Failed", { description: error?.message || "Failed to create chatbot" });
    } finally {
      setCreating(false);
    }
  };

  const handleEditClick = (bot: Chatbot) => {
    setSelectedBot(bot);
    setFormName(bot.name);
    setFormType(bot.type);
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedBot || !formName.trim()) return;
    setUpdating(true);
    try {
      const updated = await ChatbotService.updateChatbot(selectedBot.id, { name: formName.trim(), type: formType });
      setChatbots((prev) => prev.map((bot) => (bot.id === updated.id ? updated : bot)));
      setShowEditModal(false);
      setSelectedBot(null);
      setFormName("");
      setFormType("faq");
      toast.success("Chatbot Updated", { description: "Your changes have been saved" });
    } catch (error: any) {
      toast.error("Update Failed", { description: error?.message || "Failed to update chatbot" });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = (bot: Chatbot) => {
    setSelectedBot(bot);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBot) return;
    setDeleting(true);
    try {
      await ChatbotService.deleteChatbot(selectedBot.id);
      setChatbots((prev) => prev.filter((bot) => bot.id !== selectedBot.id));
      setShowDeleteModal(false);
      setSelectedBot(null);
      toast.success("Chatbot Deleted", { description: "The chatbot has been permanently removed" });
    } catch (error: any) {
      toast.error("Delete Failed", { description: error?.message || "Failed to delete chatbot" });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/15 dark:to-teal-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <Loader2 className="animate-spin text-emerald-600 dark:text-emerald-400" size={28} />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Loading chatbots...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ChatbotIcon className="text-white" size={22} />
            </div>
            Chatbots
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">Create and manage your AI chatbots.</p>
        </div>
        <Button
          onClick={() => { setFormName(""); setFormType("faq"); setShowCreateModal(true); }}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300"
        >
          <Plus size={18} />
          New Chatbot
        </Button>
      </div>

      {/* Chatbot Grid or Empty State */}
      {chatbots.length === 0 ? (
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-16 text-center animate-fade-in-up shadow-sm">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/15 dark:to-teal-500/15 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-sm">
            <ChatbotIcon size={36} className="text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No chatbots yet</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto mb-8">
            Create your first AI chatbot to start automating conversations and delight your customers.
          </p>
          <Button
            onClick={() => { setFormName(""); setFormType("faq"); setShowCreateModal(true); }}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25 px-6"
          >
            <Plus size={18} />
            Create Your First Chatbot
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 stagger-children">
          {chatbots.map((bot) => {
            const typeConf = botTypeConfig[bot.type] || botTypeConfig.custom;
            const statConf = statusConfig[bot.status] || statusConfig.draft;

            return (
              <div
                key={bot.id}
                onClick={() => handleChatOpen(bot)}
                className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6 card-hover group relative overflow-hidden cursor-pointer"
              >
                {/* Subtle gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/15 dark:to-teal-500/15 rounded-xl flex items-center justify-center shadow-sm">
                      <ChatbotIcon size={20} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[180px]">{bot.name}</h3>
                      <Badge variant="secondary" className={`mt-1 text-[11px] ${typeConf.color}`}>
                        {typeConf.icon}
                        {typeConf.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Accessible dropdown menu (replaces manual click-outside) */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleChatOpen(bot); }}>
                        <MessageSquare size={14} />
                        Chat
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleEditClick(bot); }}>
                        <Pencil size={14} />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); router.push(`/chatbots/${bot.id}/settings`); }}>
                        <Sliders size={14} />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(bot); }}
                        className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <Trash2 size={14} />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-700/50">
                  <Badge variant="secondary" className={`text-[11px] ${statConf.color}`}>{statConf.label}</Badge>
                  <span className="text-[11px] text-gray-300 font-medium">{new Date(bot.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <ChatbotFormDialog
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        title="Create New Chatbot"
        name={formName}
        type={formType}
        onNameChange={setFormName}
        onTypeChange={setFormType}
        onSubmit={handleCreate}
        submitText="Create Chatbot"
        isLoading={creating}
      />

      {/* Edit Dialog */}
      <ChatbotFormDialog
        open={showEditModal}
        onOpenChange={(open) => { setShowEditModal(open); if (!open) setSelectedBot(null); }}
        title="Edit Chatbot"
        name={formName}
        type={formType}
        onNameChange={setFormName}
        onTypeChange={setFormType}
        onSubmit={handleUpdate}
        submitText="Save Changes"
        isLoading={updating}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedBot(null); }}
        onConfirm={handleDeleteConfirm}
        title="Delete Chatbot"
        description={`Are you sure you want to delete "${selectedBot?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Keep It"
        confirmVariant="danger"
        isLoading={deleting}
        icon={<AlertCircle size={28} className="text-red-500" />}
      />

      {/* Chat Slide-over Panel */}
      <ChatPanel chatbot={chatBot} open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
}

// ─── Chatbot Form Dialog (Reused for Create & Edit) ─────────────────────────

interface ChatbotFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  name: string;
  type: BotType;
  onNameChange: (value: string) => void;
  onTypeChange: (value: BotType) => void;
  onSubmit: () => void;
  submitText: string;
  isLoading: boolean;
}

function ChatbotFormDialog({
  open,
  onOpenChange,
  title,
  name,
  type,
  onNameChange,
  onTypeChange,
  onSubmit,
  submitText,
  isLoading,
}: ChatbotFormDialogProps) {
  const botTypes: { value: BotType; label: string; desc: string }[] = [
    { value: "faq", label: "FAQ", desc: "Answer frequently asked questions" },
    { value: "support", label: "Support", desc: "Handle customer support queries" },
    { value: "sales", label: "Sales", desc: "Assist with sales and lead generation" },
    { value: "custom", label: "Custom", desc: "Build a custom chatbot from scratch" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="chatbot-name">Chatbot Name</Label>
            <Input
              id="chatbot-name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g. Customer Support Bot"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Bot Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {botTypes.map((bt) => {
                const conf = botTypeConfig[bt.value];
                return (
                  <button
                    key={bt.value}
                    type="button"
                    onClick={() => onTypeChange(bt.value)}
                    className={`p-3 rounded-lg border-2 text-left transition-all cursor-pointer ${
                      type === bt.value
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`p-1 rounded ${conf.color}`}>{conf.icon}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{bt.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{bt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row gap-3 sm:justify-stretch">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="flex-1">
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isLoading || !name.trim()} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={16} />
                Loading...
              </span>
            ) : (
              submitText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

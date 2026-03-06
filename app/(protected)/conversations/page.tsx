"use client";

import { useState, useEffect, useCallback } from "react";
import { ConversationService } from "@/lib/services/conversation-service";
import { ChatbotService } from "@/lib/services/chatbot-service";
import { Conversation } from "@/lib/types/conversation";
import { Chatbot } from "@/lib/types/chatbot";
import { goeyToast as toast } from "goey-toast";
import {
  MessageSquare,
  Loader2,
  Trash2,
  ChevronRight,
  Clock,
  Bot,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmModal } from "@/components/common";

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-green-100 text-green-700" },
  waiting: { label: "Waiting", color: "bg-yellow-100 text-yellow-700" },
  active: { label: "Active", color: "bg-blue-100 text-blue-700" },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-500" },
};

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [convData, botData] = await Promise.all([
        ConversationService.getConversations(1, 20),
        ChatbotService.getChatbots(),
      ]);
      setConversations(convData.results || []);
      setTotalCount(convData.count || 0);
      setChatbots(botData);
    } catch {
      setConversations([]);
      setChatbots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadMore = async () => {
    const nextPage = page + 1;
    try {
      const data = await ConversationService.getConversations(nextPage, 20);
      setConversations((prev) => [...prev, ...(data.results || [])]);
      setPage(nextPage);
    } catch {
      toast.error("Load Failed", { description: "Could not load more conversations" });
    }
  };

  const handleViewConversation = async (conv: Conversation) => {
    setDetailLoading(true);
    try {
      const full = await ConversationService.getConversation(conv.id);
      setSelectedConversation(full);
    } catch {
      toast.error("Load Failed", { description: "Could not load conversation details" });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await ConversationService.deleteConversation(deleteTarget.id);
      setConversations((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setTotalCount((prev) => prev - 1);
      if (selectedConversation?.id === deleteTarget.id) {
        setSelectedConversation(null);
      }
      setDeleteTarget(null);
      toast.success("Deleted", { description: "Conversation has been removed" });
    } catch {
      toast.error("Delete Failed", { description: "Could not delete conversation" });
    } finally {
      setDeleting(false);
    }
  };

  const getChatbotName = (chatbotId: number) =>
    chatbots.find((b) => b.id === chatbotId)?.name ?? `Chatbot #${chatbotId}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <Loader2 className="animate-spin text-emerald-600" size={28} />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <MessageSquare className="text-white" size={20} />
          </div>
          Conversations
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">
          View and manage chat conversations across your chatbots.
          {totalCount > 0 && (
            <span className="ml-2 text-emerald-600 font-medium">{totalCount} total</span>
          )}
        </p>
      </div>

      {conversations.length === 0 ? (
        <Card className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border-gray-100 dark:border-gray-700/50 rounded-2xl shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/15 dark:to-teal-500/15 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <MessageSquare size={36} className="text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              No conversations yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
              Conversations will appear here once users start chatting with your
              chatbots. Create and deploy a chatbot to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversation List */}
          <div className="lg:col-span-1 space-y-3">
            {conversations.map((conv) => {
              const stat = statusConfig[conv.status] || statusConfig.open;
              const lastMsg = conv.messages?.[0];
              const isSelected = selectedConversation?.id === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => handleViewConversation(conv)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 group ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10 shadow-sm"
                      : "border-gray-100 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {conv.title || "Untitled Conversation"}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {getChatbotName(conv.chatbot)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className={`text-[10px] ${stat.color}`}>
                        {stat.label}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(conv);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  {lastMsg && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {lastMsg.role === "assistant" ? "Bot: " : "User: "}
                      {lastMsg.content}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-gray-300 flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(conv.updated_at).toLocaleDateString()}
                    </span>
                    <ChevronRight size={14} className="text-gray-300" />
                  </div>
                </div>
              );
            })}
            {conversations.length < totalCount && (
              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={loadMore}
              >
                Load More
              </Button>
            )}
          </div>

          {/* Conversation Detail Panel */}
          <div className="lg:col-span-2">
            {detailLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-emerald-500" size={24} />
              </div>
            ) : selectedConversation ? (
              <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden shadow-sm">
                {/* Detail Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700/50">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {selectedConversation.title || "Conversation"}
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      {getChatbotName(selectedConversation.chatbot)} &middot; {selectedConversation.platform} &middot;{" "}
                      {selectedConversation.messages?.length || 0} messages
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setSelectedConversation(null)}
                    className="text-gray-400"
                  >
                    <X size={16} />
                  </Button>
                </div>

                {/* Messages */}
                <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                  {selectedConversation.messages?.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-8">No messages in this conversation.</p>
                  ) : (
                    selectedConversation.messages?.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === "assistant" ? "" : "flex-row-reverse"}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            msg.role === "assistant"
                              ? "bg-emerald-100 dark:bg-emerald-500/15"
                              : "bg-blue-100 dark:bg-blue-500/15"
                          }`}
                        >
                          {msg.role === "assistant" ? (
                            <Bot size={14} className="text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <User size={14} className="text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <div
                          className={`max-w-[75%] rounded-xl px-4 py-2.5 ${
                            msg.role === "assistant"
                              ? "bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100"
                              : "bg-emerald-500 text-white"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p
                            className={`text-[10px] mt-1 ${
                              msg.role === "assistant" ? "text-gray-400" : "text-emerald-200"
                            }`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-white/80 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                <div className="text-center">
                  <MessageSquare size={32} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Select a conversation to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Conversation"
        description={`Are you sure you want to delete this conversation? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Keep It"
        confirmVariant="danger"
        isLoading={deleting}
        icon={<Trash2 size={28} className="text-red-500" />}
      />
    </div>
  );
}

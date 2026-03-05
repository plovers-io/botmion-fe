"use client";

import { MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ConversationsPage() {
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
        </p>
      </div>

      {/* Empty State */}
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
    </div>
  );
}

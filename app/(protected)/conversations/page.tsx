"use client";

import { MessageSquare } from "lucide-react";

export default function ConversationsPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="text-violet-600" size={28} />
          Conversations
        </h1>
        <p className="text-gray-500 mt-1">
          View and manage chat conversations across your chatbots.
        </p>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare size={32} className="text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No conversations yet
        </h3>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Conversations will appear here once users start chatting with your
          chatbots. Create and deploy a chatbot to get started.
        </p>
      </div>
    </div>
  );
}

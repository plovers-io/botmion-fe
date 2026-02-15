"use client";

import { Bot, Plus } from "lucide-react";

export default function ChatbotsPage() {
  return (
    <div className="p-6 lg:p-8">
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
        <button className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors cursor-pointer">
          <Plus size={18} />
          New Chatbot
        </button>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bot size={32} className="text-violet-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No chatbots yet
        </h3>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Create your first AI chatbot to start automating conversations. 
          Configure its personality, knowledge sources, and deploy it to your website.
        </p>
      </div>
    </div>
  );
}

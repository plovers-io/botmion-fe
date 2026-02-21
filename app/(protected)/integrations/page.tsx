"use client";

import { Plug } from "lucide-react";

const platforms = [
  {
    name: "Messenger",
    description: "Connect your chatbot to Facebook Messenger",
    status: "coming_soon",
    color: "bg-blue-50 text-blue-600 border-blue-200",
  },
  {
    name: "WhatsApp",
    description: "Deploy your chatbot on WhatsApp Business",
    status: "coming_soon",
    color: "bg-green-50 text-green-600 border-green-200",
  },
  {
    name: "Slack",
    description: "Integrate your chatbot with Slack workspaces",
    status: "coming_soon",
    color: "bg-purple-50 text-purple-600 border-purple-200",
  },
];

export default function IntegrationsPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Plug className="text-violet-600" size={28} />
          Integrations
        </h1>
        <p className="text-gray-500 mt-1">
          Connect your chatbots to messaging platforms.
        </p>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {platforms.map((platform) => (
          <div
            key={platform.name}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {platform.name}
              </h3>
              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">
                Coming Soon
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {platform.description}
            </p>
            <button
              disabled
              className="w-full py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
            >
              Connect
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

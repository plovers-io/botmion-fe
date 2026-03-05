"use client";

import { Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const platforms = [
  {
    name: "Messenger",
    description: "Connect your chatbot to Facebook Messenger",
    status: "coming_soon",
    color: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
  },
  {
    name: "WhatsApp",
    description: "Deploy your chatbot on WhatsApp Business",
    status: "coming_soon",
    color: "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20",
  },
  {
    name: "Slack",
    description: "Integrate your chatbot with Slack workspaces",
    status: "coming_soon",
    color: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20",
  },
];

export default function IntegrationsPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Plug className="text-white" size={20} />
          </div>
          Integrations
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">
          Connect your chatbots to messaging platforms.
        </p>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 stagger-children">
        {platforms.map((platform) => (
          <Card key={platform.name} className="group bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border-gray-100 dark:border-gray-700/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
            <div className="h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/60 to-teal-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
                    {platform.name === "Messenger" && (
                      <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none">
                        <defs>
                          <linearGradient id="messengerGrad" x1="24" y1="2" x2="24" y2="46.01" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#00B2FF"/>
                            <stop offset="1" stopColor="#006AFF"/>
                          </linearGradient>
                        </defs>
                        <path d="M24 2C11.85 2 2 11.21 2 23.16c0 6.23 2.55 11.56 6.72 15.33a1.76 1.76 0 01.59 1.31l.12 4.1a1.76 1.76 0 002.52 1.53l4.58-2.02a1.76 1.76 0 011.17-.1c2 .55 4.13.85 6.3.85 12.15 0 22-9.21 22-21.16C46 11.21 36.15 2 24 2z" fill="url(#messengerGrad)"/>
                        <path d="M10.56 29.47l6.58-10.44a3.3 3.3 0 014.78-.88l5.23 3.92a1.32 1.32 0 001.59 0l7.06-5.36c.94-.72 2.17.43 1.36 1.27l-6.58 10.44a3.3 3.3 0 01-4.78.88l-5.23-3.92a1.32 1.32 0 00-1.59 0l-7.06 5.36c-.94.72-2.17-.43-1.36-1.27z" fill="#fff"/>
                      </svg>
                    )}
                    {platform.name === "WhatsApp" && (
                      <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none">
                        <path d="M24 4C12.95 4 4 12.95 4 24c0 3.54.93 6.86 2.55 9.73L4 44l10.57-2.47A19.87 19.87 0 0024 44c11.05 0 20-8.95 20-20S35.05 4 24 4z" fill="#25D366"/>
                        <path d="M34.6 29.23c-.58-.29-3.43-1.69-3.96-1.88-.53-.2-.92-.29-1.3.29-.39.58-1.5 1.88-1.84 2.27-.34.39-.68.44-1.26.15-.58-.29-2.45-.9-4.67-2.88-1.73-1.54-2.89-3.44-3.23-4.02-.34-.58-.04-.9.25-1.19.26-.26.58-.68.87-1.02.29-.34.39-.58.58-.97.2-.39.1-.73-.05-1.02-.15-.29-1.3-3.14-1.79-4.3-.47-1.13-.95-.98-1.3-1-.34-.02-.73-.02-1.12-.02-.39 0-1.02.15-1.55.73-.53.58-2.03 1.98-2.03 4.83s2.08 5.6 2.37 5.99c.29.39 4.09 6.25 9.92 8.76 1.39.6 2.47.96 3.31 1.23 1.39.44 2.66.38 3.66.23 1.12-.17 3.43-1.4 3.92-2.76.49-1.35.49-2.51.34-2.76-.15-.24-.53-.39-1.12-.68z" fill="#fff"/>
                      </svg>
                    )}
                    {platform.name === "Slack" && (
                      <svg className="w-7 h-7" viewBox="0 0 48 48" fill="none">
                        <path d="M10.1 30.2a5 5 0 11-5-5h5v5zM12.6 30.2a5 5 0 1110 0v12.5a5 5 0 11-10 0V30.2z" fill="#E01E5A"/>
                        <path d="M17.6 10.1a5 5 0 115-5v5h-5zM17.6 12.6a5 5 0 110 10H5.1a5 5 0 010-10h12.5z" fill="#36C5F0"/>
                        <path d="M37.8 17.6a5 5 0 115 5h-5v-5zM35.3 17.6a5 5 0 11-10 0V5.1a5 5 0 0110 0v12.5z" fill="#2EB67D"/>
                        <path d="M30.3 37.8a5 5 0 11-5 5v-5h5zM30.3 35.3a5 5 0 110-10h12.5a5 5 0 010 10H30.3z" fill="#ECB22E"/>
                      </svg>
                    )}
                  </div>
                  <CardTitle className="text-lg">{platform.name}</CardTitle>
                </div>
                <Badge variant="secondary" className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20 text-[11px]">
                  Coming Soon
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {platform.description}
              </p>
              <Button
                disabled
                variant="secondary"
                className="w-full rounded-xl"
              >
                Connect
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

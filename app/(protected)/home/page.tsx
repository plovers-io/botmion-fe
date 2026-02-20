"use client";

import { useAuthStore } from "@/lib/store/auth-store-v2";
import { Bot, MessageSquare, Plug, CreditCard } from "lucide-react";
import Link from "next/link";

const quickLinks = [
  {
    label: "Chatbots",
    href: "/chatbots",
    icon: <Bot size={24} />,
    description: "Create and manage your AI chatbots",
    color: "bg-blue-50 text-blue-600 border-blue-200",
  },
  {
    label: "Conversations",
    href: "/conversations",
    icon: <MessageSquare size={24} />,
    description: "View and manage chat conversations",
    color: "bg-green-50 text-green-600 border-green-200",
  },
  {
    label: "Integrations",
    href: "/integrations",
    icon: <Plug size={24} />,
    description: "Connect Messenger, WhatsApp & Slack",
    color: "bg-orange-50 text-orange-600 border-orange-200",
  },
  {
    label: "Subscription",
    href: "/subscription",
    icon: <CreditCard size={24} />,
    description: "Manage your plan and billing",
    color: "bg-violet-50 text-violet-600 border-violet-200",
  },
];

const HomePage = () => {
  const { user } = useAuthStore();

  return (
    <div className="p-6 lg:p-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          Welcome back, {user?.first_name || 'User'}! 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s an overview of your Botmion workspace.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`p-5 rounded-xl border bg-white hover:shadow-md transition-shadow`}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${link.color}`}
            >
              {link.icon}
            </div>
            <h3 className="font-semibold text-gray-900">{link.label}</h3>
            <p className="text-sm text-gray-500 mt-1">{link.description}</p>
          </Link>
        ))}
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Account Information
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500 w-20">
              Email:
            </span>
            <span className="text-sm text-gray-900">{user?.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500 w-20">
              Name:
            </span>
            <span className="text-sm text-gray-900">
              {user?.first_name} {user?.last_name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

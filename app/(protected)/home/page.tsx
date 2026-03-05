"use client";

import { useAuthStore } from "@/lib/store/auth-store-v2";
import {
  Bot,
  MessageSquare,
  Plug,
  CreditCard,
  ArrowUpRight,
  Sparkles,
  Mail,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

const quickLinks = [
  {
    label: "Chatbots",
    href: "/chatbots",
    icon: <Bot size={22} />,
    description: "Create and manage your AI chatbots",
    gradient: "from-blue-500 to-cyan-400",
    bg: "bg-blue-50 dark:bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    label: "Conversations",
    href: "/conversations",
    icon: <MessageSquare size={22} />,
    description: "View and manage chat conversations",
    gradient: "from-emerald-500 to-teal-400",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "Integrations",
    href: "/integrations",
    icon: <Plug size={22} />,
    description: "Connect Messenger, WhatsApp & Slack",
    gradient: "from-orange-500 to-amber-400",
    bg: "bg-orange-50 dark:bg-orange-500/10",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  {
    label: "Subscription",
    href: "/subscription",
    icon: <CreditCard size={22} />,
    description: "Manage your plan and billing",
    gradient: "from-violet-500 to-purple-400",
    bg: "bg-violet-50 dark:bg-violet-500/10",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
];

const HomePage = () => {
  const { user } = useAuthStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Welcome Section */}
      <div className="relative mb-10 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 p-8 lg:p-10 text-white shadow-xl shadow-emerald-500/20">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4 blur-xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-emerald-200" />
            <span className="text-emerald-200 text-sm font-medium">{getGreeting()}</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">
            Welcome back, {user?.first_name || "User"}!
          </h1>
          <p className="text-emerald-100 text-base max-w-lg">
            Here&apos;s your Botmion workspace overview. Manage chatbots, track conversations, and grow your business.
          </p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="group">
              <Card className="card-hover border-gray-100/80 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 ${link.bg} rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                      <span className={link.iconColor}>{link.icon}</span>
                    </div>
                    <ArrowUpRight
                      size={18}
                      className="text-gray-300 dark:text-gray-600 group-hover:text-emerald-500 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {link.label}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{link.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Account Info */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Account</h2>
        <Card className="border-gray-100/80 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm animate-fade-in-up">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/20 dark:to-teal-500/20 flex items-center justify-center ring-4 ring-white dark:ring-gray-800 shadow-sm">
                <UserCircle size={28} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                  {user?.first_name} {user?.last_name}
                </h3>
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                  <Mail size={14} />
                  <span className="truncate">{user?.email}</span>
                </div>
              </div>
              <Link
                href="/settings"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
              >
                Edit Profile
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HomePage;

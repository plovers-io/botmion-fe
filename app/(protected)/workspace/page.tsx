"use client";

import { useAuthStore } from "@/lib/store/auth-store-v2";
import Link from "next/link";
import {
  Briefcase,
  CheckCircle2,
  Users,
  Bot,
  CreditCard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function WorkspacePage() {
  const { user } = useAuthStore();

  // Workspace is auto-created on registration with name "{first_name}'s Workspace"
  const workspaceName = user
    ? `${user.first_name || "My"}'s Workspace`
    : "My Workspace";

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Briefcase className="text-white" size={20} />
            </div>
            Workspace
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">
            Your workspace overview and settings.
          </p>
        </div>
      </div>

      {/* Workspace Card */}
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden shadow-sm animate-fade-in-up">
        {/* Workspace Header */}
        <div className="bg-linear-to-r from-emerald-600 via-emerald-500 to-teal-500 px-6 py-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12" />
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <Briefcase size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{workspaceName}</h2>
              <p className="text-emerald-200 text-sm mt-0.5">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Workspace Details */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3.5 bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/10 rounded-xl border border-green-100/50 dark:border-green-500/20">
              <CheckCircle2 size={18} className="text-green-500" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Active</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 bg-linear-to-br from-blue-50 to-sky-50 dark:from-blue-500/10 dark:to-sky-500/10 rounded-xl border border-blue-100/50 dark:border-blue-500/20">
              <Users size={18} className="text-blue-500" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Owner</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user?.first_name} {user?.last_name}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700/50">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Quick Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link href="/chatbots">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                  <Bot size={16} className="text-emerald-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Chatbots</span>
                  <Badge variant="secondary" className="ml-auto text-[11px]">
                    Manage →
                  </Badge>
                </div>
              </Link>
              <Link href="/members">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                  <Users size={16} className="text-blue-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Members</span>
                  <Badge variant="secondary" className="ml-auto text-[11px]">
                    Manage →
                  </Badge>
                </div>
              </Link>
              <Link href="/subscription">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                  <CreditCard size={16} className="text-purple-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Subscription</span>
                  <Badge variant="secondary" className="ml-auto text-[11px]">
                    View →
                  </Badge>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useAuthStore } from "@/lib/store/auth-store-v2";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

// TODO: Company management API endpoints are not yet available in the backend.
// Once the backend adds company CRUD endpoints, restore full create/edit functionality.

export default function CompanyPage() {
  const { user } = useAuthStore();
  const company = user?.company;

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Building2 className="text-white" size={20} />
            </div>
            Company
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">
            View your company profile.
          </p>
        </div>
      </div>

      {/* No Company State */}
      {!company && (
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-12 text-center animate-fade-in-up shadow-sm">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/15 dark:to-teal-500/15 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <Building2 size={36} className="text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            No company yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto mb-4">
            Your account is not associated with any company.
          </p>
          <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
            <AlertTriangle size={16} />
            <span>Company management will be available soon.</span>
          </div>
        </div>
      )}

      {/* Company Card */}
      {company && (
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden shadow-sm animate-fade-in-up">
          {/* Company Header */}
          <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-6 py-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12" />
            <div className="flex items-center gap-4">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="w-16 h-16 rounded-xl bg-white object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                  <Building2 size={32} className="text-white" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-white">{company.name}</h2>
                <p className="text-emerald-200 text-sm mt-0.5">@{company.slug}</p>
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3.5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/10 rounded-xl border border-green-100/50 dark:border-green-500/20">
                <CheckCircle2 size={18} className="text-green-500" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Active
                  </p>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700/50">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs">
                <AlertTriangle size={14} />
                <span>Company editing will be available once the backend API is ready.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

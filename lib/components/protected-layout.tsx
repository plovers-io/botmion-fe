"use client";

import React, { ReactNode } from "react";
import { withAuth } from "@/lib/hooks/with-auth";
import { AppSidebar } from "@/components/common/sidebar";

function ProtectedLayoutInner({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      {/* Main content area with left margin for sidebar on desktop */}
      <main className="flex-1 lg:ml-64 min-h-screen bg-gradient-to-br from-gray-50/80 via-white to-emerald-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 page-pattern transition-colors duration-300">
        {children}
      </main>
    </div>
  );
}

// Wrap with auth HOC
const ProtectedLayoutWithAuth = withAuth(ProtectedLayoutInner);

export function ProtectedLayout({ children }: { children: ReactNode }) {
  return <ProtectedLayoutWithAuth>{children}</ProtectedLayoutWithAuth>;
}

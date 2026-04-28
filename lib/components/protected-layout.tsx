"use client";

import React, { ReactNode } from "react";
import { withAuth } from "@/lib/hooks/with-auth";
import { useNotificationFeed } from "@/lib/hooks/use-notification-feed";
import { AppSidebar } from "@/components/common/sidebar";
import { useUiStore } from "@/lib/store/ui-store";

function ProtectedLayoutInner({ children }: { children: ReactNode }) {
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const sidebarOffset = sidebarCollapsed ? "5rem" : "16rem";

  useNotificationFeed();

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      {/* Main content area with left margin for sidebar on desktop */}
      <main
        className="flex-1 min-h-screen bg-linear-to-br from-gray-50/80 via-white to-emerald-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 page-pattern transition-[margin-left,colors] duration-300 lg:ml-(--sidebar-offset)"
        style={{ ["--sidebar-offset" as string]: sidebarOffset } as React.CSSProperties}
      >
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

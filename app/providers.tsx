"use client";

import React, { ReactNode } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { GoeyToaster } from "goey-toast";
import "goey-toast/styles.css";
import { ThemeProvider, useTheme } from "@/components/common/theme-provider";

/**
 * React Query Provider
 * Wraps the application to enable server state management
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <GoeyToaster
      position="top-right"
      duration={3000}
      theme={resolvedTheme}
      offset="20px"
      gap={12}
    />
  );
}

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ThemedToaster />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

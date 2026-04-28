"use client";

import { create } from "zustand";

interface UiState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: "light" | "dark";
  notifications: Array<{
    id: string;
    message: string;
    type: "success" | "error" | "info" | "warning";
  }>;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: "light" | "dark") => void;
  addNotification: (
    notification: Omit<UiState["notifications"][0], "id">,
  ) => void;
  removeNotification: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: false,
  theme: "light",
  notifications: [],

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setTheme: (theme) => set({ theme }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          ...notification,
          id: Math.random().toString(36).substr(2, 9),
        },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));

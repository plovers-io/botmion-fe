"use client";

import { create } from "zustand";
import { User } from "@/lib/types";

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  setAuthenticated: (value: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  token: null,

  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (typeof window !== "undefined" && token) {
      localStorage.setItem("authToken", token);
    }
    set({ token });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
    }
    set({ user: null, isAuthenticated: false, token: null });
  },
  setAuthenticated: (value) => set({ isAuthenticated: value }),
}));

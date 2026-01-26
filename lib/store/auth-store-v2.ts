import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User, AuthStore } from "@/lib/types/auth";

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoggingOut: false,
      login: (user: User) =>
        set({ user, isAuthenticated: true, isLoggingOut: false }),
      logout: () => set({ user: null, isAuthenticated: false }),
      setUser: (user: User | null) =>
        set({ user, isAuthenticated: user !== null }),
      setLoggingOut: (value: boolean) => set({ isLoggingOut: value }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => {
        // Return localStorage only on client side
        if (typeof window !== "undefined") {
          return localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
    },
  ),
);

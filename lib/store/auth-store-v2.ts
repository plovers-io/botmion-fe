import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User, AuthStore, LoginResponse, AuthTokens } from "@/lib/types/auth";

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoggingOut: false,

      login: (data: LoginResponse) => {
        // Tokens are managed by zustand persist storage only (no duplicate localStorage)
        set({
          user: data.user,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          isAuthenticated: true,
          isLoggingOut: false,
        });
      },

      logout: () => {
        // Tokens are cleared via zustand persist storage
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          // NOTE: Do NOT reset isLoggingOut here.
          // It must stay true so withAuth HOC can distinguish
          // intentional logout from unauthorized access.
        });
      },

      setUser: (user: User | null) =>
        set({ user, isAuthenticated: user !== null }),

      setTokens: (tokens: AuthTokens) => {
        // Tokens are managed by zustand persist storage only
        set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
        });
      },

      setLoggingOut: (value: boolean) => set({ isLoggingOut: value }),

      clearAuth: () => {
        // Tokens are cleared via zustand persist storage
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoggingOut: false,
        });
      },
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

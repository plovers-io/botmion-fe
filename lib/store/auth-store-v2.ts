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
        // Store tokens in localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
        }
        
        set({
          user: data.user,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          isAuthenticated: true,
          isLoggingOut: false,
        });
      },

      logout: () => {
        // Clear tokens from localStorage
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
        
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoggingOut: false,
        });
      },

      setUser: (user: User | null) =>
        set({ user, isAuthenticated: user !== null }),

      setTokens: (tokens: AuthTokens) => {
        // Store tokens in localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", tokens.access_token);
          localStorage.setItem("refresh_token", tokens.refresh_token);
        }
        
        set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
        });
      },

      setLoggingOut: (value: boolean) => set({ isLoggingOut: value }),

      clearAuth: () => {
        // Clear tokens from localStorage
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
        
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

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { ApiError } from "@/lib/types";
import { AuthService } from "./auth-service";
import { useAuthStore } from "@/lib/store/auth-store-v2";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/user";

/**
 * Detects DRF field-level validation errors: { field: ["msg", ...], ... }
 * Returns the errors map, or null if the response is not in that shape.
 */
function parseDRFErrors(data: unknown): Record<string, string[]> | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const record = data as Record<string, unknown>;
  // Skip objects that already have a top-level detail/message key
  if ("detail" in record || "message" in record) return null;
  const isFieldErrors = Object.values(record).every(
    (v) => Array.isArray(v) && v.every((s) => typeof s === "string")
  );
  return isFieldErrors ? (record as Record<string, string[]>) : null;
}

/** Formats field-level errors into a single readable string. */
function formatFieldErrors(errors: Record<string, string[]>): string {
  return Object.entries(errors)
    .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
    .join("; ");
}

/**
 * Helper to read tokens from the zustand persisted store.
 * This avoids direct localStorage access and keeps tokens in a single source of truth.
 */
function getTokensFromStore() {
  const state = useAuthStore.getState();
  return {
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
  };
}

class ApiClient {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Read token from zustand store (single source of truth)
        const { accessToken } = getTokensFromStore();
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor with token refresh logic
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Wait for the refresh to complete
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => {
                originalRequest._retry = true;
                return this.axiosInstance(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          const { refreshToken } = getTokensFromStore();

          if (!refreshToken) {
            this.isRefreshing = false;
            // Clear auth state and redirect to login
            useAuthStore.getState().clearAuth();
            if (typeof window !== "undefined") {
              window.location.href = "/auth/login";
            }
            return Promise.reject(error);
          }

          try {
            const response = await AuthService.refreshToken(refreshToken);
            
            // Update tokens in zustand store
            useAuthStore.getState().setTokens({
              access_token: response.access_token,
              refresh_token: response.refresh_token,
            });

            // Update authorization header
            this.axiosInstance.defaults.headers.common["Authorization"] =
              `Bearer ${response.access_token}`;
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${response.access_token}`;

            // Process the failed queue
            this.processQueue(null);

            this.isRefreshing = false;

            // Retry the original request
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError);
            this.isRefreshing = false;

            // Clear auth state and redirect to login
            useAuthStore.getState().clearAuth();
            if (typeof window !== "undefined") {
              window.location.href = "/auth/login";
            }

            return Promise.reject(refreshError);
          }
        }

        const responseData = error.response?.data as any;
        const fieldErrors = parseDRFErrors(responseData);
        const apiError: ApiError = {
          status: error.response?.status || 500,
          message:
            responseData?.detail ||
            responseData?.message ||
            responseData?.non_field_errors?.[0] ||
            (fieldErrors ? formatFieldErrors(fieldErrors) : null) ||
            error.message ||
            "An error occurred",
          code: error.code,
          detail: responseData?.detail,
          errors: fieldErrors ?? undefined,
        };
        return Promise.reject(apiError);
      },
    );
  }

  private processQueue(error: unknown) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve();
      }
    });

    this.failedQueue = [];
  }

  getInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

export const apiClient = new ApiClient().getInstance();

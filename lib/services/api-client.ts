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

function firstStringFromUnknown(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;

  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string" && item.trim()) {
        return item;
      }
    }
  }

  return null;
}

function extractApiErrorMessage(data: unknown, fallback: string): string {
  if (!data) return fallback;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (typeof data !== "object" || Array.isArray(data)) {
    return fallback;
  }

  const record = data as Record<string, unknown>;

  const topLevelMessage =
    firstStringFromUnknown(record.error) ||
    firstStringFromUnknown(record.detail) ||
    firstStringFromUnknown(record.message) ||
    firstStringFromUnknown(record.non_field_errors);

  if (topLevelMessage) {
    return topLevelMessage;
  }

  const fieldErrors = parseDRFErrors(record);
  if (fieldErrors) {
    return formatFieldErrors(fieldErrors);
  }

  // Generic fallback for backends returning { field: "message" } style errors.
  for (const value of Object.values(record)) {
    const message = firstStringFromUnknown(value);
    if (message) {
      return message;
    }
  }

  return fallback;
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

function authErrorMessageFromResponse(data: unknown): string {
  return extractApiErrorMessage(data, "").toLowerCase();
}

class ApiClient {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  private static readonly AUTH_403_HINTS = [
    "authentication credentials were not provided",
    "invalid token",
    "token has expired",
    "not authenticated",
    "authentication failed",
    "unauthorized",
  ];

  private static readonly NO_REFRESH_ENDPOINTS = [
    "/v1/login/",
    "/v1/register/",
    "/v1/refresh/",
    "/v1/logout/",
  ];

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
        const originalRequest = (error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        }) || undefined;

        const statusCode = error.response?.status;
        const isAuthErrorStatus = statusCode === 401 || statusCode === 403;
        const shouldTryRefresh =
          !!originalRequest &&
          !originalRequest._retry &&
          this.shouldAttemptRefresh(error, originalRequest);

        // Try token refresh once for auth-related failures.
        if (shouldTryRefresh) {
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
            this.clearAuthAndRedirect();
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

            this.clearAuthAndRedirect();

            return Promise.reject(refreshError);
          }
        }

        // If a retried request still fails with auth status, session is no longer valid.
        if (isAuthErrorStatus && originalRequest?._retry) {
          this.clearAuthAndRedirect();
        }

        const responseData = error.response?.data;
        const fieldErrors = parseDRFErrors(responseData);
        const apiError: ApiError = {
          status: error.response?.status || 500,
          message: extractApiErrorMessage(
            responseData,
            error.message || "An error occurred"
          ),
          code: error.code,
          detail:
            typeof responseData === "object" && responseData && !Array.isArray(responseData)
              ? firstStringFromUnknown(
                  (responseData as Record<string, unknown>).detail
                ) || undefined
              : undefined,
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

  private clearAuthAndRedirect() {
    useAuthStore.getState().clearAuth();
    if (typeof window !== "undefined" && window.location.pathname !== "/auth/login") {
      window.location.assign("/auth/login");
    }
  }

  private shouldAttemptRefresh(
    error: AxiosError,
    originalRequest: InternalAxiosRequestConfig & { _retry?: boolean },
  ): boolean {
    const statusCode = error.response?.status;
    if (statusCode !== 401 && statusCode !== 403) {
      return false;
    }

    const requestUrl = originalRequest.url || "";
    const lowerUrl = requestUrl.toLowerCase();
    if (ApiClient.NO_REFRESH_ENDPOINTS.some((endpoint) => lowerUrl.includes(endpoint))) {
      return false;
    }

    if (statusCode === 401) {
      return true;
    }

    // 403 can be authorization/business logic or auth-expired. Refresh only for auth-like responses.
    const errorMessage = authErrorMessageFromResponse(error.response?.data);
    return ApiClient.AUTH_403_HINTS.some((hint) => errorMessage.includes(hint));
  }

  getInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

export const apiClient = new ApiClient().getInstance();

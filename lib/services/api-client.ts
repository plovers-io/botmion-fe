import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { ApiError } from "@/lib/types";
import { AuthService } from "./auth-service";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/user";

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
        // Add auth token if available
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("access_token")
            : null;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
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
                return this.axiosInstance(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          const refreshToken =
            typeof window !== "undefined"
              ? localStorage.getItem("refresh_token")
              : null;

          if (!refreshToken) {
            this.isRefreshing = false;
            // Redirect to login or clear auth
            if (typeof window !== "undefined") {
              localStorage.removeItem("access_token");
              localStorage.removeItem("refresh_token");
              window.location.href = "/auth/login";
            }
            return Promise.reject(error);
          }

          try {
            const response = await AuthService.refreshToken(refreshToken);
            
            // Update tokens in localStorage
            if (typeof window !== "undefined") {
              localStorage.setItem("access_token", response.access_token);
              localStorage.setItem("refresh_token", response.refresh_token);
            }

            // Update authorization header
            this.axiosInstance.defaults.headers.common["Authorization"] =
              `Bearer ${response.access_token}`;
            originalRequest.headers.Authorization = `Bearer ${response.access_token}`;

            // Process the failed queue
            this.processQueue(null);

            this.isRefreshing = false;

            // Retry the original request
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError);
            this.isRefreshing = false;

            // Clear tokens and redirect to login
            if (typeof window !== "undefined") {
              localStorage.removeItem("access_token");
              localStorage.removeItem("refresh_token");
              window.location.href = "/auth/login";
            }

            return Promise.reject(refreshError);
          }
        }

        const apiError: ApiError = {
          status: error.response?.status || 500,
          message: error.message || "An error occurred",
          code: error.code,
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

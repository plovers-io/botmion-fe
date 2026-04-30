// Common type definitions for the application

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth types
export type { User, AuthStore } from "./auth";

// Layout types
export type {
  ProtectedLayoutProps,
  ProtectedLayoutWrapperProps,
} from "./layout";

// Form types
export type { AuthFormProps } from "./form";

// Chatbot types
export type {
  Chatbot,
  BotType,
  BotStatus,
  ChatbotCreateRequest,
  ChatbotUpdateRequest,
} from "./chatbot";

// Notification types
export type {
  NotificationItem,
  NotificationStatus,
  NotificationPriority,
  NotificationChannel,
  NotificationListParams,
} from "./notification";

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// DRF PageNumberPagination format (used by backend StandardResultsSetPagination)
export interface DRFPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Request error handling
export interface ApiError {
  status: number;
  message: string;
  code?: string;
  detail?: string;
  /** Raw DRF field-level validation errors, e.g. { title: ["This field is required."] } */
  errors?: Record<string, string[]>;
}

// Async request state
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

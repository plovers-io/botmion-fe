// Common type definitions for the application

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// User types (example)
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// Request error handling
export interface ApiError {
  status: number;
  message: string;
  code?: string;
}

// Async request state
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

"use client";

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ApiError } from "@/lib/types";

/**
 * Custom hook wrapper for React Query's useQuery
 * Provides type-safe API queries with consistent error handling
 */
export function useApiQuery<TData = unknown>(
  queryKey: (string | number)[],
  queryFn: () => Promise<TData>,
  options?: any,
) {
  return useQuery<TData, ApiError>({
    queryKey,
    queryFn,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    ...options,
  });
}

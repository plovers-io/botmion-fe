"use client";

import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { ApiError } from "@/lib/types";

/**
 * Custom hook wrapper for React Query's useMutation
 * Provides type-safe API mutations with consistent error handling
 */
export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, ApiError, TVariables>,
) {
  return useMutation<TData, ApiError, TVariables>({
    mutationFn,
    retry: 1,
    ...options,
  });
}

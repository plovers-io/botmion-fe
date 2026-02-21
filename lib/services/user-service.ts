import { apiClient } from "./api-client";
import { User, ApiResponse, PaginatedResponse } from "@/lib/types";

export const userService = {
  // Fetch all users
  getUsers: async (page: number = 1, pageSize: number = 10) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<User>>>(
      "/users",
      { params: { page, pageSize } }
    );
    return response.data;
  },

  // Fetch single user by ID
  getUser: async (id: string) => {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return response.data;
  },

  // Create new user
  createUser: async (
    userData: Omit<User, "id" | "createdAt" | "updatedAt">,
  ) => {
    const response = await apiClient.post<ApiResponse<User>>(
      "/users",
      userData
    );
    return response.data;
  },

  // Update user
  updateUser: async (id: string, userData: Partial<User>) => {
    const response = await apiClient.put<ApiResponse<User>>(
      `/users/${id}`,
      userData
    );
    return response.data;
  },

  // Delete user
  deleteUser: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<null>>(
      `/users/${id}`
    );
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await apiClient.get<ApiResponse<User>>("/users/me");
    return response.data;
  },
};

import { apiClient } from "./client";
import type { User } from "../types";
import type { RegisterData } from "./auth";

export const usersApi = {
  // GET /api/users — admin only.
  getAll: () => apiClient.get<User[]>("/users"),

  // Creating a user goes through the admin register endpoint.
  create: (data: RegisterData) => apiClient.post<User>("/register", data),

  update: (id: string, data: Partial<RegisterData>) =>
    apiClient.put<User>(`/users/${id}`, data),

  delete: (id: string) => apiClient.delete<void>(`/users/${id}`),
};

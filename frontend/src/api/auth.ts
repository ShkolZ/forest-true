import { apiClient } from "./client";
import type { User } from "../types";

// POST /api/auth/login returns the user record plus a signed JWT and refresh token.
export interface LoginResponse extends User {
  token: string;
  refresh_token: string;
}

export interface RegisterData {
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  is_admin?: boolean;
}

export const authApi = {
  login: (username: string, password: string) =>
    apiClient.post<LoginResponse>("/auth/login", { username, password }),

  // GET /api/me — requires a valid bearer token.
  getMe: () => apiClient.get<User>("/me"),

  // POST /api/auth/register — admin only, enforced server-side.
  register: (data: RegisterData) => apiClient.post<User>("/auth/register", data),
};

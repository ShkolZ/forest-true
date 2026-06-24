import { apiClient } from "./client";
import type { Category } from "../types";

export const categoriesApi = {
  // GET /api/categories — full list, used for the storefront filter and the
  // product form dropdown.
  getAll: () => apiClient.get<Category[]>("/categories"),

  // POST /api/categories — admin only. Creates a category by title and returns it.
  create: (title: string) => apiClient.post<Category>("/categories", { title }),
};

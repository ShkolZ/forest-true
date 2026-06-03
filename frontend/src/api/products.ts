import { apiClient } from "./client";
import type { Product } from "../types";

export const productsApi = {
  // GET /api/products — public listing.
  getAll: () => apiClient.get<Product[]>("/products"),

  // POST /api/products — admin only, multipart form (name, description, image).
  create: (data: FormData) => apiClient.post<Product>("/products", data),

  update: (id: string, data: FormData | Partial<Product>) =>
    apiClient.put<Product>(`/products/${id}`, data),

  delete: (id: string) => apiClient.delete<void>(`/products/${id}`),
};

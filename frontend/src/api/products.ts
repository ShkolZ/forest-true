import { apiClient } from "./client";
import type { Product } from "../types";

export const productsApi = {
  // GET /api/products — public listing. Pass a category title to filter
  // server-side via ?category=<title> (category titles are treated as unique).
  getAll: (category?: string) =>
    apiClient.get<Product[]>(
      category ? `/products?category=${encodeURIComponent(category)}` : "/products",
    ),

  // POST /api/products — admin only, multipart form (name, description, image).
  create: (data: FormData) => apiClient.post<Product>("/products", data),

  update: (id: string, data: FormData | Partial<Product>) =>
    apiClient.put<Product>(`/products/${id}`, data),

  delete: (id: string) => apiClient.delete<void>(`/products/${id}`),
};

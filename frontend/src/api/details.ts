import { apiClient } from "./client";
import type { Detail } from "../types";

// A "detail" is a part a product is made of — a single cut with its
// dimensions (width × length) and how many of it the product needs.
export interface CreateDetailPayload {
  product_id: string;
  name: string;
  width: number;
  length: number;
  // Edge banding per side.
  k_top: boolean;
  k_left: boolean;
  k_bottom: boolean;
  k_right: boolean;
  amount: number;
}

export const detailsApi = {
  // GET /api/products/:id/details — parts belonging to one product.
  getByProduct: (productId: string) =>
    apiClient.get<Detail[]>(`/products/${productId}/details`),

  // POST /api/details — add a part to a product.
  create: (data: CreateDetailPayload) =>
    apiClient.post<Detail>("/details", data),

  // PUT /api/details/:id — full replace of a part (send the complete body).
  update: (id: string, data: CreateDetailPayload) =>
    apiClient.put<Detail>(`/details/${id}`, data),

  delete: (id: string) => apiClient.delete<void>(`/details/${id}`),
};

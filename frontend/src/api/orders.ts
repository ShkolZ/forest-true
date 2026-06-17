import { apiClient } from "./client";
import type { Order, OrderItem } from "../types";

export interface CreateOrderPayload {
  title: string;
  items: Array<{ product_id: string; quantity: number }>;
}

export const ordersApi = {
  getAll: () => apiClient.get<Order[]>("/orders"),

  create: (data: CreateOrderPayload) => apiClient.post<Order>("/orders", data),

  update: (id: string, data: Partial<Order>) =>
    apiClient.put<Order>(`/orders/${id}`, data),

  delete: (id: string) => apiClient.delete<void>(`/orders/${id}`),

  getItems: (orderId: string) =>
    apiClient.get<OrderItem[]>(`/orders/${orderId}/items`),

  // Returns a short-lived signed URL for the order's Excel file.
  getDownloadUrl: (orderId: string) =>
    apiClient.get<{ url: string }>(`/orders/${orderId}/download`),
};

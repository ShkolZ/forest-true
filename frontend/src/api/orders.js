import api from './axios'

export const ordersApi = {
  getAll: () =>
    api.get('/orders'),

  getById: (id) =>
    api.get(`/orders/${id}`),

  create: (data) =>
    api.post('/orders', data),

  update: (id, data) =>
    api.put(`/orders/${id}`, data),

  delete: (id) =>
    api.delete(`/orders/${id}`),

  getItems: (orderId) =>
    api.get(`/orders/${orderId}/items`),
}

import api from './axios'

export const authApi = {
  login: (username, password) =>
    api.post('/login', { username, password }),

  getMe: () =>
    api.get('/me'),

  register: (userData) =>
    api.post('/register', userData),
}

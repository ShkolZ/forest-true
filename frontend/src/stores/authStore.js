import { create } from 'zustand'
import { extractUserFromToken, isTokenExpired } from '../utils/jwt'

const TOKEN_KEY = 'forest_true_token'

export const useAuthStore = create((set, get) => ({
  token: null,
  user: null,
  isAdmin: false,
  isAuthenticated: false,
  isLoading: true,

  login: (token) => {
    localStorage.setItem(TOKEN_KEY, token)
    const userInfo = extractUserFromToken(token)
    set({
      token,
      user: userInfo,
      isAdmin: userInfo?.isAdmin || false,
      isAuthenticated: true,
      isLoading: false,
    })
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    set({
      token: null,
      user: null,
      isAdmin: false,
      isAuthenticated: false,
      isLoading: false,
    })
  },

  /**
   * Called on app mount — rehydrate auth state from localStorage.
   */
  hydrate: () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token && !isTokenExpired(token)) {
      const userInfo = extractUserFromToken(token)
      set({
        token,
        user: userInfo,
        isAdmin: userInfo?.isAdmin || false,
        isAuthenticated: true,
        isLoading: false,
      })
    } else {
      localStorage.removeItem(TOKEN_KEY)
      set({ isLoading: false })
    }
  },
}))

import { create } from 'zustand'
import { extractUserFromToken, isTokenExpired } from '../utils/jwt'
import { TOKEN_KEY } from '../api/client'
import type { AuthUser } from '../types'

interface AuthStore {
  token: string | null
  user: AuthUser | null
  isAdmin: boolean
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string) => void
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  isAdmin: false,
  isAuthenticated: false,
  isLoading: true,

  login: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token)
    const userInfo = extractUserFromToken(token)
    set({
      token,
      user: userInfo,
      isAdmin: userInfo?.isAdmin ?? false,
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

  hydrate: () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token && !isTokenExpired(token)) {
      const userInfo = extractUserFromToken(token)
      set({
        token,
        user: userInfo,
        isAdmin: userInfo?.isAdmin ?? false,
        isAuthenticated: true,
        isLoading: false,
      })
    } else {
      localStorage.removeItem(TOKEN_KEY)
      set({ isLoading: false })
    }
  },
}))

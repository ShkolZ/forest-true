import { create } from 'zustand'
import { extractUserFromToken, isTokenExpired } from '../utils/jwt'
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  refreshAccessToken,
} from '../api/client'
import type { AuthUser } from '../types'

interface AuthStore {
  token: string | null
  user: AuthUser | null
  isAdmin: boolean
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string, refreshToken?: string) => void
  logout: () => void
  hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => {
  // Derive the authenticated state from a (valid) access token.
  const applyToken = (token: string) => {
    const userInfo = extractUserFromToken(token)
    set({
      token,
      user: userInfo,
      isAdmin: userInfo?.isAdmin ?? false,
      isAuthenticated: true,
      isLoading: false,
    })
  }

  const clear = () => {
    clearTokens()
    set({
      token: null,
      user: null,
      isAdmin: false,
      isAuthenticated: false,
      isLoading: false,
    })
  }

  return {
    token: null,
    user: null,
    isAdmin: false,
    isAuthenticated: false,
    isLoading: true,

    login: (token: string, refreshToken?: string) => {
      setTokens(token, refreshToken)
      applyToken(token)
    },

    logout: clear,

    hydrate: async () => {
      const token = getAccessToken()
      if (token && !isTokenExpired(token)) {
        applyToken(token)
        return
      }
      // Access token is missing or expired — try to recover via refresh so the
      // session survives the short access-token lifetime across reloads.
      if (getRefreshToken()) {
        try {
          applyToken(await refreshAccessToken())
          return
        } catch {
          // fall through to a clean logout
        }
      }
      clear()
    },
  }
})

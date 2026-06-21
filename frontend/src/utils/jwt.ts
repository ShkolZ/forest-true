import type { AuthUser } from '../types'

interface JwtPayload {
  sub?: string
  isAdmin?: boolean
  iat?: number
  exp?: number
  [key: string]: unknown
}

function decodeJWT(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded) as JwtPayload
  } catch {
    return null
  }
}

// `skewMs` treats a token as expired slightly early, so a request never goes
// out with a token that lapses mid-flight.
export function isTokenExpired(token: string, skewMs = 0): boolean {
  const payload = decodeJWT(token)
  if (!payload || !payload.exp) return true
  return Date.now() >= payload.exp * 1000 - skewMs
}

export function extractUserFromToken(token: string): AuthUser | null {
  const payload = decodeJWT(token)
  if (!payload) return null
  return {
    id: payload.sub ?? null,
    isAdmin: payload.isAdmin ?? false,
    issuedAt: payload.iat ? new Date(payload.iat * 1000) : null,
    expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
  }
}

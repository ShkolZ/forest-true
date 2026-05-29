/**
 * Decode a JWT token payload without verification.
 * Used client-side only to extract claims like isAdmin and expiry.
 */
export function decodeJWT(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Check if a JWT token is expired.
 */
export function isTokenExpired(token) {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;
  // exp is in seconds, Date.now() in ms
  return Date.now() >= payload.exp * 1000;
}

/**
 * Extract user info from JWT claims.
 */
export function extractUserFromToken(token) {
  const payload = decodeJWT(token);
  if (!payload) return null;
  console.log(payload);
  return {
    id: payload.sub || null,
    isAdmin: payload.isAdmin || false,
    issuedAt: payload.iat ? new Date(payload.iat * 1000) : null,
    expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
  };
}

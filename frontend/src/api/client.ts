// Thin fetch wrapper used by every API module.
// - Reads the JWT straight from localStorage so it has no dependency on the store.
// - Before each request it checks the access token's expiry and, if it has lapsed,
//   transparently refreshes it via POST /auth/refresh (single-flight) before sending.
// - Sends JSON by default, but passes FormData through untouched (for file uploads).
// - On 401 it clears the tokens and bounces to /login, mirroring a logout.

import { isTokenExpired } from "../utils/jwt";

export const TOKEN_KEY = "forest_true_token";
export const REFRESH_TOKEN_KEY = "forest_true_refresh_token";

const BASE_URL = "/api";
// Refresh this many ms before the access token actually expires.
const EXPIRY_SKEW_MS = 10_000;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message || `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
  }
}

// --- token storage --------------------------------------------------------
// Both tokens live in localStorage; the store and pages go through these
// helpers so there's a single place that knows the storage keys.

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(token: string, refreshToken?: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function redirectToLogin(): void {
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

// --- refresh --------------------------------------------------------------
// POST /auth/refresh with the stored refresh token; the backend rotates it and
// returns a fresh pair. A module-level promise makes this single-flight, so a
// burst of expired-token requests triggers exactly one refresh call.

interface RefreshResponse {
  token: string;
  refresh_token: string;
}

let refreshPromise: Promise<string> | null = null;

export function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return Promise.reject(new ApiError(401, "No refresh token"));
  }

  refreshPromise = (async () => {
    // Raw fetch (not `request`) so this never recurses through the expiry check.
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) {
      throw new ApiError(res.status, "Could not refresh session");
    }
    const data = (await res.json()) as RefreshResponse;
    setTokens(data.token, data.refresh_token);
    return data.token;
  })();

  // Reset the in-flight marker once it settles, success or failure.
  void refreshPromise.finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

// Return a non-expired access token, refreshing first if the current one has
// lapsed. Returns null when there's no token at all (e.g. the login request).
async function ensureValidToken(): Promise<string | null> {
  const token = getAccessToken();
  if (!token) return null;
  if (!isTokenExpired(token, EXPIRY_SKEW_MS)) return token;
  if (!getRefreshToken()) return token; // nothing to refresh with — let the server 401

  try {
    return await refreshAccessToken();
  } catch {
    clearTokens();
    redirectToLogin();
    throw new ApiError(401, "Session expired");
  }
}

type Body = unknown;

interface RequestOptions {
  method?: string;
  body?: Body;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body } = options;
  const headers = new Headers();

  const token = await ensureValidToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const isFormData = body instanceof FormData;
  let payload: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (isFormData) {
      payload = body as FormData; // browser sets multipart boundary
    } else {
      headers.set("Content-Type", "application/json");
      payload = JSON.stringify(body);
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: payload });

  if (res.status === 401) {
    clearTokens();
    redirectToLogin();
    throw new ApiError(401, "Unauthorized");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(res.status, text.trim());
  }

  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: Body) => request<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: Body) => request<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: Body) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

// Thin fetch wrapper used by every API module.
// - Reads the JWT straight from localStorage so it has no dependency on the store.
// - Sends JSON by default, but passes FormData through untouched (for file uploads).
// - On 401 it clears the token and bounces to /login, mirroring a logout.

export const TOKEN_KEY = "forest_true_token";

const BASE_URL = "/api";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message || `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
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

  const token = localStorage.getItem(TOKEN_KEY);
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
    localStorage.removeItem(TOKEN_KEY);
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
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

# Forest True

Furniture management platform. A public storefront where authenticated users browse
products and build orders, plus an admin dashboard for managing products, users, and
orders. Monorepo with a Go backend and a React frontend.

```
forest-true/
├── backend/    Go HTTP API (net/http + sqlc + Postgres)
└── frontend/   Vite + React + TypeScript SPA (Tailwind, zustand, fetch)
```

---

## Frontend (`frontend/`)

### Stack
- **Vite 8** + **React 19** + **TypeScript** (strict).
- **Tailwind CSS v4** for all styling — via the `@tailwindcss/vite` plugin, no
  `tailwind.config.js`. Theme tokens live in `src/index.css` under `@theme`.
- **zustand** for client state (`authStore`, `cartStore`).
- **react-router-dom v7** for routing.
- Data fetching uses the **native `fetch` API** (no axios) through a thin wrapper.
- Auth is persisted in **localStorage** (key `forest_true_token`); admin status is
  decoded from the JWT, never stored separately.

### Commands (run from `frontend/`)
- `npm run dev` — dev server on `:5173`, proxies `/api` → `http://localhost:42069`.
- `npm run build` — type-aware production build to `dist/`.
- `npm run lint` — ESLint (flat config, `react-hooks` v7 rules are strict).
- `npm run preview` — serve the built `dist/`.

### Routes (`src/App.tsx`)
| Path | Guard | Renders |
|------|-------|---------|
| `/login` | public | `LoginPage` |
| `/products` | `ProtectedRoute` → `AppLayout` | `ProductsPage` (storefront + cart) |
| `/dashboard` | `AdminRoute` → `DashboardLayout` | redirects to `/dashboard/products` |
| `/dashboard/products` | admin | `DashboardProducts` (CRUD table + modal) |
| `/dashboard/users` | admin | `DashboardUsers` (CRUD table + modal) |
| `/dashboard/orders` | admin | `DashboardOrders` (table + status modal) |
| `*` | — | redirect to `/login` |

`ProtectedRoute` requires a valid token; `AdminRoute` additionally requires the JWT's
`isAdmin` claim and bounces non-admins to `/products`.

### Directory map (`frontend/src/`)
```
api/
  client.ts      fetch wrapper: injects Bearer token from localStorage, sets JSON
                 headers (passes FormData through untouched), throws ApiError on
                 non-2xx, and on 401 clears the token + redirects to /login.
                 Exports `apiClient` (get/post/put/patch/delete) and `TOKEN_KEY`.
  auth.ts        login / getMe / register. login() returns user + token + refresh_token.
  products.ts    getAll / create (FormData) / update / delete.
  users.ts       getAll / create (→ /register) / update / delete.
  orders.ts      getAll / create / update / delete / getItems.
stores/
  authStore.ts   token + decoded user, isAdmin, isAuthenticated, isLoading.
                 login(token) persists to localStorage; hydrate() restores on boot
                 (called once in App); logout() clears it. Shares TOKEN_KEY w/ client.
  cartStore.ts   in-memory cart (add/remove/updateQuantity/clearCart).
utils/jwt.ts     decode JWT payload, isTokenExpired, extractUserFromToken.
types/index.ts   shared interfaces (Product, User, Order, OrderItem, Detail, CartItem,
                 AuthUser, Column<T>, ToastType, etc.).
hooks/useToast.tsx   ToastProvider + useToast() — global toast notifications.
components/
  ProtectedRoute.tsx / AdminRoute.tsx   route guards.
  layout/AppLayout.tsx       storefront top bar (brand, cart badge, logout).
  layout/DashboardLayout.tsx admin shell (sidebar + content).
  layout/Sidebar.tsx         admin nav (dark forest sidebar).
  ui/                        presentational primitives, all Tailwind-styled:
                             Button, Input, Card (+ Image/Body/Title/Description/
                             Footer subcomponents), Modal, Table<T>, Badge, Spinner,
                             Toast.
pages/
  LoginPage.tsx
  ProductsPage.tsx
  dashboard/DashboardProducts.tsx
  dashboard/DashboardUsers.tsx
  dashboard/DashboardOrders.tsx
index.css        Tailwind entry: @import "tailwindcss", @theme tokens, base styles,
                 and animation utilities (animate-fade-in / scale-in / slide-in-right).
main.tsx         React root; imports index.css.
```

### Conventions / gotchas
- **API calls return parsed data directly** (e.g. `const products = await productsApi.getAll()`),
  not an axios-style `{ data }` envelope. Errors throw `ApiError` (has `.status`,
  `.message`); catch and check `err instanceof ApiError`.
- **Design tokens**: use `brand-50…900` (emerald) and `forest-900/800` (dark green)
  utilities defined in `index.css`. Keep styling in Tailwind classes — there are no
  per-component `.css` files.
- **Data fetch on mount** uses an inline `void (async () => { await loadX(); })()`
  inside `useEffect`, with `loadX` wrapped in `useCallback`. This shape satisfies the
  strict `react-hooks/set-state-in-effect` and `exhaustive-deps` rules — keep it when
  adding new fetch-on-mount pages. Loaders do **not** call `setLoading(true)`
  synchronously (initial `loading` state is `true`).
- The Go server can also serve the built SPA from `/frontend/` (see backend `main.go`),
  but day-to-day dev uses the Vite proxy.

---

## Backend (`backend/`)

### Stack
Go `net/http` (Go 1.22 method-prefixed routing), **sqlc**-generated queries over
**Postgres** (`lib/pq`), **argon2id** password hashing, **JWT** (HS256) auth.

### Run
Needs `backend/.env` with `PORT`, `DB_STRING`, `JWT_SECRET` (see `.env.example`).
Currently `PORT=42069` (matches the Vite proxy target). `go run .` from `backend/`.

### API endpoints (`backend/main.go`)
| Method & path | Auth | Handler | Status |
|---------------|------|---------|--------|
| `GET /api/products` | public | `handlerGetProducts` | working |
| `POST /api/products` | bearer | `handlerPostProducts` | partial — parses multipart, not yet persisted |
| `GET /api/users` | bearer | `handlerGetUsers` | working |
| `POST /api/register` | bearer + admin | `handlerRegister` | working |
| `POST /api/login` | public | `handlerLogin` | working — returns user + `token` + `refresh_token` |
| `GET /api/me` | bearer | `handlerMe` | stub (returns `{}`) |
| `GET /api/details` | public | `handlerGetDetails` | stub |
| `POST /api/detail` | bearer | `handlerPostDetails` | stub |

Auth: `AuthMiddleware` validates `Authorization: Bearer <jwt>`, puts `AuthInfo`
(`UserID`, `IsAdmin`) on the request context. JWT carries `sub` (user id) and the
custom `isAdmin` claim; access tokens expire in 30 min.

> **Frontend ↔ backend mismatch (intentional, frontend is ahead):** the frontend API
> layer already calls endpoints the backend hasn't implemented yet — orders CRUD
> (`/api/orders*`), product/user `update`/`delete`, and `getById`. Those screens will
> error until the corresponding Go handlers + routes exist. Working flows today: login,
> list products, list users, create user (admin).

### Source layout
```
main.go            config load, route table, server boot.
middleware.go      AuthMiddleware, LoggingMiddleware, AuthInfo/context key.
handler_*.go       HTTP handlers (users, products, details, helper).
handler_helper.go  respondWithJson.
internal/auth/     hashing, JWT make/validate, bearer-token parsing, refresh tokens.
internal/database/ sqlc-generated models + query methods (DO NOT EDIT by hand).
sql/schemas/       migrations (users, products, details, orders, order_items, refresh_tokens).
sql/queries/       sqlc query sources; regenerate with `sqlc generate` (sqlc.yaml).
```

### Data model (Postgres)
`users` (username, password_hash, first/last name, is_admin) · `products`
(name, description?, image_url?) · `details` (per-product cut: width/length/amount) ·
`orders` (status, excel_url?, user_id) · `order_items` (quantity, order_id, product_id) ·
`refresh_tokens`.

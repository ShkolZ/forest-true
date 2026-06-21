# Forest True

Furniture management platform. A public storefront where authenticated users browse
products and build orders, plus an admin dashboard for managing products, users, and
orders. Placing an order generates an Excel cut-list (one row per part, expanded by
quantity) that is stored privately and downloadable via a short-lived signed URL.
Product images and order spreadsheets live in S3-compatible object storage (MinIO in
dev). UI is bilingual (English / Ukrainian). Monorepo with a Go backend and a React
frontend.

```
forest-true/
├── backend/    Go HTTP API (net/http + sqlc + Postgres + S3/MinIO + excelize)
└── frontend/   Vite + React + TypeScript SPA (Tailwind, zustand, i18next, fetch)
```

---

## Frontend (`frontend/`)

### Stack
- **Vite 8** + **React 19** + **TypeScript** (strict).
- **Tailwind CSS v4** for all styling — via the `@tailwindcss/vite` plugin, no
  `tailwind.config.js`. Theme tokens live in `src/index.css` under `@theme`.
- **zustand** for client state (`authStore`, `cartStore`).
- **react-router-dom v7** for routing.
- **i18next** (`react-i18next` + `i18next-browser-languagedetector`) for translations.
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

### Internationalization
- Config in `src/i18n/index.ts`; initialized once via `import './i18n'` in `main.tsx`.
- Translation catalogs: `src/i18n/locales/en.json`, `uk.json`. Components read strings
  with `useTranslation()` / `t('key')`.
- Selected language persists to localStorage (key `forest_true_lang`), falling back to
  the browser language then `en`. `LanguageSwitcher` (in `components/ui/`) toggles it.

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
  orders.ts      getAll / create / update / delete / getItems / getDownloadUrl.
  details.ts     getByProduct / create / update / delete (per-product cut parts).
stores/
  authStore.ts   token + decoded user, isAdmin, isAuthenticated, isLoading.
                 login(token) persists to localStorage; hydrate() restores on boot
                 (called once in App); logout() clears it. Shares TOKEN_KEY w/ client.
  cartStore.ts   in-memory cart (add/remove/updateQuantity/clearCart).
i18n/
  index.ts       i18next setup, LANGUAGE_KEY, SUPPORTED_LANGUAGES (en, uk).
  locales/       en.json, uk.json translation catalogs.
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
                             Toast, LanguageSwitcher.
pages/
  LoginPage.tsx
  ProductsPage.tsx
  dashboard/DashboardProducts.tsx
  dashboard/DashboardUsers.tsx
  dashboard/DashboardOrders.tsx
index.css        Tailwind entry: @import "tailwindcss", @theme tokens, base styles,
                 and animation utilities (animate-fade-in / scale-in / slide-in-right).
main.tsx         React root; imports index.css and ./i18n.
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
- **User-facing copy goes through `t()`** with keys in both `en.json` and `uk.json` —
  don't hardcode display strings.

---

## Backend (`backend/`)

### Stack
Go `net/http` (Go 1.22 method-prefixed routing), **sqlc**-generated queries over
**Postgres** (`lib/pq`), **argon2id** password hashing, **JWT** (HS256) auth.
Object storage via **aws-sdk-go-v2/s3** pointed at **MinIO** (path-style, region
`eu-north-1`) — a public bucket for product images and a private bucket for order
spreadsheets (served through presigned URLs). Excel generation via **excelize/v2**.

### Run
Needs `backend/.env`. Required keys (note `.env.example` is incomplete):
`PORT`, `DB_STRING`, `JWT_SECRET`, `MINIO_ENDPOINT`, `MINIO_PRIVATE_ENDPOINT`,
`MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `PUBLIC_BUCKET`, `PRIVATE_BUCKET`,
`DOMAIN_NAME`. Boot fails fast if any are missing. `PORT=42069` (matches the Vite
proxy target). Start MinIO with `docker compose -f docker-compose.dev.yml up` from the
repo root, then `go run .` from `backend/`.

### API endpoints (`backend/main.go`)
| Method & path | Auth | Handler | Status |
|---------------|------|---------|--------|
| `GET /api/products` | public | `handlerGetProducts` | working |
| `GET /api/products/{ID}/details` | public | `handlerGetDetails` | working |
| `GET /api/users` | bearer | `handlerGetUsers` | working |
| `GET /api/me` | bearer | `handlerMe` | stub (returns `{}`) |
| `GET /api/orders` | bearer | `handlerGetOrders` | working — joins username |
| `GET /api/orders/{ID}/items` | bearer | `handlerGetOrderItems` | working |
| `GET /api/orders/{ID}/download` | bearer + admin | `handlerDownloadExcel` | working — returns presigned URL |
| `POST /api/login` | public | `handlerLogin` | working — returns user + `token` + `refresh_token` |
| `POST /api/register` | bearer + admin | `handlerRegister` | working |
| `POST /api/products` | bearer | `handlerPostProducts` | working — persists + uploads image to public bucket |
| `POST /api/details` | bearer + admin | `handlerPostDetails` | working |
| `POST /api/orders` | bearer | `handlerPostOrders` | working — builds Excel, uploads to private bucket, creates order + items |
| `DELETE /api/products/{ID}` | bearer + admin | `handlerDeleteProduct` | working — also deletes image from bucket |
| `DELETE /api/details/{ID}` | bearer + admin | `handlerDeleteDetail` | working |
| `DELETE /api/users/{ID}` | bearer + admin | `handlerDeleteUser` | working |
| `PUT /api/details/{ID}` | bearer + admin | `handlerPutDetail` | stub — decodes body but does not persist |

Auth: `AuthMiddleware` validates `Authorization: Bearer <jwt>`, puts `AuthInfo`
(`UserID`, `IsAdmin`) on the request context (`authContextKey`). Admin-only handlers
re-check via the `checkAdmin(r)` helper. JWT carries `sub` (user id) and the custom
`isAdmin` claim; access tokens expire in 30 min.

> **Frontend ↔ backend mismatch (intentional, frontend is ahead):** the frontend API
> layer still calls endpoints with no route yet — product update (`PUT /api/products/:id`),
> user update, and order update/delete (`ordersApi.update`/`delete`; a
> `handlerDeleteOrder` exists in `handler_orders.go` but is **not** wired into `main.go`).
> `PUT /api/details/:id` is routed but a stub. Those actions will error until the
> handlers/routes are completed.

### Source layout
```
main.go             config load (env, DB, two S3 clients), route table, server boot.
middleware.go       AuthMiddleware, LoggingMiddleware, AuthInfo/context key.
handler_users.go    register, login (issues JWT + refresh token), me (stub),
                    get users, delete user.
handler_products.go get / create (multipart → S3 public bucket) / delete products.
handler_details.go  get-by-product / create / delete details; put (stub).
handler_orders.go   create (Excel + S3 private bucket + order/items), list,
                    get items, download (presigned), delete (unrouted).
helpers.go          respondWithJson / respondWithError, checkAdmin, getPathValueUUID,
                    createExcel (excelize cut-list), createOrderItems, btoi.
internal/auth/      hashing, JWT make/validate, bearer-token parsing, refresh tokens.
internal/database/  sqlc-generated models + query methods (DO NOT EDIT by hand).
sql/schemas/        migrations (users, products, details, orders, order_items, refresh_tokens).
sql/queries/        sqlc query sources; regenerate with `sqlc generate` (sqlc.yaml).
```

### Data model (Postgres)
- `users` — username, password_hash, first/last name, is_admin.
- `products` — name, description, image_url (all `NOT NULL`; image_url is the public
  bucket URL).
- `details` — per-product cut part: name, width, length, amount, plus four edge-banding
  flags `k_top` / `k_bottom` / `k_left` / `k_right` (booleans), FK `product_id`.
- `orders` — title, excel_url (private bucket URL), FK `user_id`. (No status column.)
- `order_items` — quantity, FK `order_id`, FK `product_id`.
- `refresh_tokens` — token, revoked_at, FK `user_id`.

The Excel cut-list (`createExcel` in `helpers.go`) has Ukrainian headers and emits one
row per part per unit of quantity, mapping the `k_*` flags to the ОВ/ОН/ОЛ/ОП columns.

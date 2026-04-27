# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es este proyecto

Frontend Next.js (App Router) para una plataforma de **Batch Cooking** en Lima, Perú. Los usuarios programan sus almuerzos y cenas de lunes a viernes; el staff valida pagos y gestiona entregas; el admin configura el sistema.

El backend (NestJS + Prisma + Supabase) vive en `../batch-cooking-api` y ya está completamente implementado. Este repo es solo el frontend.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15, App Router, TypeScript estricto |
| Estilos | Tailwind CSS + shadcn/ui (componentes copiados en `components/ui/`) |
| Server state | TanStack Query v5 (`useQuery` / `useMutation`) |
| Client state | Zustand (`store/`) |
| Auth | Supabase Auth via `@supabase/ssr` |
| Forms | React Hook Form + Zod |
| Notificaciones | sonner (Toaster) |

---

## Comandos

```bash
npm run dev          # servidor local en http://localhost:3000
npm run build        # build de producción
npm run lint         # ESLint
npx tsc --noEmit     # chequeo de tipos sin compilar
```

No hay tests en este proyecto. El backend tiene los tests unitarios relevantes.

---

## Variables de entorno

Archivo `.env.local` (no commitear):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://localhost:8080/v1
```

---

## Arquitectura

### Route groups y guards de rol

Las rutas están organizadas en grupos de App Router que actúan como barreras de rol:

```
app/
├── (auth)/         → login, registro — no requiere sesión
├── (client)/       → layout.tsx hace redirect si role !== CLIENT
├── (staff)/        → layout.tsx hace redirect si role !== STAFF y !== ADMIN
└── (admin)/        → layout.tsx hace redirect si role !== ADMIN
```

`app/page.tsx` es el punto de entrada: lee el rol del store de Zustand y redirige al destino correcto (`/menu`, `/payments`, o `/config`).

`middleware.ts` refresca el token de Supabase en cada request (requerido por `@supabase/ssr`).

### Rol: no viene en el JWT

El `role` **no está en el JWT de Supabase**. Se obtiene llamando a `GET /v1/profile/me` tras el login y se guarda en `store/auth.store.ts`. Los guards de los layouts leen el rol desde ese store.

### Clientes Supabase — dos versiones

- `lib/supabase/client.ts` → `createBrowserClient` para Client Components
- `lib/supabase/server.ts` → `createServerClient` con cookies para Server Components y middleware

### API client (`lib/api/client.ts`)

`apiFetch(path, options)` es el único punto de entrada al backend:
- Lee el token con `supabase.auth.getSession()`
- Inyecta `Authorization: Bearer <token>` automáticamente
- Si `!response.ok`, lanza un error tipado `{ statusCode, code, errorMessage }` que coincide con el formato de errores del backend

Cada módulo del backend tiene su archivo en `lib/api/`:
`catalog.ts`, `orders.ts`, `payments.ts`, `operations.ts`, `admin.ts`, `delivery.ts`, `profile.ts`

### TanStack Query

- **Queries:** cada recurso tiene una query key consistente, e.g. `['orders', weekIdentifier]`, `['catalog', weekIdentifier]`
- **Mutations:** siempre incluyen `onSuccess` que invalida las queries relacionadas con `queryClient.invalidateQueries`
- El `QueryClientProvider` vive en `app/layout.tsx` junto al `Toaster` de sonner

### Zustand stores

- `store/auth.store.ts` → `{ user, role, isLoading, setUser, setRole, clearAuth }`
- `store/week.store.ts` → semana actualmente seleccionada en formato `YYYY-WNN` (default: semana actual). Lo comparten todas las páginas con selector de semana.

---

## API — Contratos del backend

Base URL: `NEXT_PUBLIC_API_URL` (ej. `http://localhost:8080/v1`)

### Autenticación (solo Supabase, sin backend)
```
supabase.auth.signInWithPassword / signUp / signOut
```

### Profile
```
GET /profile/me                                → { id, role }
```

### Delivery
```
GET  /delivery-zones                           → DeliveryZone[]
GET  /delivery-addresses                       → DeliveryAddress[]  (del usuario autenticado)
POST /delivery-addresses                       → DeliveryAddress
PUT  /delivery-addresses/:addressId            → DeliveryAddress
DEL  /delivery-addresses/:addressId            → 204
```

### Catalog
```
GET    /catalog/:weekIdentifier                → { dishes[], packages[] }
POST   /catalog/dishes                         → CatalogDish         [STAFF]
PUT    /catalog/packages                       → WeeklyPackage        [STAFF]
DELETE /catalog/dishes/:dishId                 → 204                 [STAFF]
```

### Orders (CLIENT)
```
GET    /orders?week=YYYY-WNN                   → Order[]
GET    /orders/:orderId                        → Order + items[]
POST   /orders                                 → Order (DRAFT)
PATCH  /orders/:orderId/items                  → OrderItem (upsert por día+comida)
PATCH  /orders/:orderId/package                → Order (aplica paquete prearmado)
POST   /orders/:orderId/checkout               → Order (PENDING_PAYMENT) — transacción atómica
PATCH  /orders/:orderId/cancel                 → Order (CANCELLED)
DELETE /orders/:orderId                        → 204 (solo estado DRAFT)
```

### Payments
```
POST /orders/:orderId/voucher-upload-url       → { uploadUrl, objectName }  [CLIENT]
POST /orders/:orderId/confirm-voucher          → Order                       [CLIENT]
POST /orders/:orderId/confirm-payment          → Order (CONFIRMED)           [STAFF]
```

### Operations (STAFF)
```
GET  /operations/orders/pending-payment?week=  → Order[]
GET  /operations/orders/:orderId/voucher       → { signedUrl }   (expira 15 min)
POST /operations/orders/:orderId/deliver       → Order (DELIVERED)
GET  /operations/reports/production?week=      → ProductionReport
GET  /operations/reports/delivery?week=        → DeliveryReport
```

### Admin
```
PUT   /admin/weekly-configs                    → WeeklyConfig
PATCH /admin/delivery-zones/:zoneId            → DeliveryZone
POST  /admin/cleanup-vouchers                  → { deleted: number }
```

---

## Flujo de subida de voucher (3 pasos, crítico)

El archivo **nunca pasa por el backend**:

1. `POST /orders/:id/voucher-upload-url` → `{ uploadUrl, objectName }`
2. `fetch(uploadUrl, { method: 'PUT', body: file })` — directo a Google Cloud Storage
3. `POST /orders/:id/confirm-voucher` con `{ objectName }` → orden pasa a `PENDING_PAYMENT`

El input file no debe comprimir la imagen (calidad original).

---

## Estados de orden y transiciones

```
DRAFT → (checkout) → PENDING_PAYMENT → (confirm-payment) → CONFIRMED → (deliver) → DELIVERED
                                                                                     ↑
DRAFT | PENDING_PAYMENT | CONFIRMED → (cancel) → CANCELLED  ←────────────────────────
```

- Solo `DRAFT` y `PENDING_PAYMENT` son editables por el usuario.
- `PENDING_PAYMENT` bloquea la edición de ítems; solo permite subir/resubir voucher.
- El checkout usa una transacción atómica en el backend: valida `maxOrders` antes de confirmar.
- La ventana de pedidos cierra los **viernes a las 12:00 PM hora de Lima** (UTC−5). El backend lanza `OrderWindowClosedException` (HTTP 422) si se intenta operar fuera de ventana.

---

## Errores del backend

El backend responde errores con esta forma:
```json
{ "statusCode": 422, "code": "order-window-closed", "errorMessage": "Order window is closed" }
```

Códigos relevantes para mostrar mensajes específicos en la UI:
- `order-window-closed` → "La ventana de pedidos está cerrada"
- `order-capacity-exceeded` → "Capacidad semanal alcanzada"
- `order-not-editable` → "Este pedido no se puede modificar en su estado actual"
- `data-not-found` → 404
- `unauthorized-access` → 403

---

## Semana (`week_identifier`)

Formato ISO: `YYYY-WNN` (ej. `2026-W16`). `lib/utils.ts` expone `currentWeekIdentifier()` que calcula la semana actual. El store `week.store.ts` guarda la semana seleccionada globalmente para los selectores de semana en vistas STAFF/ADMIN.

---

## shadcn/ui

Los componentes están en `components/ui/` y son código propio (no dependencia de terceros). Para agregar uno nuevo: `npx shadcn@latest add <componente>`. No modificar los archivos generados en `components/ui/` directamente — crear wrappers en `components/[feature]/` si se necesita lógica adicional.

---

## Reglas de implementación

- Todo fetch al backend pasa por `lib/api/client.ts` — nunca usar `fetch` directo con el token.
- Los guards de rol van **en el layout del route group**, no en cada page.tsx.
- El rol se lee desde `store/auth.store.ts` — nunca desde el JWT directamente.
- `useQuery` siempre con skeleton de carga y estado vacío explícito.
- `useMutation` siempre con `onSuccess` que invalida queries + toast de resultado.
- Forms siempre con `react-hook-form` + schema Zod; sin validación manual.
- shadcn/ui `Dialog` para creación/edición inline; páginas separadas solo para flujos complejos (editor de orden, pago).

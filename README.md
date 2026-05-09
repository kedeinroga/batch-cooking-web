# Batch Cooking Web

Frontend para la plataforma de batch cooking en Lima, Perú. Los clientes programan almuerzos y cenas de lunes a viernes; el staff valida pagos y gestiona entregas; el admin configura el sistema.

El backend vive en `../batch-cooking-api`.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15, App Router, TypeScript |
| Estilos | Tailwind CSS 4 + shadcn/ui |
| Server state | TanStack Query v5 |
| Client state | Zustand |
| Auth | Supabase Auth (`@supabase/ssr`) |
| Forms | React Hook Form + Zod |
| Notificaciones | sonner |

## Configuración local

Crear `.env.local` en la raíz del proyecto (está en `.gitignore`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://localhost:8080/v1
```

## Comandos

```bash
npm install

npm run dev        # servidor local en http://localhost:3000
npm run build      # build de producción
npm run start      # servidor de producción (requiere build previo)
npm run lint       # ESLint
npx tsc --noEmit   # chequeo de tipos sin compilar
```

No hay tests en este proyecto. Los tests unitarios relevantes están en la API.

## Arquitectura

### Route groups y guards de rol

Las rutas usan route groups de App Router que actúan como barreras de acceso:

```
app/
├── (auth)/     → login, registro — sin sesión requerida
├── (client)/   → layout redirige si role !== CLIENT
├── (staff)/    → layout redirige si role !== STAFF y !== ADMIN
└── (admin)/    → layout redirige si role !== ADMIN
```

`app/page.tsx` es el punto de entrada: lee el rol del store de Zustand y redirige al destino correcto.

`middleware.ts` refresca el token de Supabase en cada request (requerido por `@supabase/ssr`).

### El rol no viene en el JWT

El `role` se obtiene llamando a `GET /v1/profile/me` tras el login y se guarda en `store/auth.store.ts`. Los layouts de cada route group leen el rol desde ese store.

### Clientes Supabase

- `lib/supabase/client.ts` → `createBrowserClient` para Client Components
- `lib/supabase/server.ts` → `createServerClient` con cookies para Server Components y middleware

### API client

`lib/api/client.ts` expone `apiFetch(path, options)`, el único punto de entrada al backend:
- Inyecta `Authorization: Bearer <token>` automáticamente
- Si `!response.ok`, lanza un error tipado `{ statusCode, code, errorMessage }` que coincide con el formato de errores del backend

Cada módulo tiene su archivo en `lib/api/`: `catalog.ts`, `orders.ts`, `payments.ts`, `operations.ts`, `admin.ts`, `delivery.ts`, `profile.ts`.

### TanStack Query

- Queries con query keys consistentes, e.g. `['orders', weekIdentifier]`, `['catalog', weekIdentifier]`
- Mutations con `onSuccess` que invalida las queries relacionadas + toast de resultado

### Zustand stores

- `store/auth.store.ts` → `{ user, role, isLoading, setUser, setRole, clearAuth }`
- `store/week.store.ts` → semana seleccionada globalmente en formato `YYYY-WNN`

## Flujo de subida de voucher

El archivo nunca pasa por el backend:

1. `POST /orders/:id/voucher-upload-url` → `{ uploadUrl, objectName }`
2. `fetch(uploadUrl, { method: 'PUT', body: file })` directo a Google Cloud Storage
3. `POST /orders/:id/confirm-voucher` con `{ objectName }` → orden pasa a `PENDING_PAYMENT`

## Estados de una orden

```
DRAFT → (checkout) → PENDING_PAYMENT → (confirm-payment) → CONFIRMED → (deliver) → DELIVERED
                                                                                      ↑
DRAFT | PENDING_PAYMENT | CONFIRMED → (cancel) → CANCELLED  ←──────────────────────────
```

- Solo `DRAFT` y `PENDING_PAYMENT` son editables por el usuario.
- La ventana de pedidos cierra los **viernes a las 12:00 PM hora de Lima (UTC−5)**. El backend responde con HTTP 422 (`order-window-closed`) fuera de ventana.

## Errores del backend

```json
{ "statusCode": 422, "code": "order-window-closed", "errorMessage": "..." }
```

Códigos relevantes para mostrar mensajes en la UI:

| Code | Mensaje sugerido |
|---|---|
| `order-window-closed` | La ventana de pedidos está cerrada |
| `order-capacity-exceeded` | Capacidad semanal alcanzada |
| `order-not-editable` | Este pedido no se puede modificar |
| `data-not-found` | Recurso no encontrado (404) |
| `unauthorized-access` | Sin permisos (403) |

## shadcn/ui

Los componentes están en `components/ui/` y son código propio. Para agregar uno nuevo:

```bash
npx shadcn@latest add <componente>
```

No modificar los archivos de `components/ui/` directamente. Crear wrappers en `components/[feature]/` si se necesita lógica adicional.

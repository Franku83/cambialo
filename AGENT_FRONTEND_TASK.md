# Tarea para agente — Frontend: KYC, Panel Vendedor, Auto-mod UI
> Proyecto: Cambialo — marketplace verificado de smartphones (Venezuela)
> Stack: Next.js 15 App Router + Tailwind CSS + Supabase JS client
> Monorepo: `/home/franku/projects/techmarket-vz`
> Frontend: `apps/web/src`

---

## Contexto importante antes de tocar código

- **Tema visual**: blanco/slate/verde `#16a34a`. Ver `apps/web/src/components/layout/Header.tsx` para el estilo.
- **Supabase client** (frontend): `import { createClient } from '@/lib/supabase/client'` (client components) o `@/lib/supabase/server` (server components).
- **API URL**: `const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'`
- **Auth guard manual**: En server components usar `supabase.auth.getUser()` y `redirect('/login')` si no hay sesión.
- **TypeScript strict**: El proyecto tiene `exactOptionalPropertyTypes: true`. Para props opcionales usar spread condicional: `{...(value && { prop: value })}`.
- **Prisma client tipado como `any`**: No importar tipos de `@prisma/client`. Usar tipos locales.
- **Supabase types no generados**: Castear queries a `unknown as Promise<{ data: T | null }>` o usar `(supabase as any).from(...)`.

---

## Lo que el otro agente (backend) ya implementó — NO tocar

El backend ya tiene estos endpoints listos cuando termines. Confía en que existen:

### KYC
- `POST /api/v1/kyc/submit` — multipart/form-data: `documentFront` (File), `selfie` (File), `whatsappNumber` (string). Requiere Bearer token. Responde `{ id, status: 'pending' }`.
- `GET /api/v1/kyc/status` — requiere Bearer token. Responde `{ status: 'none'|'pending'|'approved'|'rejected', rejectionReason?: string }`.
- `POST /api/v1/kyc/:id/approve` — solo admin.
- `POST /api/v1/kyc/:id/reject` — solo admin. Body: `{ reason: string }`.
- `GET /api/v1/kyc/pending` — solo admin. Lista de KYC pendientes.

### Listings — gestión del seller
- `PATCH /api/v1/listings/:id/status` — requiere Bearer token. Body: `{ status: 'active'|'paused'|'sold' }`. Solo el dueño puede cambiar.
- `DELETE /api/v1/listings/:id` — requiere Bearer token. Solo el dueño.
- `POST /api/v1/listings/:id/whatsapp-click` — sin auth. Incrementa contador.
- `GET /api/v1/listings/mine/stats` — requiere Bearer token. Responde array de listings del usuario con stats:

```typescript
// Respuesta de GET /api/v1/listings/mine/stats
type MyListingStats = {
  id: string
  brand: string
  modelName: string
  storageGb: number
  priceUsd: string
  status: 'draft' | 'active' | 'paused' | 'sold' | 'expired' | 'removed'
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'expired'
  viewsCount: number
  savesCount: number
  whatsappClicks: number
  coverPhotoUrl: string | null
  createdAt: string
}[]
```

### Auto-moderación (solo backend — no hay UI para el seller)
Ya ocurre automáticamente al crear un listing. Si hay flags, el listing queda en `pending_review` con notas internas. No necesita UI del seller.

---

## Tarea 1 — Flujo KYC (`/kyc`)

**Ruta:** `apps/web/src/app/(main)/kyc/page.tsx`
**Client component** (necesita upload de archivos)

### Flujo de pasos:

```
Paso 1: Foto del documento (cédula/pasaporte)
  - Input file: foto frontal
  - Preview de la imagen seleccionada
  - Instrucciones: "Asegúrate de que sea legible y sin brillo"

Paso 2: Selfie sosteniendo el documento
  - Input file: selfie
  - Preview
  - Instrucciones: "Sostén tu documento junto a tu cara"

Paso 3: Número WhatsApp
  - Input: número con prefijo +58
  - Botón "Continuar" (en esta versión no hay OTP real, solo guardar el número)

Paso 4: Enviado
  - "Tu solicitud está en revisión"
  - "Recibirás una notificación en menos de 4 horas"
  - Botón → /dashboard
```

### Comportamiento:
- Al llegar a la página, hacer `GET /api/v1/kyc/status` con el Bearer token del usuario.
  - Si `status === 'approved'` → mostrar "Ya estás verificado ✓" y botón al dashboard.
  - Si `status === 'pending'` → mostrar "Tu solicitud está en revisión ⏳".
  - Si `status === 'rejected'` → mostrar la razón + permitir reenviar.
  - Si `status === 'none'` → mostrar el flujo de pasos.
- Al completar paso 3, hacer `POST /api/v1/kyc/submit` con `FormData`:
  ```javascript
  const fd = new FormData()
  fd.append('documentFront', documentFile)
  fd.append('selfie', selfieFile)
  fd.append('whatsappNumber', phone)
  // Header: Authorization: Bearer <token>
  ```
- Para obtener el token: `const { data: { session } } = await supabase.auth.getSession()`

### Estilo de referencia (barra de progreso):
```
[●]──[●]──[○]──[○]
Doc  Selfie  WA  Listo
```
Usar círculos `bg-green-600` para completados, `bg-slate-200` para pendientes.

---

## Tarea 2 — Banner KYC en Dashboard

**Archivo:** `apps/web/src/app/(main)/dashboard/page.tsx`

El dashboard es un **server component**. Agregar fetch de KYC status y mostrar banner condicional.

### Dónde insertar el fetch (en el server component):
```typescript
// Después de obtener el profile, agregar:
const kycRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/kyc/status`, {
  headers: { Authorization: `Bearer ${session.access_token}` },
  cache: 'no-store',
}).catch(() => null)
const kycData = kycRes?.ok ? await kycRes.json() as { status: string } : null
const kycStatus = kycData?.status ?? 'none'
```

Para obtener `session.access_token` en server component:
```typescript
const { data: { session } } = await supabase.auth.getSession()
```

### Banner a mostrar (solo si `kycStatus === 'none'` o `kycStatus === 'rejected'`):

```
┌─────────────────────────────────────────────────────────────┐
│ 🔒  Verifica tu identidad y publica con más confianza        │
│     Badge verificado · Más visibilidad · Hasta 10 listings   │
│                                                              │
│     [ Verificar ahora — tarda 5 minutos ]                    │
└─────────────────────────────────────────────────────────────┘
```

Si `kycStatus === 'rejected'`, cambiar texto a:
```
❌ Tu verificación fue rechazada: [razón]
   [ Reintentar verificación ]
```

Si `kycStatus === 'pending'`:
```
⏳ Tu verificación está en revisión. Te notificaremos pronto.
```

**Colores del banner:**
- `none`: borde verde, fondo `bg-green-50`
- `pending`: borde amber, fondo `bg-amber-50`
- `rejected`: borde rojo, fondo `bg-red-50`

Botón → `/kyc`

---

## Tarea 3 — Panel de Vendedor en Dashboard

Reemplazar la sección "Quick actions" del dashboard con un panel de listings completo con stats y acciones.

**Archivo:** `apps/web/src/app/(main)/dashboard/page.tsx` y nuevo componente `apps/web/src/components/dashboard/MyListingsPanel.tsx`

### `MyListingsPanel` (client component):

Hacer fetch de `GET /api/v1/listings/mine/stats` con Bearer token.

```typescript
// Obtener token desde props (el server component lo pasa)
// O dentro del componente: const { data: { session } } = await supabase.auth.getSession()
```

### UI de cada listing:

```
┌──────────────────────────────────────────────────────────┐
│ [foto 60x60]  iPhone 14 Pro · 256GB · $620               │
│               🛡 Verificado · Activo                       │
│                                                           │
│  👁 45 views  💬 3 WA clicks  ❤ 2 guardados  📊 6.7%    │
│                                                           │
│  [Pausar] [Marcar vendido] [Eliminar]                     │
└──────────────────────────────────────────────────────────┘
```

- Si `status === 'paused'`: mostrar `[Reactivar]` en vez de `[Pausar]`
- Si `status === 'sold'` o `status === 'expired'`: solo `[Eliminar]`
- Tasa de conversión = `whatsappClicks / viewsCount * 100` (mostrar `—` si `viewsCount === 0`)

### Acciones (llamadas al API con Bearer token):

```typescript
// Pausar / Reactivar
PATCH /api/v1/listings/:id/status  { status: 'paused' | 'active' }

// Marcar vendido
PATCH /api/v1/listings/:id/status  { status: 'sold' }
// Pedir confirmación antes: "¿Confirmas que vendiste este equipo?"

// Eliminar
DELETE /api/v1/listings/:id
// Pedir confirmación: "¿Eliminar este listing? Esta acción no se puede deshacer."
```

Después de cada acción exitosa, hacer re-fetch del listado.

### Badge de verificación:
- `verificationStatus === 'verified'` → `🛡 Verificado` (text-green-600)
- `verificationStatus === 'pending'` → `⏳ En revisión` (text-amber-600)
- `verificationStatus === 'rejected'` → `❌ Rechazado` (text-red-600)

### Estado del listing badge:
- `active` → punto verde pulsante + "Activo"
- `paused` → punto gris + "Pausado"
- `sold` → "Vendido"
- `draft` → "Borrador"

---

## Tarea 4 — Tracking WhatsApp Click

**Archivo:** `apps/web/src/app/(main)/listings/[id]/page.tsx`

El botón de WhatsApp ya existe. Agregar llamada `POST /api/v1/listings/:id/whatsapp-click` al hacer click (fire-and-forget, sin esperar respuesta).

Buscar el botón que contiene "WhatsApp" o `wa.me` en el componente de detalle y agregar:

```typescript
onClick={() => {
  void fetch(`${API_URL}/api/v1/listings/${listing.id}/whatsapp-click`, { method: 'POST' })
  // luego abrir el link normal
}}
```

---

## Tarea 5 — Panel KYC en Admin

**Archivo:** `apps/web/src/app/(main)/admin/kyc/page.tsx`

Tabla de solicitudes KYC pendientes. Solo accesible para admin/owner (verificar rol con `user_roles`).

Fetch de `GET /api/v1/kyc/pending` con Bearer token.

Respuesta esperada:
```typescript
type KycRequest = {
  id: string
  userId: string
  username: string
  fullName: string
  documentFrontUrl: string  // URL firmada de Supabase Storage
  selfieUrl: string         // URL firmada de Supabase Storage
  whatsappNumber: string
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected'
}[]
```

### UI:
- Tabla con columnas: Usuario, WhatsApp, Fecha, Acciones
- Al hacer click en un row, expandir para mostrar las fotos
- Botones: `[✅ Aprobar]` → `POST /api/v1/kyc/:id/approve` | `[❌ Rechazar]` → modal con input de razón → `POST /api/v1/kyc/:id/reject { reason }`
- Agregar link "KYC" en el panel admin del dashboard y en el header dropdown de admin

---

## Notas finales

- No tocar nada en `apps/api/` — el backend está siendo manejado por otro agente.
- No tocar `packages/db/prisma/schema.prisma` — el schema ya está sincronizado.
- Hacer commit y push al terminar cada tarea grande (no todo al final).
- Rama: `main` — push directo.
- El repo es `github.com/Franku83/cambialo`.
- No commitear `.env.local` ni nada con keys.

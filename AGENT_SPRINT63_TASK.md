# Tarea para agente — Sprint 6.3 (tareas delegables)
> Proyecto: Cambialo — marketplace verificado de smartphones (Venezuela)
> Stack: Next.js 15 App Router + NestJS + Prisma + Supabase + Zustand
> Monorepo: `/home/franku/projects/techmarket-vz`
> Rama: `main` — push directo a GitHub (`github.com/Franku83/cambialo`)

---

## Contexto importante antes de tocar código

- **Tema visual**: blanco/slate/verde `#16a34a`. Ver `apps/web/src/components/layout/Header.tsx`.
- **Supabase client frontend**: `import { createClient } from '@/lib/supabase/client'`
- **API URL**: `const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'`
- **TypeScript strict**: `exactOptionalPropertyTypes: true` — usar spread condicional para props opcionales.
- **Prisma client tipado como `any`**: no importar tipos de `@prisma/client`, usar tipos locales.
- **Zustand store de publicación**: `apps/web/src/store/sell.store.ts`

## Lo que el otro agente ya hizo — NO tocar

- La extensión `earthdistance` ya está activa en Supabase (confirmado con `pg_extension`).
- El query del feed con filtro de distancia (`GET /listings?lat=&lng=&rangeKm=`) está siendo implementado por el otro agente directamente en `listings.service.ts` y `listing-filters.dto.ts`. **No tocar esos archivos.**
- El módulo KYC, auto-moderación y panel de vendedor ya existen y están pusheados.

---

## Tarea 1B — Capturar coordenadas del vendedor al publicar

### Store (`apps/web/src/store/sell.store.ts`)

Agregar `latitude` y `longitude` a `Step3Data` y al estado/actions:

```typescript
// Agregar a Step3Data:
latitude?: number
longitude?: number
```

El store ya tiene `updateStep3`. No necesitas nada más en el store.

### Wizard (`apps/web/src/app/(main)/sell/page.tsx`)

En el componente del Step 3 (precio/disponibilidad), agregar captura silenciosa de coordenadas al montar:

```typescript
// Al inicio del componente o en un useEffect de Step 3:
useEffect(() => {
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        useSellStore.getState().updateStep3({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
      },
      () => {} // silencioso si rechaza
    )
  }
}, [])
```

### DTO del API (`apps/api/src/modules/listings/dto/create-listing.dto.ts`)

Agregar campos opcionales al final:

```typescript
@ApiPropertyOptional()
@Type(() => Number)
@IsNumber()
@IsOptional()
latitude?: number

@ApiPropertyOptional()
@Type(() => Number)
@IsNumber()
@IsOptional()
longitude?: number
```

### Service (`apps/api/src/modules/listings/listings.service.ts`)

En el método `createDraft`, ya existe la sección de `data: { ... }`. Agregar al objeto de creación:

```typescript
...(dto.latitude !== undefined && { latitude: dto.latitude }),
...(dto.longitude !== undefined && { longitude: dto.longitude }),
```

### Payload del wizard al API

En `apps/web/src/app/(main)/sell/page.tsx`, en la llamada `POST /api/v1/listings` (método `handleStep1Next` o similar), agregar al body:

```typescript
const { step3 } = useSellStore.getState()
// En el body del fetch:
...(step3.latitude !== undefined && { latitude: step3.latitude }),
...(step3.longitude !== undefined && { longitude: step3.longitude }),
```

---

## Tarea 1D — Slider de rango en FilterSidebar

**Archivo:** `apps/web/src/components/listings/FilterSidebar.tsx`

1. Importar `useLocation` desde `@/hooks/useLocation` (ya existe).
2. Agregar estado `rangeKm` (default `40`).
3. Agregar sección de radio solo si `status === 'granted'`:

```tsx
const { status, latitude, longitude } = useLocation()
const [rangeKm, setRangeKm] = useState(40)

// En el JSX, antes del botón de aplicar filtros:
{status === 'granted' && (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-slate-700">
        📍 Radio de búsqueda
      </label>
      <span className="text-sm font-semibold text-green-600">
        {rangeKm >= 500 ? 'Todo el país' : `${rangeKm} km`}
      </span>
    </div>
    <input
      type="range"
      min={10}
      max={500}
      step={10}
      value={rangeKm}
      onChange={(e) => setRangeKm(Number(e.target.value))}
      className="w-full accent-green-600"
    />
    <div className="flex justify-between text-xs text-slate-400">
      <span>10 km</span>
      <span>40 km</span>
      <span>Todo el país</span>
    </div>
  </div>
)}
```

4. Al construir la URL del feed (buscar donde se hace el fetch o se pasan los params al padre), incluir:

```typescript
// Si hay coords activas:
if (status === 'granted' && latitude && longitude) {
  params.set('lat', String(latitude))
  params.set('lng', String(longitude))
  params.set('rangeKm', String(rangeKm))
}
```

Busca cómo el FilterSidebar expone los filtros al feed (puede ser via `onFiltersChange`, `router.push` con query params, o un callback). Adáptalo al patrón existente.

---

## Tarea 1E — Badge de distancia en ListingCard

**Archivo:** `apps/web/src/components/listings/ListingCard.tsx`

1. Agregar prop opcional `distanceKm?: number` a la interfaz del componente.
2. En la sección donde se muestra la ciudad (`listing.city`), reemplazar o complementar:

```tsx
{distanceKm !== undefined && distanceKm !== null ? (
  <span className="flex items-center gap-1 text-xs text-slate-500">
    <MapPin className="h-3 w-3" /> {distanceKm} km
  </span>
) : listing.city ? (
  <span className="flex items-center gap-1 text-xs text-slate-500">
    <MapPin className="h-3 w-3" /> {listing.city}
  </span>
) : null}
```

3. En el componente que renderiza las cards (feed/page.tsx o similar), si el listing viene del API con `distance_km` (número), pasarlo como prop.

---

## Tarea 2A/2B — Notificaciones in-app al aprobar/rechazar listing

**Archivo:** `apps/api/src/modules/admin/moderation.service.ts`

El archivo ya existe con `approveListing` y `rejectListing`. Ya llaman a `this.notifications.createNotification(...)`. Verifica que el payload sea correcto:

```typescript
// En approveListing — ya debe existir algo así, verificar que tenga:
await this.notifications.createNotification({
  userId: listing.sellerId,
  type: 'listing_verified',
  title: '¡Tu equipo fue verificado!',
  body: 'Tu listing ya es visible en el feed de Cambialo.',
  payload: { listingId },
})
```

```typescript
// En rejectListing — verificar que tenga:
await this.notifications.createNotification({
  userId: listing.sellerId,
  type: 'listing_rejected',
  title: 'Listing necesita corrección',
  body: reason ?? 'Tu listing fue rechazado. Revisa las fotos y vuelve a enviarlo.',
  payload: { listingId, reason },
})
```

**Nota:** El `NotificationsService.createNotification` ya existe (método en `apps/api/src/modules/notifications/notifications.service.ts`). Solo necesita `{ userId, type, title, body, payload }`. El campo en DB se llama `data` (no `payload`) — ver el método existente y adaptar.

Si ya están implementadas correctamente, no cambies nada.

---

## Tarea 3A — Constantes de límites KYC

**Archivo nuevo:** `apps/api/src/common/constants/user-levels.ts`

```typescript
export const LISTING_LIMITS = {
  unverified: 3,
  verified: 10,
  pro: 25,
}

export function getListingLimit(user: { idVerified: boolean; isVerifiedSeller: boolean }): number {
  if (user.isVerifiedSeller) return LISTING_LIMITS.pro
  if (user.idVerified) return LISTING_LIMITS.verified
  return LISTING_LIMITS.unverified
}
```

---

## Tarea 3B — Validación límite al crear listing

**Archivo:** `apps/api/src/modules/listings/listings.service.ts`

Al inicio del método `createDraft`, antes de `this.prisma.listing.create(...)`, agregar:

```typescript
import { getListingLimit } from '../../common/constants/user-levels'

// Al inicio de createDraft:
const seller = await this.prisma.user.findUnique({
  where: { id: userId },
  select: { idVerified: true, isVerifiedSeller: true },
})
if (!seller) throw new NotFoundException('Usuario no encontrado')

const activeCount = await this.prisma.listing.count({
  where: { sellerId: userId, status: { in: ['active', 'paused', 'draft'] } },
})

const limit = getListingLimit(seller)
if (activeCount >= limit) {
  throw new ForbiddenException({
    message: 'Límite de listings alcanzado',
    currentCount: activeCount,
    limit,
    isVerified: seller.idVerified,
    upgradeUrl: '/kyc',
  })
}
```

---

## Tarea 3C — UI: barra de progreso en MyListingsPanel + bloqueo en wizard

### MyListingsPanel (`apps/web/src/components/dashboard/MyListingsPanel.tsx`)

Agregar al inicio del componente (después de obtener los listings):

```tsx
// Calcular activos y límite
const activeCount = listings.filter(l => ['active', 'paused', 'draft'].includes(l.status)).length
// El límite viene implícito — si el usuario tiene listings verificados lo sabemos por kycStatus
// Por simplicidad, mostrar barra basada en los datos disponibles
```

Agregar barra de progreso visible encima de la lista de listings:

```tsx
<div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center gap-3">
  <div className="flex-1">
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs font-medium text-slate-600">
        {activeCount} listings activos
      </span>
    </div>
    <div className="h-1.5 w-full rounded-full bg-slate-200">
      <div
        className="h-1.5 rounded-full transition-all"
        style={{
          width: `${Math.min((activeCount / 3) * 100, 100)}%`,
          background: activeCount >= 3 ? '#dc2626' : '#16a34a',
        }}
      />
    </div>
  </div>
  <Link href="/kyc" className="shrink-0 text-xs font-semibold text-green-600 hover:text-green-700">
    Verificar →
  </Link>
</div>
```

### Wizard (`apps/web/src/app/(main)/sell/page.tsx`)

Al inicio del componente, hacer fetch del conteo de listings activos. Si el API devuelve 403 al intentar crear, interceptar y mostrar el mensaje de límite. En el handler de `handleStep1Next` (que ya existe y usa `useSellStore.getState()`):

```typescript
// Si la respuesta es 403:
if (res.status === 403) {
  const body = await res.json() as { message: string; upgradeUrl?: string }
  setDraftError(body.message + (body.upgradeUrl ? ' — Verifica tu identidad para publicar más.' : ''))
  return
}
```

El estado `draftError` ya existe en el wizard.

---

## Tarea 3D — Banner de contexto en /kyc si viene de límite

**Archivo:** `apps/web/src/app/(main)/kyc/page.tsx`

1. Importar `useSearchParams` de `next/navigation`.
2. Al inicio del componente:

```typescript
const searchParams = useSearchParams()
const reason = searchParams.get('reason')
```

3. Dentro del wizard (cuando `kycStatus === 'none'`), antes de los pasos, agregar:

```tsx
{reason === 'listing_limit' && (
  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
    <strong>Alcanzaste el límite de 3 listings.</strong>{' '}
    Verifica tu identidad para publicar hasta 10 y obtener el badge de vendedor verificado.
  </div>
)}
```

---

## Orden de ejecución sugerido

```
1. Tarea 3A — user-levels.ts (trivial, no tiene dependencias)
2. Tarea 3B — Validación en createDraft
3. Tarea 1B — Store + DTO + payload wizard
4. Tarea 2A/2B — Verificar/ajustar notificaciones en moderation.service.ts
5. Tarea 1D — FilterSidebar slider
6. Tarea 1E — Badge en ListingCard
7. Tarea 3C — Barra en MyListingsPanel + manejo 403 en wizard
8. Tarea 3D — Banner en /kyc
```

---

## Checklist de cierre

```
[ ] latitude/longitude se guardan al crear listing si el vendedor las aceptó
[ ] FilterSidebar tiene slider de rango visible solo si geoloc está activa
[ ] ListingCard muestra "X km" si el listing viene con distance_km del API
[ ] Seller sin KYC no puede crear el 4to listing (error 403 claro en wizard)
[ ] Dashboard muestra barra de progreso de listings activos
[ ] Wizard muestra error de límite si el API devuelve 403
[ ] /kyc muestra banner especial si viene de ?reason=listing_limit
[ ] Notificaciones in-app al aprobar/rechazar listing están correctas
[ ] Commit y push a main al terminar cada tarea (no todo al final)
[ ] No commitear .env.local ni ningún archivo con keys
```

---

## Notas finales

- **No tocar** `apps/api/src/modules/listings/listings.service.ts` en la parte de `getFeed` ni `buildWhereClause` — esa lógica la maneja el otro agente.
- **No tocar** el schema de Prisma — ya está sincronizado con producción.
- Si hay dudas sobre la estructura de un archivo, leerlo primero antes de editarlo.
- El repo es `github.com/Franku83/cambialo`. Push directo a `main`.

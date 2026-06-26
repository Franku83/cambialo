# Cambialo — Handoff para nuevo agente
> Generado: 22 Junio 2026  
> Propósito: contexto completo para retomar el proyecto sin conversación previa

---

## Qué es Cambialo

Marketplace verificado de smartphones de segunda mano en Venezuela. Los vendedores publican con foto de verificación física, los compradores ven precio de mercado en tiempo real, reputación permanente, y zonas seguras de intercambio. No maneja pagos — conecta gente.

**Dominio:** cambialo.app  
**GitHub:** github.com/Franku83/cambialo  
**Deploy:** Push a `main` → Vercel (frontend) + Railway (API) redesplegan solos. **Nunca hacer deploy manual desde CLI.**

---

## Stack

```
apps/
  web/          Next.js 15 App Router — Vercel
  api/          NestJS — Railway
packages/
  db/           Prisma + schema.prisma
  types/        tipos compartidos (@cambialo/types)
  utils/        utils compartidas (@cambialo/utils)
```

- **DB:** Supabase Postgres `yoanpzeigqtfvtotkbpe` (port 5432 bloqueado en Railway → siempre usar pooler `:6543`)
- **Auth:** Supabase Auth (JWT) — frontend usa `@supabase/ssr`, API valida con `SupabaseAuthGuard`
- **Queue:** BullMQ + Redis (Railway interno `redis.railway.internal`)
- **Imágenes:** Cloudinary — upload desde API, thumbnails desde frontend con URL helpers
- **Search:** Typesense (desactivado sin crash — env vars ausentes)
- **Analytics:** Posthog (`NEXT_PUBLIC_POSTHOG_KEY` en Vercel)
- **Errores:** Sentry (`SENTRY_DSN` en Railway, `NEXT_PUBLIC_SENTRY_DSN` en Vercel)

---

## Infraestructura activa

| Servicio | URL |
|---|---|
| Frontend | `cambialo-franku83s-projects.vercel.app` + `cambialo.app` |
| API | `api-production-eb07.up.railway.app` |
| Supabase | proyecto `yoanpzeigqtfvtotkbpe` |
| Redis | `redis.railway.internal` (interno Railway) |

---

## Roles de usuario

`user` → `moderator` → `admin` → `owner`

- **owner** (franku, alianexo, ubwnricardo): no asignable por UI, todos los permisos
- **admin/moderator**: 2FA obligatorio en login, redirige a `/setup-2fa` o `/verify-2fa`
- Bans en `BannedEmail` table — verificado en `AuthService.register` y en cada request autenticado

---

## Flujo de publicación (wizard)

```
Step 1: Seleccionar modelo + IMEI últimos 4 → crea DRAFT en DB con priceUsd=1 placeholder
Step 2: Condición + batería + accesorios
Step 3: Precio + ubicación (LocationPicker) → llama PATCH /listings/:id/details con precio real
Step 4: Fotos (mín. 1 con VERIFICATION_CODE_ENABLED=false)
Step 5: Preview → POST /verification/:id/submit → status=pending_review
```

**VERIFICATION_CODE_REQUIRED = false** en `verification.service.ts` — no requiere foto de código físico.  
**NEXT_PUBLIC_VERIFICATION_CODE_ENABLED=false** en Vercel — oculta el UI del código en el wizard.

---

## APIs clave

### Listings
```
GET    /api/v1/listings                    feed con filtros (lat/lng/rangeKm/state/brand/condition/...)
GET    /api/v1/listings/:id                detalle (viewer del JWT, no query param)
GET    /api/v1/listings/mine/stats         listings del vendedor con stats (auth)
GET    /api/v1/listings/mine/archived      listings archivados (sold/removed/expired) con cursor pagination (auth)
POST   /api/v1/listings                    crear draft (auth)
PATCH  /api/v1/listings/:id/details        actualizar datos del draft (auth)
PATCH  /api/v1/listings/:id/status         cambiar estado (auth)
PATCH  /api/v1/listings/:id/cover-photo    { photoId } (auth)
DELETE /api/v1/listings/:id/draft          hard delete solo de drafts (auth)
POST   /api/v1/listings/:id/mark-sold      { buyerUsername? } (auth)
POST   /api/v1/listings/:id/save|unsave    watchlist (auth)
```

### Auth / Settings
```
POST /api/v1/auth/register
POST /api/v1/auth/login                          acepta email o username en campo "identifier" — frontend DEBE llamar este endpoint (no signInWithPassword directo) y luego supabase.auth.setSession() con el accessToken/refreshToken devuelto
POST /api/v1/auth/settings/change-email|change-password
GET  /api/v1/auth/settings/payment-methods
PUT  /api/v1/auth/settings/payment-methods   { zelle: { enabled, handle }, usdt: {...}, ... }
```

### Users
```
GET  /api/v1/users/:username              perfil público (incluye paymentMethods)
GET  /api/v1/users/me/payment-methods
PUT  /api/v1/users/me/payment-methods
```

### Verificación
```
POST /api/v1/verification/:id/generate-code
POST /api/v1/verification/:id/submit       → status=pending_review
POST /api/v1/verification/:id/approve      (mod)
POST /api/v1/verification/:id/reject       (mod)
```

### Moderación
```
GET  /api/v1/moderation/queue              solo listings en status=pending_review
POST /api/v1/moderation/:id/approve|reject
```

### Misc
```
GET  /api/v1/price-index/context?deviceModelId=&storageGb=
GET  /api/v1/device-models?brand=Apple|Samsung
GET  /api/v1/safe-zones?city=
```

---

## Filtros del feed (query params)

```
brand=Apple|Samsung
condition=mint|good|fair|poor  (array)
storage=128|256  (array)
minPrice / maxPrice
minBattery=0-100
verified=1
offers=1
box=1
charger=1
acceptsTradeIn=1
noRepairs=1                   solo equipos sin reparaciones
state=DC|MR|...  (código estado venezolano — ver lib/venezuela-states.ts)
lat=10.48&lng=-66.9&rangeKm=40
paymentMethod=zelle|usdt|pago_movil|cash|bs
cursor=<id>
limit=20
```

---

## Modelo de datos crítico (Prisma)

```prisma
User:     id, username, email, fullName, avatarUrl, idVerified, isVerifiedSeller,
          reputationScore, totalSales, role, isBanned, isSuspended,
          locationCity, locationState, whatsappNumber, whatsappPublic,
          paymentMethods Json?  -- { zelle: { enabled, handle }, usdt: {...}, ... }

Listing:  id, sellerId, deviceModelId, status (draft|pending_review|active|paused|sold|expired|removed),
          verificationStatus (pending|verified|rejected), priceUsd, storageGb,
          batteryHealth, condition (mint|good|fair|poor), imeiLast4,
          city, state, latitude, longitude, acceptsOffers, minOfferUsd,
          includesBox, includesCharger, includesEarphones, acceptsTradeIn,
          hasRepairs Boolean, repairDetails String? (JSON serializado),
          isCover (en ListingPhoto), isBumped, viewsCount, savesCount, whatsappClicks

ListingPhoto: id, listingId, cloudinaryId, cloudinaryUrl, isCover, isVerificationPhoto, sortOrder
```

---

## Archivos clave por funcionalidad

| Área | Archivo |
|---|---|
| Feed + filtros (API) | `apps/api/src/modules/listings/listings.service.ts` |
| Filtros DTO | `apps/api/src/modules/listings/dto/listing-filters.dto.ts` |
| CreateListing DTO | `apps/api/src/modules/listings/dto/create-listing.dto.ts` |
| Listings controller | `apps/api/src/modules/listings/listings.controller.ts` |
| Wizard publicación | `apps/web/src/app/(main)/sell/page.tsx` |
| Store wizard | `apps/web/src/store/sell.store.ts` |
| LocationPicker (mapa) | `apps/web/src/components/listings/LocationPicker.tsx` |
| FilterSidebar | `apps/web/src/components/listings/FilterSidebar.tsx` |
| ListingCard | `apps/web/src/components/listings/ListingCard.tsx` |
| Listing detail | `apps/web/src/app/(main)/listings/[id]/page.tsx` |
| Dashboard panel | `apps/web/src/components/dashboard/MyListingsPanel.tsx` |
| Archived panel | `apps/web/src/components/dashboard/ArchivedListingsPanel.tsx` |
| Header | `apps/web/src/components/layout/Header.tsx` |
| Footer (shared) | `apps/web/src/components/layout/Footer.tsx` |
| Auth service | `apps/api/src/modules/auth/auth.service.ts` |
| Login DTO | `apps/api/src/modules/auth/dto/login.dto.ts` |
| Verificación | `apps/api/src/modules/verification/verification.service.ts` |
| Moderación | `apps/api/src/modules/admin/moderation.service.ts` |
| Estados VZ (API) | `apps/api/src/common/constants/venezuela-states.ts` |
| Estados VZ (web) | `apps/web/src/lib/venezuela-states.ts` |
| GPS hook | `apps/web/src/hooks/useLocation.ts` |
| Config flags | `apps/web/src/lib/config.ts` |
| Supabase client | `apps/web/src/lib/supabase/client.ts` (browser) / `server.ts` (server) |

---

## Flags y constantes importantes

```typescript
// apps/api/src/modules/verification/verification.service.ts
const VERIFICATION_CODE_REQUIRED = false  // true = exige foto con código físico

// apps/web/src/lib/config.ts
export const VERIFICATION_CODE_ENABLED =
  process.env.NEXT_PUBLIC_VERIFICATION_CODE_ENABLED === 'true'
// → false en Vercel = oculta step de código en wizard
```

---

## Estado actual del producto (22 Junio 2026)

### Infraestructura / DevOps
- ✅ GitHub Actions keep-alive para Supabase (`.github/workflows/supabase-keepalive.yml`) — ping diario a las 6 AM UTC. **Pendiente:** agregar secret `SUPABASE_ANON_KEY` en GitHub repo settings y correrlo manualmente una vez para verificar.

### Lo que funciona en producción
- ✅ Registro / Login (email+password, username+password, Google OAuth, magic link)
- ✅ 2FA TOTP para admin/mod/owner
- ✅ KYC (upload cédula+selfie, revisión admin, límites de listing por nivel)
- ✅ Wizard publicación 5 pasos con fotos Cloudinary
- ✅ Reparaciones estructuradas en wizard (checklist 9 items + "Otro")
- ✅ Feed infinito con cursor pagination + 12+ filtros (incluye noRepairs)
- ✅ Mapa Leaflet en filtros (dropdown estados VZ + radio km)
- ✅ Detalle listing con galería, precio mercado, WhatsApp CTA, reparaciones
- ✅ Métodos de pago por vendedor (Zelle, USDT, Pago Móvil, Efectivo, Bs)
- ✅ Reviews + reputación permanente
- ✅ Panel admin: users, moderación, KYC
- ✅ Cola de moderación (`status=pending_review` sin drafts)
- ✅ Dashboard con 3 tabs: Activos / Borradores / Archivados
- ✅ Notificaciones in-app (Supabase Realtime) + push VAPID
- ✅ Alertas de búsqueda
- ✅ SEO: sitemap dinámico, robots.txt, JSON-LD, OG images
- ✅ PWA: manifest + service worker
- ✅ Páginas: /privacy, /terms, /about, /faq, /roadmap
- ✅ Footer compartido en todas las páginas

### Zonas seguras
- Página `/safe-zones` existe pero **está desactivada del footer y la navegación principal**. El link en listing detail puede seguir existiendo. No borrar — solo está oculta por ahora.

### Pendientes conocidos
- `NEXT_PUBLIC_VERIFICATION_CODE_ENABLED=false` debe estar en Vercel env vars
- Secret `SUPABASE_ANON_KEY` debe agregarse en GitHub → Settings → Secrets and variables → Actions (para el keep-alive workflow)
- VAPID keys para push notifications
- Typesense (search avanzado) — desactivado sin crash, puede activarse cuando haya budget
- k6 load testing
- Magic link por dispositivo nuevo (`TrustedDevice` model)
- Paginación cursor en archivados (implementada, pendiente UI "cargar más")
- `LISTING_LIMITS_UI`: activar en `MyListingsPanel` cuando se decida implementar

---

## Reglas de seguridad / restricciones

1. **Nunca** commitear `.env.local`, `SUPABASE_SERVICE_ROLE_KEY`, DB password ni API keys
2. **No** usar `git push --force` a `main`
3. **No** hacer deploy manual desde CLI de Railway o Vercel — GitHub integration lo hace sola
4. **No** usar `--no-verify` en commits
5. Schema changes → aplicar via Supabase MCP (`apply_migration`) porque port 5432 está bloqueado en Railway

### Estado de RLS / Security Advisors (revisado 22 Junio 2026)

- Todas las tablas públicas tienen RLS activo. `whatsapp_clicks` no lo tenía — corregido (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, sin policies porque solo se accede via Prisma/`postgres` role que tiene `BYPASSRLS`).
- Pendientes de bajo riesgo, NO críticos para el launch (revisados y confirmados no explotables con la config actual de permisos — `anon`/`authenticated` no tienen `CREATE` en `public`):
  - Vista `public_profiles` con `SECURITY DEFINER` — intencional, solo expone campos públicos no sensibles.
  - Funciones `is_mod_or_above()` / `handle_new_auth_user()` con `search_path` mutable y ejecutables por `anon`/`authenticated` via RPC — sin objetos privilegiados expuestos, vector de ataque cerrado por permisos de schema.
  - Extensiones `cube`/`earthdistance` instaladas en `public` — usadas por el filtro geo (`rangeKm`), mover de schema requiere testing, no es vulnerabilidad real.
  - "Leaked password protection" desactivado en Supabase Auth — toggle de dashboard, pendiente de activar cuando haya tiempo (no bloqueante).

---

## Convenciones del proyecto

- **Tailwind utilities** para todo — no clases CSS custom en globals.css. Si una combinación es muy verbose, documentar como deuda técnica.
- **No `any`** en TypeScript si se puede evitar
- **Commits:** `feat|fix|docs|refactor(scope): mensaje` + `Co-Authored-By: Claude Sonnet 4.6`
- **Grafo de conocimiento:** `graphify-out/graph.json` existe. Después de cada sprint correr `graphify update .`
- **PROGRESS.md** y **HANDOFF.md** se actualizan al final de cada sprint
- **repairDetails** se almacena como `String?` (JSON serializado) en la DB, no como `Json?` — hacer `JSON.parse()` en frontend, `JSON.stringify()` al guardar

---

## Cómo retomar trabajo

1. Leer este archivo + `PROGRESS.md` para contexto
2. Ver últimos commits: `git log --oneline -10`
3. Para entender arquitectura de un módulo: `graphify query "<pregunta>"`
4. Para entender relaciones entre archivos: `graphify path "A" "B"`
5. El API corre en Railway, el frontend en Vercel — no hay setup local necesario para deployar

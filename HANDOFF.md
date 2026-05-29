# Cambialo — Handoff para nuevo agente
> Generado: 29 Mayo 2026  
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
POST /api/v1/auth/login
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

Listing:  id, sellerId, deviceModelId, status (draft|pending_review|active|paused|sold|removed),
          verificationStatus (pending|verified|rejected), priceUsd, storageGb,
          batteryHealth, condition (mint|good|fair|poor), imeiLast4,
          city, state, latitude, longitude, acceptsOffers, minOfferUsd,
          includesBox, includesCharger, includesEarphones, acceptsTradeIn,
          isCover (en ListingPhoto), isBumped, viewsCount, savesCount, whatsappClicks

ListingPhoto: id, listingId, cloudinaryId, cloudinaryUrl, isCover, isVerificationPhoto, sortOrder
```

---

## Archivos clave por funcionalidad

| Área | Archivo |
|---|---|
| Feed + filtros (API) | `apps/api/src/modules/listings/listings.service.ts` |
| Filtros DTO | `apps/api/src/modules/listings/dto/listing-filters.dto.ts` |
| Wizard publicación | `apps/web/src/app/(main)/sell/page.tsx` |
| Store wizard | `apps/web/src/store/sell.store.ts` |
| LocationPicker (mapa) | `apps/web/src/components/listings/LocationPicker.tsx` |
| FilterSidebar | `apps/web/src/components/listings/FilterSidebar.tsx` |
| ListingCard | `apps/web/src/components/listings/ListingCard.tsx` |
| Header | `apps/web/src/components/layout/Header.tsx` |
| Footer (shared) | `apps/web/src/components/layout/Footer.tsx` |
| Auth service | `apps/api/src/modules/auth/auth.service.ts` |
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

## Estado actual del producto (29 Mayo 2026)

### Lo que funciona en producción
- ✅ Registro / Login (email+password, Google OAuth, magic link)
- ✅ 2FA TOTP para admin/mod/owner
- ✅ KYC (upload cédula+selfie, revisión admin, límites de listing por nivel)
- ✅ Wizard publicación 5 pasos con fotos Cloudinary
- ✅ Feed infinito con cursor pagination + 10+ filtros
- ✅ Mapa Leaflet en filtros (dropdown estados VZ + radio km)
- ✅ Detalle listing con galería, precio mercado, WhatsApp CTA
- ✅ Métodos de pago por vendedor (Zelle, USDT, Pago Móvil, Efectivo, Bs)
- ✅ Reviews + reputación permanente
- ✅ Panel admin: users, moderación, KYC
- ✅ Cola de moderación (`status=pending_review` sin drafts)
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
- VAPID keys para push notifications
- Typesense (search avanzado) — desactivado sin crash, puede activarse cuando haya budget
- k6 load testing
- Magic link por dispositivo nuevo (`TrustedDevice` model)

---

## Reglas de seguridad / restricciones

1. **Nunca** commitear `.env.local`, `SUPABASE_SERVICE_ROLE_KEY`, DB password ni API keys
2. **No** usar `git push --force` a `main`
3. **No** hacer deploy manual desde CLI de Railway o Vercel — GitHub integration lo hace sola
4. **No** usar `--no-verify` en commits
5. Schema changes → aplicar via Supabase MCP (`apply_migration`) porque port 5432 está bloqueado en Railway

---

## Convenciones del proyecto

- **Tailwind utilities** para todo — no clases CSS custom en globals.css (Agy introdujo algunas, considerarlas deuda técnica)
- **No `any`** en TypeScript si se puede evitar
- **Commits:** `feat|fix|docs|refactor(scope): mensaje` + `Co-Authored-By: Claude Sonnet 4.6`
- **Grafo de conocimiento:** `graphify-out/graph.json` existe. Después de cada sprint correr `graphify update .`
- **PROGRESS.md** y **HANDOFF.md** se actualizan al final de cada sprint

---

## Cómo retomar trabajo

1. Leer este archivo + `PROGRESS.md` para contexto
2. Ver últimos commits: `git log --oneline -10`
3. Para entender arquitectura de un módulo: `graphify query "<pregunta>"`
4. Para entender relaciones entre archivos: `graphify path "A" "B"`
5. El API corre en Railway, el frontend en Vercel — no hay setup local necesario para deployar

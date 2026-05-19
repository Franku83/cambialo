# Cambialo — Estado del Proyecto
> Última actualización: 19 Mayo 2026

---

## Resumen Ejecutivo

**Cambialo** es un marketplace verificado de smartphones para Venezuela. Los compradores y vendedores se conectan con confianza gracias a verificación de IMEI, identidad KYC, reseñas y zonas seguras de intercambio.

**Stack:** Next.js 15 (App Router) + NestJS + Prisma + Supabase + BullMQ + Redis

---

## Infraestructura Activa (Producción)

| Servicio | URL | Estado |
|---|---|---|
| Frontend | `cambialo-franku83s-projects.vercel.app` | ✅ Live |
| API | `api-production-eb07.up.railway.app` | ✅ Live |
| Base de datos | Supabase `yoanpzeigqtfvtotkbpe` | ✅ Conectada |
| Redis | `redis.railway.internal` (Railway interno) | ✅ Activo |
| GitHub | `github.com/Franku83/cambialo` | ✅ Público |

**Deploy automático:** Push a `main` → Vercel + Railway redesplegan solos.

---

## Estado de Sprints

| Sprint | Estado | Qué se hizo |
|--------|--------|-------------|
| Sprint 0 | ✅ | Monorepo Turborepo, schema Prisma (14 tablas), NestJS base, seed de datos |
| Sprint 1 | ✅ | Auth completa: login, registro, magic-link, perfiles, KYC de identidad |
| Sprint 2 | ✅ | Feed infinito con cursor pagination, búsqueda Typesense, ListingCard, detalle, OG images |
| Sprint 3 | ✅ | Wizard publicación 5 pasos, código verificación física, upload fotos Cloudinary |
| Sprint 4 | ✅ | Reviews, reputationScore, zonas seguras, ReportButton, ReputationBadge |
| Sprint 5 | ✅ | PWA, push notifications VAPID, alertas de búsqueda, Lighthouse >90 |
| **Sprint 6** | ✅ | UI redesign Swappa-like + Sprint QA Features — ver detalle abajo |
| Sprint 7 | ⏳ | Beta launch: 50 usuarios, Sentry, Posthog, k6 load testing |

---

## Sprint 6 — Completado (19 Mayo 2026)

### UI Redesign (Swappa-like)
- ✅ Tema claro completo — fondo blanco, verde `#16a34a`, slate para texto/bordes
- ✅ Header nuevo — logo, búsqueda con quicksearch, nav Apple/Samsung, avatar con dropdown
- ✅ Login y Register en tema claro
- ✅ Dashboard y wizard de publicación en tema claro
- ✅ `ListingCard` con modo lista/grid, `BatteryBar`, badge verificado con pulse CSS
- ✅ `FilterSidebar` con FAB móvil + bottom sheet Framer Motion
- ✅ `ViewToggle`, `EmptyStates`, `TrustSignals` en home
- ✅ WhatsApp CTA button en listing detail
- ✅ Cloudinary helpers para thumbnails uniformes (`c_fill,g_center,w_192,h_192`)

### Sprint QA Features

**Catálogo de dispositivos:**
- ✅ Seed completo: Apple iPhone 7 → 17 Pro Max (39 modelos) + Samsung S7 → S26 Ultra + Serie A + Foldables (44 modelos) = **83 modelos totales**
- ✅ Motorola, Xiaomi, Huawei, LG removidos de toda la UI y desactivados en DB
- ✅ Endpoint `GET /api/v1/device-models?search=&brand=&limit=`

**Rutas por marca:**
- ✅ `/apple` y `/samsung` — catálogos agrupados por año/serie
- ✅ `/apple/[model-slug]` y `/samsung/[model-slug]` — listings del modelo con filtros rápidos
- ✅ Header: Apple y Samsung linkan directo a sus páginas (tab activo en esas rutas)
- ✅ `lib/slug.ts` — `modelToSlug()` / `slugToWords()`

**Roles complejos:**
- ✅ Enum `UserRole`: `user | moderator | admin | owner`
- ✅ Panel `/admin/users` — toggle de roles por usuario (click para dar/quitar)
- ✅ Panel `/admin/moderation` — cola de listings pendientes, vista split, aprobar/rechazar
- ✅ `AdminService` + endpoints `GET /admin/users`, `POST/DELETE /admin/users/:id/roles/:role`
- ✅ `ModerationQueueController` — `GET /moderation/queue`, `POST /moderation/:id/approve|reject`
- ✅ `ModerationService.approveListing` + `rejectListing` + notificaciones push al vendedor

**Price Index:**
- ✅ Modelo `PriceIndex` en schema (avg/median/min/max/sampleSize por modelo+storage)
- ✅ `PriceIndexService` — calcula con listings verificados de los últimos 90 días, mínimo 3 muestras
- ✅ Cron `@Cron(EVERY_6_HOURS)` automático
- ✅ `GET /api/v1/price-index?deviceModelId=&storageGb=`
- ✅ Componente `PriceIndicator` en listing detail — Buen precio / Precio justo / Sobre el precio

**Trade-in:**
- ✅ Campo `acceptsTradeIn Boolean` en Listing
- ✅ Toggle en Step3 del wizard de publicación
- ✅ Componente `TradeInSimulator` — calcula valor estimado con multiplicadores condición+batería, genera mensaje WhatsApp

**Username validator:**
- ✅ `UsernameValidatorService` — regex + blacklist con normalización anti-leet speak
- ✅ Integrado en `AuthService.register()`

**Geolocalización:**
- ✅ Hook `useLocation` — `navigator.geolocation` + `sessionStorage`
- ✅ `LocationBanner` en home — prompt no bloqueante, descartable

**Fix wizard de publicación:**
- ✅ Bug crítico: `handleStep1Next` usaba closure stale → ahora usa `useSellStore.getState()`
- ✅ Auto-selecciona primer `storageGb` disponible al elegir modelo
- ✅ Error visible si falla la creación del draft

**Fix autenticación:**
- ✅ `register/page.tsx` llama `POST /api/v1/auth/register` (no `supabase.auth.signUp()`)
- ✅ `AuthService` usa `email_confirm: true` — login inmediato, sin emails de Supabase
- ✅ Trigger `on_auth_user_created` en Supabase — futuros usuarios por OAuth/magic-link crean fila en `public.users`

**Usuarios y roles (DB via Supabase MCP):**
- ✅ 3 usuarios reales creados en `public.users` (franku, ubwnricardo, riazfe)
- ✅ Rol `owner` asignado a franku, `user` a los demás
- ✅ `NotificationType` extendido: + `listing_verified`, `listing_rejected`
- ✅ Columnas nuevas en `users`: `bio`, `instagram`, `twitter`, `tiktok`, `website`, `whatsapp_public`

**Perfil público y edición:**
- ✅ `/profile/[username]` — banner verde, avatar, bio, redes clicables, badge Owner/Admin, listings, reseñas, stats
- ✅ Botón "Editar perfil" visible solo al dueño
- ✅ `/profile/edit` — nombre, bio, ciudad/estado (dropdown VE), WhatsApp + toggle público, Instagram, Twitter, TikTok, sitio web
- ✅ Dashboard muestra `@username` + badge Owner/Admin + sección admin para admin/owner

**Schema Prisma (cambios Sprint 6):**
- `UserRole` enum: + `owner`
- `NotificationType` enum: + `listing_verified`, `listing_rejected`
- `Listing`: + `acceptsTradeIn`, `whatsappClicks`, `latitude`, `longitude`
- Modelo `PriceIndex` nuevo
- `User`: + `bio`, `instagram`, `twitter`, `tiktok`, `website`, `whatsappPublic`
- Seed actualizado a upsert (insert + update existentes)

---

## Pendientes para próxima sesión

### Requiere comandos manuales en producción
```bash
cd packages/db && npx prisma db push   # aplica PriceIndex + nuevos campos Listing
cd packages/db && npx prisma db seed   # carga 83 modelos Apple+Samsung
```
Las columnas de `users` (bio, instagram, etc.) ya están en Supabase (aplicadas via MCP).
Las tablas `PriceIndex` y campos nuevos de `Listing` aún necesitan `db push`.

### Variables de entorno pendientes (Railway / Vercel)
- `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` — push notifications
- `CLOUDINARY_CLOUD_NAME` / `API_KEY` / `API_SECRET` — upload de fotos
- `TYPESENSE_*` — search (desactivado sin crash por ahora)

### Pendientes de producto (Sprint 7)
- KYC: límite de 3 listings para vendedores sin verificar + banner de incentivo en dashboard
- `whatsappClicks`: trackear clicks en el botón de WhatsApp del listing
- RLS policies en Supabase (urgente antes de beta pública)
- Sentry + Posthog
- Dominio custom (`cambialo.app`)
- Landing page pública

---

## Decisiones técnicas importantes

| Decisión | Por qué |
|---|---|
| Prisma para el API, Supabase JS para el frontend | Port 5432 bloqueado en Railway, HTTPS siempre disponible |
| Cursor pagination con tie-breaker `{id: 'desc'}` | Evita duplicados en el feed con múltiples criterios de orden |
| `useSellStore.getState()` en handleStep1Next | Evita closure stale de React — zustand actualiza sync pero el componente no re-renderiza antes del callback |
| Registro via API (no `supabase.auth.signUp`) | `signUp` directo manda email de verificación y no crea fila en `public.users` |
| Trigger `on_auth_user_created` en Supabase | Respaldo para usuarios que lleguen por OAuth o magic link |
| `email_confirm: true` en admin.createUser | Login inmediato sin email — experiencia más fluida |
| Supabase pooler `aws-1-us-east-2:6543` | Direct connection port 5432 bloqueado en Railway |
| `binaryTargets = linux-musl-openssl-3.0.x` | Alpine Linux usa OpenSSL 3, requerido por Prisma 5 |

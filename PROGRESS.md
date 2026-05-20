# Cambialo — Estado del Proyecto
> Última actualización: 20 Mayo 2026

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
| **Sprint 6** | ✅ | UI redesign Swappa-like + Sprint QA Features |
| **Sprint 6.1** | ✅ | Google OAuth + DB sync producción |
| **Sprint 6.2** | ✅ | KYC completo + auto-moderación + panel vendedor |
| **Sprint 6.3** | ✅ | Geolocalización + límite listings KYC + notificaciones moderación |
| **Sprint 6.4** | ✅ | 2FA + admin avanzado + homepage + páginas info + seguridad + panel usuario admin + MarkSoldModal + PriceIndicator |
| **Sprint 6.5** | ✅ | Listings permanentes — lifecycle completo, sin hard delete |
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
- ✅ Cloudinary helpers para thumbnails uniformes

### Sprint QA Features
- ✅ Seed 83 modelos Apple+Samsung / Motorola+Xiaomi removidos
- ✅ Rutas `/apple`, `/samsung`, `/apple/[slug]`, `/samsung/[slug]`
- ✅ Roles `user|moderator|admin|owner` + panel admin users + moderación
- ✅ `PriceIndex` model + cron 6h + `PriceIndicator` en listing detail
- ✅ Trade-in: `acceptsTradeIn` + `TradeInSimulator`
- ✅ `UsernameValidatorService` — regex + blacklist anti-leet speak
- ✅ `useLocation` hook + `LocationBanner` en home

---

## Sprint 6.1 — Completado (20 Mayo 2026)

- ✅ Google OAuth en login + registro
- ✅ `/register/complete` para usuarios Google sin username (detección en callback)
- ✅ `GET /auth/check-username` — disponibilidad en tiempo real
- ✅ `prisma db push` + `prisma db seed` aplicados en producción (101 modelos)
- ✅ Username `riazfe` → `alianexo` en DB

---

## Sprint 6.2 — Completado (20 Mayo 2026)

**KYC:**
- ✅ `KycStatus` enum + `KycSubmission` model + bucket privado `kyc-documents` en Supabase Storage
- ✅ Endpoints: submit (multer), status, pending (admin), approve, reject
- ✅ Al aprobar: `idVerified = true`, `isVerifiedSeller = true`
- ✅ `/kyc` wizard 4 pasos + `/admin/kyc` cola con fotos firmadas
- ✅ Banner KYC en dashboard según estado

**Auto-moderación:**
- ✅ `AutoModerationService` — IMEI duplicado, precio < 40% avg, palabras prohibidas (fire-and-forget al crear listing)

**Panel vendedor:**
- ✅ `GET /listings/mine/stats`, `PATCH /listings/:id/status`, `DELETE /listings/:id`
- ✅ `POST /listings/:id/whatsapp-click` — tracking WA
- ✅ `MyListingsPanel` — stats + acciones + barra de progreso KYC
- ✅ `WhatsAppButton` con tracking automático

---

## Sprint 6.3 — Completado (20 Mayo 2026)

**Geolocalización:**
- ✅ Extensiones `cube` + `earthdistance` activas en Supabase
- ✅ `ListingFiltersDto` + `lat`, `lng`, `rangeKm`
- ✅ `getFeedByDistance()` — raw SQL earthdistance; listings sin coords van al final
- ✅ Coords capturadas silenciosamente en Step3 del wizard
- ✅ Slider de rango en `FilterSidebar` (visible solo si geoloc activa)
- ✅ Badge `distanceKm` en `ListingCard`

**Límite de listings por KYC:**
- ✅ `user-levels.ts` — `LISTING_LIMITS` (unverified=3, verified=10, pro=25)
- ✅ Validación en `createDraft` → 403 con `upgradeUrl: '/kyc'`
- ✅ Barra de progreso en `MyListingsPanel`
- ✅ Manejo del 403 en wizard + banner en `/kyc?reason=listing_limit`

**Notificaciones moderación:**
- ✅ `ModerationService` notifica in-app al aprobar y rechazar listing

---

## Sprint 6.4 — Completado (20 Mayo 2026)

**2FA (TOTP para admin/moderator/owner):**
- ✅ Middleware detecta rol crítico → redirige a `/setup-2fa` o `/verify-2fa`
- ✅ `/setup-2fa` — enroll TOTP con QR, verificación con código 6 dígitos
- ✅ `/verify-2fa` — challenge + verify, 3 intentos → logout forzado
- ✅ Rutas `/sell`, `/dashboard`, `/admin`, `/kyc` protegidas por auth

**Admin avanzado (C2):**
- ✅ `AdminService` — suspend/unsuspend/ban/unban con razón
- ✅ Ban agrega email a `BannedEmail` + desactiva todos sus listings
- ✅ `AuthService.register` verifica `BannedEmail` antes de crear cuenta
- ✅ Suspensión expirada se levanta automáticamente en el guard
- ✅ `SupabaseAuthGuard` verifica ban/suspensión en cada request autenticado
- ✅ Endpoints: `POST /admin/users/:id/suspend|unsuspend|ban|unban`
- ✅ `listUsers` con búsqueda por nombre/email/username + filtro por status

**Owner-only:**
- ✅ `GET /admin/owner/metrics` — totales de usuarios, listings, ventas
- ✅ `GET /admin/owner/audit-log` — historial de acciones de admins/mods
- ✅ `GET/PUT /admin/owner/config` — configuración global de la plataforma
- ✅ `AuditLog` model — se registra automáticamente en cada acción admin
- ✅ `PlatformConfig` seed: bump price, límites de listings, días de expiración
- ✅ Rol `owner` no se puede asignar por UI (error 403)

**Review popup al marcar vendido (C3):**
- ✅ `POST /listings/:id/mark-sold` — crea `PendingReview` para seller y buyer
- ✅ `PendingReview` model en schema (expira en 14 días)
- ✅ `MarkSoldModal` — modal 3 pasos: confirmar venta → buscar comprador por username → confirmar
- ✅ `GET /users/search?q=` — búsqueda de usuarios para el modal

**Price context en wizard (C8):**
- ✅ `PriceIndexService.getContext()` — comparables + avg + sampleSize
- ✅ `GET /api/v1/price-index/context?deviceModelId=&storageGb=`
- ✅ Widget price context en Step3 del wizard — tabla comparables + promedio + indicador coloreado
- ✅ `PriceIndicator` en `ListingCard` — tag 🟢/🟡/🔴 debajo del precio (batch-query, sin N+1)

**api-client (C9):**
- ✅ `lib/api-client.ts` — wrapper con timeout 10s, errores tipados (`NO_CONNECTION`, `API_DOWN`, `TIMEOUT`, `HTTP_xxx`)
- ✅ `buildListingsQuery()` — sanitiza params (sin NaN, sin undefined)

**Schema (db push aplicado):**
- `User`: + `isSuspended`, `suspendedUntil`, `suspendReason`
- Nuevos modelos: `BannedEmail`, `PendingReview`, `AuditLog`, `PlatformConfig`

**Homepage y páginas estáticas (Agy):**
- ✅ `(main)/page.tsx` → landing homepage: hero, trust signals, cómo funciona, listings recientes, CTA vendedor
- ✅ `/explore` → feed completo con filtros (antes era la home)
- ✅ `/faq` — acordeón con preguntas frecuentes
- ✅ `/roadmap` — timeline de estados sin fechas
- ✅ `/about` — quiénes somos

**Fixes UI (Agy):**
- ✅ Header: `min-w-0` en contenedor de búsqueda (bug de crecimiento)
- ✅ FilterSidebar: switches controlados (verifiedOnly, acceptsOffers, includesBox)
- ✅ Login + Register: botón ojo para mostrar/ocultar contraseña
- ✅ Panel moderación: contraste de texto corregido + responsive en móvil
- ✅ Feed: `pb-24 lg:pb-0` para que el FAB no tape listings
- ✅ Register: trust blurb antes del botón de submit
- ✅ `ErrorStates.tsx` — `ApiDownBanner`, `ConnectionError`, `ApiError`, `TimeoutError`

---

## Sprint 6.5 — Completado (20 Mayo 2026)

**Listings permanentes:**
- ✅ Schema: `pending_review` agregado al enum `ListingStatus` + campo `soldAt DateTime?`
- ✅ DELETE endpoint eliminado — ningún listing se borra de la DB jamás
- ✅ `PATCH /listings/:id/status` con DTO validado y transiciones por rol
  - Seller: `active↔paused`, `active/paused→sold`, `pending_review→paused`
  - Moderador/Admin/Owner: `pending_review→active/removed`, `active/paused/sold→removed`
- ✅ `getById` acepta listings inactivos — acceso controlado para draft/pending_review
- ✅ `verification.service` marca listing como `pending_review` al enviar fotos
- ✅ `MyListingsPanel`: sin botón borrar, confirmación inline para marcar vendido, overlays sold/removed, badges de estado con colores, opacidad para paused/expired
- ✅ `ListingCard`: prop `status` con badges y overlays
- ✅ `listings/[id]`: banners sold/expired/removed, contacto deshabilitado para inactivos
- ✅ Perfil público: pestañas Activos / Vendidos con conteo

**Fixes y mejoras adicionales (misma sesión):**
- ✅ Verificación manual por admin: `POST /admin/users/:id/verify`
- ✅ Auto-verify al asignar rol: moderator/admin/owner → `idVerified=true` automático
- ✅ Owner oculto en UI de roles — solo moderator/admin asignables por interfaz
- ✅ Barra de límite de listings desactivada en UI (`LISTING_LIMITS_UI` comentado)
- ✅ 3 usuarios con rol elevado auto-verificados en producción (franku, alianexo, ubwnricardo)
- ✅ Bug username desde email al registrar: trigger + upsert en API
- ✅ Toggle switches FilterSidebar roto en móvil
- ✅ Botón "Volver al feed" en listing detail

---

## Pendientes — Sprint 7

### Variables de entorno pendientes (Railway / Vercel)
- `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` — push notifications
- `CLOUDINARY_CLOUD_NAME` / `API_KEY` / `API_SECRET` — upload de fotos
- `TYPESENSE_*` — search (desactivado sin crash por ahora)

### Producto (beta launch)
- RLS policies en Supabase (urgente antes de beta pública)
- Sentry + Posthog
- Dominio custom (`cambialo.app`)
- k6 load testing
- C1B: Magic link por dispositivo nuevo para vendedores verificados (`TrustedDevice` model + Resend)
- Activar `LISTING_LIMITS_UI` en `MyListingsPanel` cuando se decida implementar límites

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
| `earthdistance` + `$queryRaw` para geo-feed | Prisma no soporta funciones PostGIS nativas — raw SQL necesario |
| `AuditLog` fire-and-forget en guard | Nunca bloquear el request por logging |
| 2FA via Supabase MFA (TOTP nativo) | Sin dependencias extra, integrado con el flujo de sesión existente |
| Soft delete en listings (status = removed) | Preserva historial, PendingReviews y referencias sin romper foreign keys |

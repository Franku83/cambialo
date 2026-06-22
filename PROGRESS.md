# Cambialo — Estado del Proyecto
> Última actualización: 22 Junio 2026

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
| **Fixes post-6.5** | ✅ | SEO/indexación Google, bugs dashboard drafts, duplicados listings |
| **Sprint 7** | ✅ | RLS, 2FA en login, /settings completa, Sentry, Posthog — pendiente: env vars Cloudinary/Sentry/Posthog |
| **Fixes post-7** | ✅ | 2FA bugs móvil, 404 al publicar, eliminar drafts, continuar drafts, favicon SVG, og-image 1200×630 |
| **Sprint 8** | ✅ | Métodos de pago, 23 estados VZ, mapa Leaflet, foto portada, sweep lenguaje, cargador, trade-in filter |
| **Sprint 8.1** | ✅ | 8 bugfixes: 404 pending_review, drafts en cola, precio $1, hard delete drafts, código verificación, minOfferUsd, ubicación en wizard, paymentMethods |
| **Sprint 8.2** | ✅ | Política de Privacidad + Términos y Condiciones, Footer compartido en todas las páginas |
| **Sprint 8.4** | ✅ | Login email/username, reparaciones estructuradas, filtro noRepairs, archivados con paginación, dashboard tabs, correcciones /terms |

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

## Fixes post-Sprint 6.5 — Completado (20 Mayo 2026, sesión 2)

### SEO e Indexación Google
- ✅ Meta tag `google-site-verification` en `layout.tsx` — Search Console verificado
- ✅ `sitemap.ts` — sitemap dinámico en `/sitemap.xml`: páginas estáticas + modelos por marca + listings activos (hasta 1000). Revalidación 1h listings / 24h modelos
- ✅ `robots.ts` — `/robots.txt` bloquea rutas privadas (`/admin`, `/dashboard`, `/kyc`, `/sell`, etc.)
- ✅ Metadata global mejorada: keywords detalladas, OG completo, Twitter Card, robots directives, `creator`, `publisher`
- ✅ JSON-LD `Organization` en layout (schema.org)
- ✅ JSON-LD `Product` + `Offer` en `/listings/[id]` (schema.org)
- ✅ `generateMetadata` en listing detail enriquecido con descripción completa y Twitter Card
- ✅ Fix: `safeDate()` helper en sitemap para evitar `RangeError: Invalid time value` cuando `updatedAt` no está en el select del feed

### Dashboard — Drafts
- ✅ Fix 404: link del nombre en `MyListingsPanel` para drafts apunta a `/sell?draft=:id` en vez de `/listings/:id`
- ✅ Botón "Continuar" (verde) en drafts del dashboard principal — retoma el wizard
- ✅ Botón eliminar borrador (papelera roja) con confirmación en `MyListingsPanel`
- ✅ Backend: `draft → removed` agregado a `SELLER_ALLOWED_TRANSITIONS`
- ✅ `/dashboard/listings`: convertido a client component con botón eliminar, "Continuar" para drafts, sin "Ver" en borradores

### Anti-duplicados en Wizard
- ✅ `handleStep1Next` consulta drafts existentes (mismo modelo + storage) antes de crear uno nuevo — reutiliza el draft si existe
- ✅ DB limpiada: duplicados de alianexo (iPhone 11) y CJFARIASL (iPhone 12) borrados
- ✅ Listing bugueado de Franku (iPhone 14 Pro `removed`) borrado
- ✅ Draft iPhone 17 de Franku borrado manualmente

### Dominio y CORS
- ✅ `cambialo.app` + `www.cambialo.app` agregados a CORS `allowedOrigins` en `main.ts`
- ✅ `metadataBase` actualizado a `https://cambialo.app` en layout

---

## Sprint 7 — Completado (21 Mayo 2026)

### Código completado ✅
- ✅ RLS en 20 tablas con 40 políticas + helper `is_mod_or_above()`
- ✅ `notification_preferences` table creada con RLS
- ✅ 2FA obligatorio en login: verifica ban/suspensión, redirige a `/verify-2fa` o `/setup-2fa` para roles críticos
- ✅ Settings endpoints: `POST /auth/settings/change-email|change-password`, `GET|DELETE /auth/settings/2fa-status|2fa/:factorId`, `GET|PUT /auth/settings/notifications`
- ✅ `NotificationPreference` model en schema.prisma
- ✅ Sentry: `@sentry/node` en API + `@sentry/nextjs` en web, `instrumentation.ts` + `sentry.client.config.ts` (condicionado a env var)
- ✅ Posthog: `lib/posthog.ts` con eventos + `initPosthog()` llamado desde `Providers`
- ✅ Header: opción "Ajustes" → `/settings` en dropdown de avatar
- ✅ `/settings`: página completa — cambiar email, contraseña (con ojo), estado 2FA, toggles notificaciones, zona de peligro "ELIMINAR"
- ✅ Fix: `/settings` obtiene sesión directamente de Supabase (`getSession()`) — evita el race condition con el store persistido
- ✅ `verify-2fa`: input grande, auto-submit al 6to dígito, "Usar otra cuenta"
- ✅ `ErrorBoundary.tsx` + `app/error.tsx` para crashes globales
- ✅ Ramas limpiadas — solo queda `main`

### Variables de entorno pendientes — acción manual

**Railway (API):**
```
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SENTRY_DSN=...
```

**Vercel (frontend):**
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_SENTRY_DSN=...
SENTRY_AUTH_TOKEN=...
NEXT_PUBLIC_POSTHOG_KEY=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

### Pendiente de código
- ⏳ `LISTING_LIMITS_UI`: activar en `MyListingsPanel` cuando se decida implementar
- ⏳ k6 load testing
- ⏳ C1B: Magic link por dispositivo nuevo (`TrustedDevice` model + Resend)

### Pasos manuales pendientes (tú)
- Supabase Auth → URL Configuration: Site URL = `https://cambialo.app`, Redirect URLs: `https://cambialo.app/**`
- Google Search Console → Sitemaps → enviar `https://cambialo.app/sitemap.xml`
- Crear cuenta en Sentry, copiar DSN y setear env vars en Railway + Vercel
- Crear cuenta en Posthog, copiar key y setear `NEXT_PUBLIC_POSTHOG_KEY` en Vercel
- Cloudinary: copiar credenciales a Railway + `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` en Vercel

### Notas importantes
- El upload de fotos va **API → Cloudinary** (no desde el browser directo). Solo `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` se necesita en Vercel para construir URLs de thumbnails.
- Sentry y Posthog no crashean si las env vars están ausentes — están condicionados.

---

## Fixes post-Sprint 7 — Completado (21 Mayo 2026, sesión 3)

### Bugs resueltos
- ✅ Fix: `setup-2fa` en móvil — unenroll de factores TOTP sin verificar antes de re-enrollar (evita conflicto)
- ✅ Fix: `verify-2fa` código incorrecto en móvil — eliminado auto-submit en `onChange`; solo el botón dispara la verificación (soluciona rotación de código en conexión lenta)
- ✅ Fix: 404 al terminar de publicar — wizard muestra pantalla de éxito interna en vez de redirigir a `/listings/:id` (que estaba en `pending_review`)
- ✅ Fix: eliminar borrador falla para owner — transiciones de seller y moderador se combinan (union de sets) en vez de elegir exclusivamente la del moderador
- ✅ Fix: "Continuar" en dashboard reinicia el wizard — `sell/page.tsx` ahora lee `?draft=:id`, restaura el store y salta al paso 4 (fotos)

### Brand & SEO
- ✅ `icon.svg` en `app/` — Next.js lo sirve automáticamente como favicon en todas las páginas
- ✅ `favicon.svg` en `public/` para referencias directas (JSON-LD Organization logo)
- ✅ `logo.svg` en `public/` — logo completo con texto disponible en `/logo.svg`
- ✅ `og-image.png` — corregido a 1200×630 PNG (dimensiones OG correctas)

---

## Sprint 8 — Completado (26 Mayo 2026)

### Claude — Lógica y Backend
- ✅ `payment_methods JSONB` en tabla `users` (migración aplicada en Supabase)
- ✅ `GET/PUT /users/me/payment-methods` + `GET /users/:username/payment-methods`
- ✅ `GET/PUT /auth/settings/payment-methods` (para página /settings)
- ✅ `paymentMethods` expuesto en `PUBLIC_SELLER_SELECT` — llega al feed y al detalle
- ✅ Filtro `?paymentMethod=zelle|usdt|cash|pago_movil|bs` en feed (Prisma + raw SQL geo)
- ✅ `constants/venezuela-states.ts` — 24 entidades + `STATE_COORDS` para el mapa
- ✅ Filtro `?state=DC` en `ListingFiltersDto` → `buildWhereClause` + geo feed
- ✅ Filtro `?acceptsTradeIn=true` en DTO + ambas rutas del feed
- ✅ `VERIFICATION_CODE_REQUIRED = false` — listings pasan a `pending_review` sin foto de código físico (cambiar a `true` para reactivar)
- ✅ `PATCH /listings/:id/cover-photo { photoId }` — cambia `isCover` en DB

### Agy — UI y Visual
- ✅ `/settings` — sección "Métodos de pago" con toggles + inputs por método, llama a `/auth/settings/payment-methods`
- ✅ Listing detail — sección "💳 Acepta pagos con" antes del botón WhatsApp
- ✅ `ListingCard` — iconos de métodos de pago (🏦₮📱💵🇻🇪) debajo de ciudad
- ✅ `FilterSidebar` — filtro chips método de pago + toggle trade-in + `LocationPicker`
- ✅ `LocationPicker.tsx` — mapa Leaflet con círculo de radio, dropdown 23 estados, radio sugerido/personalizado
- ✅ Wizard Step 4 — "Usar como portada" en cada foto, llama a `PATCH /cover-photo`
- ✅ Sweep de lenguaje — `ConditionGuide`: Mint→"Nuevo / Como nuevo", Good→"Bueno", Fair→"Regular", Poor→"Malo"
- ✅ `AccessoriesChecklist` — cargador agregado (ícono Zap, label "Cargador original")
- ✅ Modo oscuro eliminado del wizard — CSS clases `.payment-badge`, `.photo-cover`, `.cover-badge` en globals.css
- ✅ Header — categorías (Todos / Apple / Samsung) siempre visibles en todas las rutas

---

## Sprint 8.1 — Completado (29 Mayo 2026)

### 8 bugfixes de lógica y backend

- ✅ **Bug 1** — `paymentMethods` agregado al select de `findPublicProfile` en `users.service.ts`
- ✅ **Bug 2** — `VERIFICATION_CODE_ENABLED` flag en `lib/config.ts` oculta el step de código físico en el wizard (`NEXT_PUBLIC_VERIFICATION_CODE_ENABLED=false` en Vercel)
- ✅ **Bug 3** — Step3 del wizard llama `PATCH /listings/:id/details` al avanzar → precio real guardado en DB (no el placeholder `1`)
- ✅ **Bug 4** — `getById` ahora lanza `NotFoundException` (no `ForbiddenException`) para no-owners — viewer leído del JWT, no de query param
- ✅ **Bug 5** — Cola de moderación filtra `status: 'pending_review'` — drafts ya no aparecen
- ✅ **Bug 6** — `deleteDraft` + endpoint `DELETE /listings/:id/draft` para hard delete de borradores; `draft→removed` eliminado de `SELLER_ALLOWED_TRANSITIONS`
- ✅ **Bug 7** — `minOfferUsd` limpiado al desactivar "acepta ofertas"; enviado como `null` si ≤ 0
- ✅ **Bug 8** — `LocationPicker` integrado en Step3 del wizard con prop `showRadiusPicker={false}` (sin slider de radio)
- ✅ Nuevo endpoint `PATCH /listings/:id/details` para actualizar detalles de un draft (precio, ciudad, estado, ofertas, trade-in, descripción, coords)

---

## Sprint 8.2 — Completado (29 Mayo 2026)

### Legal — obligatorio antes del beta launch

- ✅ `/privacy` — Política de Privacidad (9 secciones, mismo estilo que /about)
- ✅ `/terms` — Términos y Condiciones (12 secciones)
- ✅ `Footer` component compartido en `components/layout/Footer.tsx` — visible en **todas** las páginas (main + info layouts)
- ✅ Footer viejo hardcodeado en `homepage (page.tsx)` eliminado — sin duplicado
- ✅ Zonas seguras removido del footer (feature desactivada por ahora)
- ✅ Texto de consentimiento en `/register` antes del botón de submit
- ✅ Ambas páginas en `sitemap.ts` (priority 0.4, changeFrequency: yearly)
- ✅ Links: Explorar · Publicar · Quiénes somos · FAQ · Roadmap · Privacidad · Términos

---

## Sprint 8.4 — Completado (22 Junio 2026)

### Claude — Backend

**Login con username:**
- ✅ `login.dto.ts`: campo `email` → `identifier` (acepta email o username)
- ✅ `auth.service.ts` `login()`: resuelve username → email via Prisma, autentica con Supabase
- ✅ Verificación unificada de `isBanned` + `isSuspended`/`suspendedUntil` — aplica para ambos caminos (email y username)
- ✅ Suspensión expirada se limpia silenciosamente al hacer login
- ✅ Error genérico "Credenciales inválidas" — no revela si el username existe

**Checks de reparación:**
- ✅ `CreateListingDto`: `RepairDetailsDto` estructurado (9 booleans + `other: string`), validado condicionalmente con `@ValidateIf(o => o.hasRepairs === true)`
- ✅ `listings.service.ts` `createDraft()`: serializa `repairDetails` como JSON string
- ✅ `ListingFiltersDto`: filtro `noRepairs` (boolean)
- ✅ `buildWhereClause()`: `noRepairs` → `where.hasRepairs = false`

**Listings archivados:**
- ✅ Nuevo endpoint `GET /listings/mine/archived?cursor=&limit=20`
- ✅ `getArchivedListings()` con cursor pagination — clasifica por estado (sold/removed/expired)
- ✅ Nuevo endpoint en controller con auth guard

### Agy — Frontend

**Login:**
- ✅ Campo de email → texto libre con label "Correo electrónico o usuario"
- ✅ `autoComplete="username"`, `autoCapitalize="none"`, `autoCorrect="off"`
- ✅ Hint: "Puedes usar tu correo electrónico o tu nombre de usuario."

**Wizard Step 2 — Reparaciones:**
- ✅ Toggle + textarea reemplazado por checklist de 9 reparaciones en grid 2 columnas (Tailwind)
- ✅ Campo "Otro" con maxLength 200
- ✅ `repairDetails` se guarda como JSON stringificado en el Zustand store
- ✅ Step 5: resumen de reparaciones con badges en la vista previa
- ✅ Listing detail: reparaciones parseadas y mostradas como tags; fallback "✅ Sin reparaciones reportadas"

**FilterSidebar:**
- ✅ Nuevo filtro `noRepairs` en `Filters` interface, `parseFilters`, `countActiveFilters`, `applyFilters`
- ✅ Toggle "🔧 Sin reparaciones" en la sección de switches

**Dashboard — Tabs:**
- ✅ 3 tabs: Activos / Borradores / Archivados (con icono Archive)
- ✅ `ListingItem` y `EmptyState` extraídos como componentes separados para reutilización entre tabs
- ✅ Nuevo componente `ArchivedListingsPanel.tsx`: fetch a `GET /listings/mine/archived`, agrupados por estado (Vendidos ✅ / Expirados ⏰ / Eliminados 🚫), colapsables con chevron, thumbnails, fechas formateadas con date-fns/es

**Términos y Condiciones:**
- ✅ Sección 6: definición de reseña inválida + reviews permanentes tras eliminación de cuenta (C4A, C4C)
- ✅ Sección 8: proceso de apelación — 7 días, 48h hábiles, formulario de soporte en panel de usuario (C4B)
- ✅ Emails `soporte@cambialo.app` reemplazados por "formulario de soporte disponible en tu panel de usuario" en secciones 3, 8 y 12

### Archivos modificados (Sprint 8.4)

| Archivo | Cambio |
|---|---|
| `apps/api/src/modules/auth/dto/login.dto.ts` | `email` → `identifier` |
| `apps/api/src/modules/auth/auth.service.ts` | Login acepta email/username, ban/suspension unificado |
| `apps/api/src/modules/auth/auth.controller.ts` | Summary actualizado |
| `apps/api/src/modules/listings/dto/create-listing.dto.ts` | `RepairDetailsDto` estructurado |
| `apps/api/src/modules/listings/dto/listing-filters.dto.ts` | Filtro `noRepairs` |
| `apps/api/src/modules/listings/listings.service.ts` | `getArchivedListings()`, `noRepairs` en `buildWhereClause`, serialización JSON en `createDraft` |
| `apps/api/src/modules/listings/listings.controller.ts` | Endpoint `GET /listings/mine/archived` |
| `apps/web/src/app/(auth)/login/page.tsx` | Campo identifier + hint |
| `apps/web/src/app/(main)/sell/page.tsx` | Checklist reparaciones + resumen en Step 5 |
| `apps/web/src/app/(main)/listings/[id]/page.tsx` | Reparaciones estructuradas en detalle |
| `apps/web/src/components/listings/FilterSidebar.tsx` | Filtro `noRepairs` |
| `apps/web/src/components/dashboard/MyListingsPanel.tsx` | Tabs + ListingItem + EmptyState |
| `apps/web/src/components/dashboard/ArchivedListingsPanel.tsx` | **Nuevo** — panel de archivados |
| `apps/web/src/app/(info)/terms/page.tsx` | 3 correcciones de texto + reemplazo de email hardcodeado |

---

## Pendientes técnicos menores

### Variables de entorno legacy
- `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` — push notifications (PWA)
- `TYPESENSE_*` — search (desactivado sin crash por ahora)

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
| Login con identifier (email o username) | Frontend envía `identifier`, backend resuelve username → email antes de autenticar con Supabase |
| repairDetails como String? (JSON serializado) | Evita migración de tipo de campo; no hay queries que filtren por componentes de reparación |
| Check ban/suspensión después de Supabase auth | Unificado para email y username; evita bypass; limpieza silenciosa de suspensiones expiradas |
| Dashboard con tabs (Active/Drafts/Archived) | Separación clara de estados; ArchivedListingsPanel carga datos lazy via endpoint propio |

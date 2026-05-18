# Cambialo — Estado del Proyecto
> Última actualización: 18 Mayo 2026

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
| **Sprint 6** | 🔜 | UI redesign (Swappa-like) + monetización |
| Sprint 7 | ⏳ | Beta launch: 50 usuarios, Sentry, Posthog, k6 load testing |

---

## Lo que falta / Pendientes técnicos

### Variables de entorno pendientes de configurar en producción
- `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` — generar con `npx web-push generate-vapid-keys`
- `CLOUDINARY_CLOUD_NAME` / `API_KEY` / `API_SECRET` — para upload de fotos
- `TYPESENSE_*` — actualmente desactivado sin crash, pero search no funciona

### Módulos aún vacíos (Sprint 6+)
- `apps/api/src/modules/payments/` — pagos de bumps y suscripciones
- `apps/api/src/modules/admin/` — panel de moderación
- `apps/api/src/modules/imei/` — validación IMEI externa

### Pendientes de seguridad
- RLS policies en Supabase (actualmente sin RLS — urgente antes de beta)
- Rate limiting por usuario autenticado (actual solo por IP)

---

## Sprint 6 — UI Swappa-like + Monetización

**Objetivo:** Que la UI se parezca a Swappa (`swappa.com`) y agregar el sistema de bumps/suscripciones.

### UI Redesign (Swappa-like)
Swappa tiene: fondo blanco, verde como acento (#16a34a), lista horizontal de listings (no grid), sidebar de filtros con dropdowns, rutas por modelo, header con búsqueda prominente.

- [ ] **Tema claro** — cambiar de dark a light: fondo blanco, texto negro, verde como primario
- [ ] **Header nuevo** — logo + barra de búsqueda prominente + nav categorías (Apple, Samsung, Motorola...) + iconos de login/carrito
- [ ] **Home page** — hero banner + trust signals (Verificado IMEI / Zona Segura / Reseñas) + listings recientes
- [ ] **Rutas por modelo** — `/listings/[brand]/[model-slug]` → página dedicada con todos los listings de ese equipo
- [ ] **Lista horizontal** — reemplazar card grid por rows estilo Swappa: thumbnail | condición + batería + storage + color | vendedor + rating | precio
- [ ] **Sidebar de filtros** — dropdowns: Condición, Almacenamiento, Color, Precio min/max, Solo verificados
- [ ] **Listing detail** — rediseño con galería, specs en tabla, seller card, botón WhatsApp destacado

### Monetización
- [ ] **Bumps** — $1 USD por 24h de boost en el feed. BullMQ job que expira el bump automáticamente
- [ ] **Vendedor Verificado** — suscripción $3/mes o $25/año. Badge especial + listings priorizados
- [ ] **Ads nativos** — slots patrocinados en el feed (cada 5 listings)
- [ ] **Integración de pago** — Stripe o pago manual por Zelle/transferencia (Venezuela context)

---

## Sprint 7 — Beta Launch

**Objetivo:** 50 usuarios reales, métricas, estabilidad.

- [ ] Sentry para error tracking (frontend + backend)
- [ ] Posthog para analytics de producto
- [ ] k6 load testing — aguantar 100 req/seg en el feed
- [ ] Landing page pública (`/`) con waitlist o acceso directo
- [ ] Dominio custom (`cambialo.app` o similar)
- [ ] RLS policies completas en Supabase
- [ ] Onboarding flow para nuevos vendedores
- [ ] Email transaccional (Resend) — bienvenida, verificación, notificaciones

---

## Decisiones técnicas importantes

| Decisión | Por qué |
|---|---|
| Prisma para el API, Supabase JS para el frontend | Supabase port 5432 bloqueado en algunos entornos cloud, HTTPS siempre disponible |
| Cursor pagination con tie-breaker `{id: 'desc'}` | Evita duplicados/saltos en el feed con múltiples criterios de orden |
| `verificationStatus: 'desc'` en el feed | Alfabéticamente pone "verified" antes que "pending" y "expired" |
| Supabase pooler `aws-1-us-east-2:6543` | El direct connection (5432) está bloqueado en Railway |
| Node 22 en Docker | Node 20 no tiene WebSocket nativo, requerido por Supabase Realtime |
| `binaryTargets = linux-musl-openssl-3.0.x` | Alpine Linux usa OpenSSL 3, Prisma 5 necesita el binary target explícito |

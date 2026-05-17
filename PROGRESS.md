# Cambialo — Estado del Proyecto
> Última actualización: Mayo 2026

## Estado de Sprints

| Sprint | Estado | Descripción |
|--------|--------|-------------|
| Sprint 0 | ✅ Completo | Monorepo, DB schema, API base, configuración |
| Sprint 1 | ✅ Completo | Auth (login/register/magic-link/OAuth), perfiles, KYC, notificaciones |
| Sprint 2 | ✅ Completo | Feed infinito, Typesense, búsqueda, ListingCard, detalle listing, OG images |
| Sprint 3 | ✅ Completo | Wizard publicación 5 pasos, código verificación, upload fotos, WhatsApp card |
| Sprint 4 | ✅ Completo | Reviews, reputación, zonas seguras, ReportButton, ReputationBadge |
| Sprint 5 | ✅ Completo | PWA, push notifications, alertas de búsqueda, Lighthouse >90 |
| Sprint 6 | 🔜 Próximo | Bumps, suscripción Vendedor Verificado, ads nativos |
| Sprint 7 | ⏳ Pendiente | Beta launch, Sentry, Posthog, load testing |

---

## Infraestructura Conectada

- **Supabase**: `yoanpzeigqtfvtotkbpe.supabase.co` — 14 tablas, seed completo
- **Redis**: local en dev (`redis://localhost:6379`)
- **Typesense**: pendiente de configurar
- **Cloudinary**: pendiente de configurar

---

## Sprint 4 — Confianza + Social `[COMPLETADO]`

**Backend (NestJS):**
- `reviews.service.ts` — createReview (valida duplicados, actualiza reputationScore), getReviewsForUser
- `reviews.controller.ts` — POST /reviews, GET /reviews/user/:userId
- `safe-zones.service.ts` + `controller.ts` — findByCity(city, state?) y findAll
- `fraud-reports/` — módulo completo: create, findAll (admin), updateStatus (moderadores)
- `FraudReportsModule` añadido a AppModule

**Frontend (Next.js):**
- `StarRating.tsx` — estrellas clickables, props: value/onChange/readOnly/size
- `ReviewCard.tsx` — card con rating, comentario, reviewer, fecha relativa, badge buy/sell
- `ReviewForm.tsx` — formulario post-transacción con StarRating, toggle comprador/vendedor, submit a Supabase
- `ReviewsList.tsx` — lista paginada via React Query contra el API
- `safe-zones/page.tsx` — Server Component, zonas agrupadas por ciudad, filtro, horarios, link Google Maps
- `ReputationBadge.tsx` — badge 0-100 con niveles: Nuevo/Confiable/Verificado/Top
- `ReportButton.tsx` — botón con modal, solo visible para usuarios autenticados que no son el dueño
- `dashboard/reviews/page.tsx` — Server Component con resumen de reseñas recibidas

**Notas técnicas:**
- reputationScore se recalcula en cada review: +20 si idVerified, +5/review positiva (cap 40), -10/negativa, +2/listing verificado (cap 20)
- ReviewForm usa Supabase JS SDK directamente (no pasa por el API)
- ReportButton llama al API NestJS con Bearer token

---

## Sprint 5 — PWA + Notificaciones `[PRÓXIMO]`

Lo que se construirá:
- Service Worker activado con estrategias de caché ya definidas en next.config.ts
- Notificaciones push Web Push API + claves VAPID
- Supabase Realtime para notificaciones en-app
- Alertas de búsqueda (SearchAlert → notificación cuando aparece listing que hace match)
- Lighthouse score > 90
- Install prompt personalizado

*Para arrancar: "empezamos Sprint 5"*

---

## Sprint 5 — PWA + Notificaciones `[COMPLETADO]`

**Backend (NestJS):**
- `push.service.ts` — VAPID init en `onModuleInit`, `sendPush()` con manejo de suscripciones expiradas (410), `saveSubscription()` 
- `search-alerts.service.ts` — CRUD de alertas + `checkNewListingMatches()` que filtra listings nuevos contra alertas activas por marca, modelo, precio, batería y ciudad
- `search-alerts.controller.ts` + `module` — `GET/POST/DELETE /search-alerts` (autenticados)
- `SearchAlertsModule` añadido a AppModule

**Frontend (Next.js):**
- `lib/push.ts` — `subscribeToPush()` (VAPID + permiso), `sendSubscriptionToServer()`, `isPushSupported()`
- `InstallPrompt.tsx` — banner PWA en bottom, detecta `beforeinstallprompt`, persiste dismiss en localStorage
- `PushPermission.tsx` — botón "Activar notificaciones", maneja estados: unsupported/default/loading/granted/denied
- `SearchAlertForm.tsx` — formulario con marca (select), modelo, precio máx, slider batería, ciudad
- `dashboard/alerts/page.tsx` — lista de alertas activas con SSC desde Supabase directo
- `dashboard/alerts/DeleteAlertButton.tsx` — botón eliminar con confirm + Bearer token

*Para arrancar Sprint 6: "empezamos Sprint 6"*

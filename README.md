# Cambialo

Marketplace de smartphones verificados para Venezuela. Compra y vende con confianza — cada equipo pasa por verificación de IMEI, el vendedor tiene identidad confirmada, y los intercambios se coordinan en zonas seguras.

## Stack

- **Frontend** — Next.js 15 (App Router), Tailwind CSS v4, Supabase JS
- **Backend** — NestJS, Prisma, BullMQ, Redis
- **Infra** — Supabase (DB + Auth), Vercel (web), Railway (API + Redis)

## Desarrollo local

```bash
git clone https://github.com/Franku83/cambialo
cd cambialo
npm install
cp .env.example apps/web/.env.local
# Editar con tus credenciales de Supabase
npm run dev
```

La web corre en `localhost:3000`, el API en `localhost:4000`.

## Estructura

```
apps/
  web/   → Next.js 15
  api/   → NestJS
packages/
  db/    → Prisma schema
  types/ → Tipos compartidos
```

## Roadmap

- [x] Fundación — monorepo, DB, autenticación
- [x] Marketplace — feed, búsqueda, publicación de equipos
- [x] Confianza — verificación, reseñas, zonas seguras
- [x] PWA — notificaciones push, alertas de búsqueda
- [ ] UI + Monetización — rediseño, bumps, suscripciones
- [ ] Beta — analytics, error tracking, dominio propio

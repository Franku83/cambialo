# Cambialo

Plataforma de compraventa de smartphones verificados para Venezuela.

## Stack

- **Frontend**: Next.js 15, Tailwind CSS v4, shadcn/ui
- **Backend**: NestJS, Supabase Auth, BullMQ
- **DB**: PostgreSQL vía Supabase + Prisma ORM
- **Búsqueda**: Typesense
- **Imágenes**: Cloudinary
- **Deploy**: Vercel (web) + Railway (api + redis + typesense)

## Setup local

### 1. Prerrequisitos

- Node.js >= 20
- npm >= 10
- Cuentas en: [Supabase](https://supabase.com), [Cloudinary](https://cloudinary.com), [Typesense Cloud](https://cloud.typesense.org) o Railway

### 2. Clonar e instalar

```bash
git clone https://github.com/tu-usuario/cambialo
cd cambialo
npm install
```

### 3. Variables de entorno

```bash
cp .env.example .env.local
# Editar .env.local con tus valores
```

Variables clave a configurar primero:
- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase > Settings > API)
- `DATABASE_URL` y `DIRECT_URL` (Supabase > Settings > Database)
- `CLOUDINARY_CLOUD_NAME` y keys (Cloudinary Dashboard)

### 4. Base de datos

```bash
# Generar cliente Prisma
npm run db:generate

# Correr migraciones
npm run db:migrate

# Seed inicial (modelos de dispositivos + zonas seguras base)
cd packages/db && npx ts-node prisma/seed.ts
```

### 5. Claves VAPID para notificaciones push

```bash
npx web-push generate-vapid-keys
# Pegar los valores en .env.local: NEXT_PUBLIC_VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY
```

### 6. Correr en desarrollo

```bash
# Correr todo en paralelo (web + api)
npm run dev

# O por separado:
cd apps/web && npm run dev    # http://localhost:3000
cd apps/api && npm run dev    # http://localhost:4000
```

## Estructura del proyecto

```
cambialo/
├── apps/
│   ├── web/          # Next.js 15 — Vercel
│   └── api/          # NestJS — Railway
├── packages/
│   ├── db/           # Prisma schema + cliente
│   ├── types/        # Tipos TypeScript compartidos
│   └── utils/        # Utilidades compartidas
└── turbo.json
```

## Servicios externos requeridos

| Servicio | Uso | Tier gratuito |
|---|---|---|
| Supabase | DB + Auth + Realtime | ✅ Generoso |
| Cloudinary | Imágenes | ✅ 25GB |
| Typesense Cloud | Búsqueda | ✅ 1 nodo |
| Upstash Redis | Cache edge | ✅ 10k req/día |
| Resend | Email | ✅ 100 emails/día |
| Railway | NestJS + Redis | $5/mes (mínimo) |
| Vercel | Frontend | ✅ Hobby plan |

## Roadmap de sprints

- **Sprint 0** ✅ Fundación (monorepo, DB, config)
- **Sprint 1** — Auth + Perfiles
- **Sprint 2** — Feed + Búsqueda
- **Sprint 3** — Módulo de Vendedor
- **Sprint 4** — Confianza + Social
- **Sprint 5** — PWA + Notificaciones
- **Sprint 6** — Monetización
- **Sprint 7** — Beta

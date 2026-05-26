import Link from 'next/link'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ListingCard, ListingCardSkeleton } from '@/components/listings/ListingCard'
import type { ListingCondition, VerificationStatus } from '@cambialo/types'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Cambialo — Smartphones Verificados en Venezuela',
  description:
    'Compra y vende smartphones verificados en Venezuela. Sin estafas, sin precios ocultos, sin cuentas falsas.',
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface RecentListing {
  id: string
  priceUsd: string
  storageGb: number
  batteryHealth: number
  condition: ListingCondition
  verificationStatus: VerificationStatus
  isBumped: boolean
  acceptsOffers: boolean
  city: string | null
  color: string
  deviceModel: { brand: string; modelName: string }
  photos: { cloudinaryUrl: string; isCover: boolean }[]
  seller?: { username: string; reputationScore: number; totalSales: number }
}

async function getRecentListings(): Promise<RecentListing[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/listings?limit=6&verifiedOnly=true`, {
      next: { revalidate: 120 },
    })
    if (!res.ok) return []
    const data = await res.json() as { data: RecentListing[] }
    return data.data ?? []
  } catch {
    return []
  }
}

function TrustSignals() {
  const items = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="text-green-600">
          <path d="M16 3L4 8v8c0 6.627 5.373 12 12 12s12-5.373 12-12V8L16 3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M11 16l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: 'IMEI Verificado',
      desc: 'Cada equipo pasa revisión antes de publicarse.',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="text-green-600">
          <circle cx="16" cy="11" r="5" stroke="currentColor" strokeWidth="2" />
          <path d="M6 27c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M22 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: 'Identidad Real',
      desc: 'Sin cuentas anónimas, cada vendedor confirmado.',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="text-green-600">
          <path d="M16 3l2.5 8H27l-7 5 2.5 8L16 19l-6.5 5 2.5-8-7-5h8.5L16 3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      ),
      title: 'Reputación Permanente',
      desc: 'Reviews reales que no se pueden borrar.',
    },
  ]
  return (
    <section className="border-y border-slate-100 bg-slate-50 py-10">
      <div className="mx-auto max-w-5xl px-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {items.map((item) => (
            <div key={item.title} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5">
              <div className="shrink-0">{item.icon}</div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

async function RecentListingsSection() {
  const listings = await getRecentListings()
  if (listings.length === 0) return null

  return (
    <section className="py-16">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Publicados recientemente</h2>
          <Link href="/explore" className="text-sm font-medium text-green-600 hover:text-green-700">
            Ver todos →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {listings.map((item) => (
            <ListingCard
              key={item.id}
              id={item.id}
              priceUsd={item.priceUsd}
              storageGb={item.storageGb}
              batteryHealth={item.batteryHealth}
              condition={item.condition}
              verificationStatus={item.verificationStatus}
              isBumped={item.isBumped}
              acceptsOffers={item.acceptsOffers}
              city={item.city}
              color={item.color}
              deviceModel={item.deviceModel}
              viewMode="grid"
              {...(item.photos[0] && { coverPhoto: item.photos[0] })}
              {...(item.seller && { seller: item.seller })}
            />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Ver todos los equipos
          </Link>
        </div>
      </div>
    </section>
  )
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const loggedIn = !!user

  return (
    <>
      {/* HERO */}
      <section className="bg-[#f0fdf4] border-b border-green-100 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="inline-block rounded-full border border-green-200 bg-white px-3 py-1 text-xs font-semibold text-green-700 mb-6">
            🇻🇪 El marketplace de confianza en Venezuela
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-tight">
            Compra y vende smartphones
            <br />
            <span className="text-green-600">verificados</span> en Venezuela
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Sin estafas, sin precios ocultos, sin cuentas falsas.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/explore"
              className="w-full sm:w-auto rounded-xl bg-green-600 px-7 py-3.5 font-semibold text-white transition-colors hover:bg-green-700 shadow-md shadow-green-200"
            >
              Explorar equipos
            </Link>
            {loggedIn ? (
              <Link
                href="/sell"
                className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-7 py-3.5 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Publicar mi equipo
              </Link>
            ) : (
              <Link
                href="/register"
                className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-7 py-3.5 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Registrarme
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* TRUST SIGNALS */}
      <TrustSignals />

      {/* CÓMO FUNCIONA */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900">Cómo funciona</h2>
            <p className="mt-2 text-slate-500">Tres pasos simples para comprar o vender.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { icon: '🔍', step: '1', title: 'Encuentra', desc: 'Busca por modelo, filtra por batería, precio y ciudad.' },
              { icon: '✅', step: '2', title: 'Verifica', desc: 'Cada vendedor confirma su identidad y el equipo con foto en vivo.' },
              { icon: '🤝', step: '3', title: 'Contacta', desc: 'Habla directo por WhatsApp y coordina el encuentro.' },
            ].map((item) => (
              <div key={item.step} className="relative rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
                    {item.step}
                  </span>
                </div>
                <span className="mt-3 block text-3xl">{item.icon}</span>
                <h3 className="mt-3 text-base font-bold text-slate-900">{item.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EQUIPOS RECIENTES */}
      <Suspense
        fallback={
          <div className="py-16">
            <div className="mx-auto max-w-5xl px-4">
              <div className="mb-8">
                <div className="h-6 w-48 rounded-lg bg-slate-100 skeleton" />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ListingCardSkeleton key={i} viewMode="grid" />
                ))}
              </div>
            </div>
          </div>
        }
      >
        <RecentListingsSection />
      </Suspense>

      {/* PARA VENDEDORES */}
      <section className="bg-slate-50 py-16 border-t border-slate-100">
        <div className="mx-auto max-w-4xl px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">¿Tienes un teléfono que vender?</h2>
              <ul className="mt-5 space-y-3">
                {[
                  'Tu precio, visible desde el primer momento.',
                  'Badge de verificación que genera confianza.',
                  'Llega a compradores serios, no curiosos.',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-bold">✓</span>
                    {point}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/sell"
                  className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-700 text-center"
                >
                  Publicar gratis
                </Link>
                {loggedIn ? (
                  <Link
                    href="/explore"
                    className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50 text-center"
                  >
                    Explorar publicaciones
                  </Link>
                ) : (
                  <Link
                    href="/register"
                    className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50 text-center"
                  >
                    Crear cuenta
                  </Link>
                )}
              </div>
            </div>
            <div className="hidden md:flex flex-col gap-4 items-end">
              <div className="rounded-2xl border border-green-100 bg-green-50 p-5 w-64 text-center shadow-sm">
                <p className="text-4xl font-extrabold text-green-700">+1,000</p>
                <p className="mt-1 text-sm font-medium text-slate-600">equipos verificados</p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 w-56 text-center shadow-sm">
                <p className="text-4xl font-extrabold text-amber-600">100%</p>
                <p className="mt-1 text-sm font-medium text-slate-600">vendedores identificados</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-100 bg-white py-10">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:justify-between sm:text-left">
            <Link href="/" className="text-xl font-bold text-green-600">Cambialo</Link>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-slate-500">
              <Link href="/explore" className="hover:text-slate-700">Explorar</Link>
              <Link href="/sell" className="hover:text-slate-700">Publicar</Link>
              <Link href="/safe-zones" className="hover:text-slate-700">Zonas seguras</Link>
              <Link href="/about" className="hover:text-slate-700">Quiénes somos</Link>
              <Link href="/faq" className="hover:text-slate-700">FAQ</Link>
              <Link href="/roadmap" className="hover:text-slate-700">Roadmap</Link>
            </div>
            <p className="text-xs text-slate-400">© 2026 Cambialo</p>
          </div>
        </div>
      </footer>
    </>
  )
}

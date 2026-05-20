'use client'

import { Suspense } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useRef, useCallback, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ListingCard, ListingCardSkeleton, type ViewMode } from '@/components/listings/ListingCard'
import { FilterSidebar } from '@/components/listings/FilterSidebar'
import { ViewToggle } from '@/components/listings/ViewToggle'
import { EmptyStateWithFilters, EmptyStateFeed } from '@/components/listings/EmptyState'
import LocationBanner from '@/components/home/LocationBanner'
import type { ListingCondition, VerificationStatus } from '@cambialo/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface FeedItem {
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
  distance_km?: number
}

interface FeedPage {
  data: FeedItem[]
  nextCursor: string | null
  total: number
}

async function fetchFeed(cursor?: string, params?: URLSearchParams): Promise<FeedPage> {
  const p = new URLSearchParams(params)
  p.set('limit', '20')
  if (cursor) p.set('cursor', cursor)
  const res = await fetch(`${API_URL}/api/v1/listings?${p.toString()}`)
  if (!res.ok) throw new Error('Error cargando el feed')
  return res.json() as Promise<FeedPage>
}

// Trust signals
function TrustSignals() {
  const items = [
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-green-600">
          <path d="M16 3L4 8v8c0 6.627 5.373 12 12 12s12-5.373 12-12V8L16 3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M11 16l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: 'IMEI Verificado',
      desc: 'Cada equipo pasa revisión antes de publicarse',
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-green-600">
          <circle cx="16" cy="11" r="5" stroke="currentColor" strokeWidth="2" />
          <path d="M6 27c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M22 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: 'Identidad Real',
      desc: 'Sin cuentas anónimas, cada vendedor confirmado',
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-green-600">
          <path d="M16 3l2.5 8H27l-7 5 2.5 8L16 19l-6.5 5 2.5-8-7-5h8.5L16 3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      ),
      title: 'Reputación Permanente',
      desc: 'Reviews reales que no se pueden borrar',
    },
  ]
  return (
    <section className="border-b border-slate-100 bg-slate-50 py-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.title}
              className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4"
            >
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

const listVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
}

function FeedContent() {
  const observerRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const hasFilters = searchParams.toString().length > 0

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery({
      queryKey: ['feed', searchParams.toString()],
      queryFn: ({ pageParam }) => fetchFeed(pageParam as string | undefined, searchParams),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      staleTime: 60_000,
    })

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage()
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  )

  useEffect(() => {
    const el = observerRef.current
    if (!el) return
    const observer = new IntersectionObserver(handleObserver, { rootMargin: '300px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [handleObserver])

  const allListings = data?.pages.flatMap((p) => p.data) ?? []
  const total = data?.pages[0]?.total ?? 0

  const clearFilters = useCallback(() => {
    window.location.href = '/'
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <TrustSignals />
      <LocationBanner />

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Feed header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Smartphones verificados</h1>
            {total > 0 && (
              <p className="mt-0.5 text-sm text-slate-500">
                {total.toLocaleString('es-VE')} equipos disponibles
              </p>
            )}
          </div>
          <ViewToggle onChange={setViewMode} />
        </div>

        <div className="flex gap-6">
          {/* Sidebar filtros */}
          <FilterSidebar />

          {/* Feed */}
          <div className="min-w-0 flex-1">
            {isError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Error cargando el feed. Revisa tu conexión.
              </div>
            )}

            {isLoading ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3 sm:grid-cols-3' : 'flex flex-col gap-2'}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <ListingCardSkeleton key={i} viewMode={viewMode} />
                ))}
              </div>
            ) : allListings.length === 0 ? (
              hasFilters
                ? <EmptyStateWithFilters onClearFilters={clearFilters} />
                : <EmptyStateFeed />
            ) : (
              <motion.div
                variants={listVariants}
                initial="hidden"
                animate="show"
                className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3 sm:grid-cols-3' : 'flex flex-col gap-2'}
              >
                {allListings.map((item) => (
                  <motion.div key={item.id} variants={itemVariants}>
                    <ListingCard
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
                      {...(item.seller && { seller: item.seller })}
                      viewMode={viewMode}
                      {...(item.photos[0] && { coverPhoto: item.photos[0] })}
                      {...(item.distance_km !== undefined && { distanceKm: item.distance_km })}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Skeletons load-more */}
            {isFetchingNextPage && (
              <div className={cn('mt-2', viewMode === 'grid' ? 'grid grid-cols-2 gap-3 sm:grid-cols-3' : 'flex flex-col gap-2')}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <ListingCardSkeleton key={`more-${i}`} viewMode={viewMode} />
                ))}
              </div>
            )}

            <div ref={observerRef} className="h-4" />

            {!hasNextPage && allListings.length > 0 && (
              <p className="mt-8 text-center text-sm text-slate-400">
                Has visto todos los equipos disponibles
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <ListingCardSkeleton key={i} viewMode="list" />
            ))}
          </div>
        </div>
      </div>
    }>
      <FeedContent />
    </Suspense>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

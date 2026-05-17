'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useRef, useCallback } from 'react'
import { ListingCard, ListingCardSkeleton } from '@/components/listings/ListingCard'
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
  city: string | null
  deviceModel: { brand: string; modelName: string }
  photos: { cloudinaryUrl: string; width: number | null; height: number | null }[]
}

interface FeedPage {
  data: FeedItem[]
  nextCursor: string | null
  total: number
}

async function fetchFeed(cursor?: string): Promise<FeedPage> {
  const params = new URLSearchParams({ limit: '20' })
  if (cursor) params.set('cursor', cursor)
  const res = await fetch(`${API_URL}/api/v1/listings?${params}`)
  if (!res.ok) throw new Error('Error cargando el feed')
  return res.json() as Promise<FeedPage>
}

export default function HomePage() {
  const observerRef = useRef<HTMLDivElement>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery({
      queryKey: ['feed'],
      queryFn: ({ pageParam }) => fetchFeed(pageParam as string | undefined),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      staleTime: 60_000,
    })

  // Infinite scroll con IntersectionObserver
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

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            Smartphones verificados
          </h1>
          {total > 0 && (
            <p className="mt-1 text-sm text-zinc-500">
              {total.toLocaleString('es-VE')} equipos disponibles
            </p>
          )}
        </div>

        {/* Error state */}
        {isError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            Error cargando el feed. Revisa tu conexión.
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => <ListingCardSkeleton key={i} />)
            : allListings.map((item) => (
                <ListingCard
                  key={item.id}
                  id={item.id}
                  priceUsd={item.priceUsd}
                  storageGb={item.storageGb}
                  batteryHealth={item.batteryHealth}
                  condition={item.condition}
                  verificationStatus={item.verificationStatus}
                  isBumped={item.isBumped}
                  city={item.city}
                  deviceModel={item.deviceModel}
                  {...(item.photos[0] && { coverPhoto: item.photos[0] })}
                />
              ))}

          {/* Skeletons mientras carga más */}
          {isFetchingNextPage &&
            Array.from({ length: 4 }).map((_, i) => (
              <ListingCardSkeleton key={`more-${i}`} />
            ))}
        </div>

        {/* Empty state */}
        {!isLoading && allListings.length === 0 && (
          <div className="py-20 text-center text-zinc-500">
            <p className="text-lg">No hay listings disponibles</p>
            <p className="mt-1 text-sm">Sé el primero en publicar un equipo</p>
          </div>
        )}

        {/* Sentinel para infinite scroll */}
        <div ref={observerRef} className="h-4" />

        {/* Fin del feed */}
        {!hasNextPage && allListings.length > 0 && (
          <p className="mt-8 text-center text-sm text-zinc-600">
            Has visto todos los equipos disponibles
          </p>
        )}
      </div>
    </div>
  )
}

'use client'

import { InstantSearch, SearchBox, Hits, Stats, Pagination, useInstantSearch } from 'react-instantsearch'
import { searchClient } from '@/lib/typesense'
import { ListingCard, ListingCardSkeleton } from '@/components/listings/ListingCard'
import { PackageOpen, Search } from 'lucide-react'
import type { ListingCondition, VerificationStatus } from '@cambialo/types'

interface TypesenseHit {
  id: string
  brand: string
  model_name: string
  storage_gb: number
  price_usd: number
  battery_health: number
  condition: ListingCondition
  city: string | null
  verification_status: VerificationStatus
  cover_photo_url?: string
  is_bumped: boolean
}

function HitComponent({ hit }: { hit: TypesenseHit }) {
  return (
    <ListingCard
      id={hit.id}
      deviceModel={{ brand: hit.brand, modelName: hit.model_name }}
      storageGb={hit.storage_gb}
      priceUsd={hit.price_usd}
      batteryHealth={hit.battery_health}
      condition={hit.condition}
      city={hit.city}
      verificationStatus={hit.verification_status}
      {...(hit.cover_photo_url ? { coverPhoto: { cloudinaryUrl: hit.cover_photo_url } } : undefined)}
      isBumped={hit.is_bumped}
    />
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 rounded-full bg-zinc-900 p-6">
        <PackageOpen className="h-12 w-12 text-zinc-700" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-200">Sin resultados</h3>
      <p className="mt-1 max-w-xs text-sm text-zinc-500">
        Prueba con otro modelo o ajusta los filtros.
      </p>
    </div>
  )
}

function SearchResults() {
  const { status, results } = useInstantSearch()

  if (status === 'loading' || status === 'stalled') {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (results.nbHits === 0) return <EmptyState />

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <Stats classNames={{ root: 'text-sm text-zinc-500' }} />
      </div>

      <Hits
        hitComponent={({ hit }) => <HitComponent hit={hit as unknown as TypesenseHit} />}
        classNames={{
          list: 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
          item: 'contents',
        }}
      />

      <div className="mt-10 flex justify-center">
        <Pagination
          classNames={{
            list: 'flex gap-1',
            item: 'overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900',
            link: 'flex h-9 w-9 items-center justify-center text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white',
            selectedItem: '!border-blue-600 !bg-blue-600/10',
            disabledItem: 'pointer-events-none opacity-40',
          }}
        />
      </div>
    </>
  )
}

export default function SearchPage() {
  if (!searchClient) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-6">
      <div className="mx-auto max-w-7xl">
        <InstantSearch searchClient={searchClient} indexName="listings" routing>
          <div className="relative mb-6 max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
            <SearchBox
              placeholder="Buscar modelo, ciudad..."
              classNames={{
                root: 'w-full',
                form: 'relative',
                input:
                  'w-full rounded-xl border border-zinc-800 bg-zinc-900 py-3 pl-12 pr-4 text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all',
                submit: 'hidden',
                reset: 'hidden',
                loadingIndicator: 'hidden',
              }}
            />
          </div>

          <SearchResults />
        </InstantSearch>
      </div>
    </div>
  )
}

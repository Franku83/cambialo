'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronUp, ExternalLink, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { getListingThumbnail } from '@/lib/cloudinary'
import { formatPrice } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface ArchivedListing {
  id: string
  priceUsd: string
  status: 'sold' | 'removed' | 'expired'
  soldAt: string | null
  updatedAt: string
  deviceModel: { modelName: string; brand: string }
  photos: { cloudinaryUrl: string }[]
}

interface ArchivedResponse {
  data: {
    sold: ArchivedListing[]
    removed: ArchivedListing[]
    expired: ArchivedListing[]
  }
  nextCursor: string | null
}

interface ArchivedListingsPanelProps {
  authToken: string
}

export default function ArchivedListingsPanel({ authToken }: ArchivedListingsPanelProps) {
  const [archived, setArchived] = useState<ArchivedResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchArchived = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/v1/listings/mine/archived`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (!res.ok) throw new Error('Error al cargar archivados')
      setArchived(await res.json() as ArchivedResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [authToken])

  useEffect(() => {
    void fetchArchived()
  }, [fetchArchived])

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={() => void fetchArchived()}
          className="mt-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (!archived) return null

  const total = archived.data.sold.length + archived.data.removed.length + archived.data.expired.length

  if (total === 0) {
    return (
      <div className="py-12 text-center text-slate-400 text-sm">
        No tienes publicaciones archivadas todavía.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {archived.data.sold.length > 0 && (
        <ArchivedGroup
          title="Vendidos"
          icon="✅"
          borderColor="border-green-600"
          listings={archived.data.sold}
        />
      )}
      {archived.data.expired.length > 0 && (
        <ArchivedGroup
          title="Expirados"
          icon="⏰"
          borderColor="border-amber-500"
          listings={archived.data.expired}
        />
      )}
      {archived.data.removed.length > 0 && (
        <ArchivedGroup
          title="Eliminados por moderación"
          icon="🚫"
          borderColor="border-red-600"
          listings={archived.data.removed}
        />
      )}
    </div>
  )
}

function ArchivedGroup({
  title,
  icon,
  borderColor,
  listings,
}: {
  title: string
  icon: string
  borderColor: string
  listings: ArchivedListing[]
}) {
  const [expanded, setExpanded] = useState(true)

  const formatDate = (listing: ArchivedListing) => {
    if (listing.status === 'sold' && listing.soldAt) {
      return `Vendido el ${format(new Date(listing.soldAt), 'dd MMM yyyy', { locale: es })}`
    }
    if (listing.status === 'expired') {
      return `Expiró el ${format(new Date(listing.updatedAt), 'dd MMM yyyy', { locale: es })}`
    }
    return `Eliminado el ${format(new Date(listing.updatedAt), 'dd MMM yyyy', { locale: es })}`
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center gap-2 px-4 py-3 bg-slate-50 border-l-4 ${borderColor} font-semibold text-sm text-slate-700 hover:bg-slate-100 transition-colors`}
      >
        <span>{icon} {title}</span>
        <span className="ml-auto mr-2 bg-slate-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
          {listings.length}
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="divide-y divide-slate-100">
          {listings.map((listing) => (
            <div key={listing.id} className="flex items-center gap-3 px-4 py-3">
              {listing.photos[0]?.cloudinaryUrl ? (
                <img
                  src={getListingThumbnail(listing.photos[0].cloudinaryUrl)}
                  alt=""
                  className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-slate-300 text-xs">Sin foto</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {listing.deviceModel.brand} {listing.deviceModel.modelName}
                </p>
                <p className="text-xs font-semibold text-green-600">
                  {formatPrice(Number(listing.priceUsd))}
                </p>
                <p className="text-xs text-slate-400">{formatDate(listing)}</p>
              </div>
              <a
                href={`/listings/${listing.id}`}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

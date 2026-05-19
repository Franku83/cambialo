'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface Listing {
  id: string
  priceUsd: string
  storageGb: number
  batteryHealth: number
  condition: string
  verificationStatus: string
  city: string | null
  photos: { cloudinaryUrl: string }[]
  deviceModel: { brand: string; modelName: string }
}

const CONDITION_LABELS: Record<string, string> = {
  mint: 'Nuevo', good: 'Buen estado', fair: 'Regular', poor: 'Con detalles',
}

interface Props {
  brand: string
  modelName: string
  modelId: string
}

export default function ModelListings({ brand, modelName, modelId }: Props) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [minBattery, setMinBattery] = useState(0)
  const [storage, setStorage] = useState('')
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      brand,
      model: modelName,
      limit: '20',
      ...(minBattery > 0 && { minBattery: String(minBattery) }),
      ...(storage && { storage }),
      ...(verifiedOnly && { verifiedOnly: 'true' }),
    })
    fetch(`${API_URL}/api/v1/listings?${params}`)
      .then(r => r.json())
      .then((d: { data?: Listing[]; total?: number }) => {
        setListings(d.data ?? [])
        setTotal(d.total ?? 0)
      })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [brand, modelName, minBattery, storage, verifiedOnly])

  return (
    <div>
      {/* Filtros rápidos */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filtros</span>
        </div>
        <button
          onClick={() => setVerifiedOnly(v => !v)}
          className={cn(
            'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
            verifiedOnly ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-500 hover:border-slate-300',
          )}
        >
          🛡 Solo verificados
        </button>
        {[60, 70, 80, 90].map(b => (
          <button
            key={b}
            onClick={() => setMinBattery(minBattery === b ? 0 : b)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              minBattery === b ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-500 hover:border-slate-300',
            )}
          >
            Batería ≥{b}%
          </button>
        ))}
      </div>

      {/* Resultados */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {loading ? '...' : `${total} equipos disponibles`}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <p className="text-slate-400">No hay equipos disponibles con estos filtros</p>
          <Link href="/sell" className="mt-4 inline-block rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
            Publica el tuyo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map(l => (
            <Link
              key={l.id}
              href={`/listings/${l.id}`}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:border-green-400 hover:shadow-md"
            >
              <div className="relative aspect-square overflow-hidden bg-slate-100">
                {l.photos[0] ? (
                  <img
                    src={l.photos[0].cloudinaryUrl}
                    alt={l.deviceModel.modelName}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-5xl">📱</div>
                )}
                {l.verificationStatus === 'verified' && (
                  <span className="absolute left-2 top-2 rounded-full bg-green-600 px-2 py-0.5 text-xs font-bold text-white">
                    🛡 Verificado
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs text-slate-400">{CONDITION_LABELS[l.condition] ?? l.condition} · {l.storageGb}GB · {l.batteryHealth}% bat.</p>
                <p className="mt-1 text-lg font-bold text-slate-900">${Number(l.priceUsd).toLocaleString()}</p>
                {l.city && <p className="text-xs text-slate-400">{l.city}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

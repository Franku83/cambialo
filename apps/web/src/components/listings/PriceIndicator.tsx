'use client'

import { useState, useEffect } from 'react'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface PriceIndex {
  avgPrice: string
  medianPrice: string
  minPrice: string
  maxPrice: string
  sampleSize: number
}

interface Props {
  listingPrice: number
  deviceModelId: string
  storageGb: number
}

function getPriceStatus(listing: number, avg: number) {
  const diff = (listing - avg) / avg
  if (diff < -0.10) return 'great'
  if (diff > 0.10) return 'high'
  return 'fair'
}

export default function PriceIndicator({ listingPrice, deviceModelId, storageGb }: Props) {
  const [index, setIndex] = useState<PriceIndex | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/v1/price-index?deviceModelId=${deviceModelId}&storageGb=${storageGb}`)
      .then(r => r.json())
      .then((d: PriceIndex | null) => setIndex(d))
      .catch(() => null)
  }, [deviceModelId, storageGb])

  if (!index || index.sampleSize < 3) return null

  const avg = Number(index.avgPrice)
  const status = getPriceStatus(listingPrice, avg)
  const diff = Math.abs(listingPrice - avg)

  const config = {
    great: {
      icon: <TrendingDown className="h-4 w-4" />,
      label: 'Buen precio',
      detail: `$${diff.toFixed(0)} por debajo del promedio`,
      color: 'text-green-700 bg-green-50 border-green-200',
    },
    fair: {
      icon: <Minus className="h-4 w-4" />,
      label: 'Precio justo',
      detail: 'Dentro del rango normal',
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    high: {
      icon: <TrendingUp className="h-4 w-4" />,
      label: 'Sobre el precio',
      detail: `$${diff.toFixed(0)} por encima del promedio`,
      color: 'text-red-700 bg-red-50 border-red-200',
    },
  }[status]

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${config.color}`}>
      <div className="mt-0.5 shrink-0">{config.icon}</div>
      <div>
        <p className="font-semibold">{config.label} — {config.detail}</p>
        <p className="mt-0.5 text-xs opacity-70">
          Promedio para {storageGb}GB: ${avg.toFixed(0)} · basado en {index.sampleSize} listings
        </p>
      </div>
    </div>
  )
}

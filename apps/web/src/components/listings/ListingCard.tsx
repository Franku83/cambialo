import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Smartphone } from 'lucide-react'
import { formatPrice, cn } from '@/lib/utils'
import type { ListingCondition, VerificationStatus } from '@cambialo/types'

interface ListingCardProps {
  id: string
  coverPhoto?: { cloudinaryUrl: string; width?: number | null; height?: number | null }
  deviceModel: { brand: string; modelName: string }
  storageGb: number
  priceUsd: number | string
  batteryHealth: number
  condition: ListingCondition
  city?: string | null
  verificationStatus: VerificationStatus
  isBumped?: boolean
  isSaved?: boolean
}

export function ListingCard({
  id,
  coverPhoto,
  deviceModel,
  storageGb,
  priceUsd,
  batteryHealth,
  condition,
  city,
  verificationStatus,
  isBumped,
}: ListingCardProps) {
  const price = Number(priceUsd)
  const radius = 16
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (batteryHealth / 100) * circumference

  const batteryColor =
    batteryHealth >= 85 ? '#22c55e' : batteryHealth >= 70 ? '#eab308' : '#ef4444'

  const conditionMap: Record<ListingCondition, { label: string; bg: string }> = {
    mint:  { label: 'Nuevo',     bg: 'bg-emerald-600' },
    good:  { label: 'Bueno',     bg: 'bg-blue-600' },
    fair:  { label: 'Regular',   bg: 'bg-yellow-600' },
    poor:  { label: 'Detalles',  bg: 'bg-zinc-600' },
  }
  const { label: condLabel, bg: condBg } = conditionMap[condition] ?? conditionMap.good

  return (
    <Link
      href={`/listings/${id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700"
    >
      {/* Badges */}
      <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-1">
        {isBumped && (
          <span className="rounded bg-yellow-500 px-1.5 py-0.5 text-[10px] font-bold text-black">
            ↑ TOP
          </span>
        )}
        <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold text-white', condBg)}>
          {condLabel}
        </span>
        {verificationStatus === 'verified' && (
          <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            ✓ Verificado
          </span>
        )}
      </div>

      {/* Foto */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-800">
        {coverPhoto?.cloudinaryUrl ? (
          <Image
            src={coverPhoto.cloudinaryUrl}
            alt={`${deviceModel.brand} ${deviceModel.modelName}`}
            fill
            sizes="(max-width:640px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Smartphone className="h-10 w-10 text-zinc-700" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 flex-1 text-sm font-semibold text-zinc-100">
            {deviceModel.brand} {deviceModel.modelName}
          </h3>

          {/* Battery gauge */}
          <div className="relative h-9 w-9 shrink-0">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r={radius} fill="none" stroke="#27272a" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r={radius}
                fill="none"
                stroke={batteryColor}
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-zinc-300">
              {batteryHealth}
            </span>
          </div>
        </div>

        <p className="text-xs text-zinc-500">{storageGb} GB</p>

        <div className="mt-auto pt-2">
          <p className="text-base font-bold text-blue-400">{formatPrice(price)}</p>
          {city && (
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-600">
              <MapPin className="h-3 w-3" />
              <span>{city}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export function ListingCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="aspect-[4/3] w-full animate-pulse bg-zinc-800" />
      <div className="flex flex-col gap-2 p-3">
        <div className="flex justify-between">
          <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-800" />
          <div className="h-9 w-9 animate-pulse rounded-full bg-zinc-800" />
        </div>
        <div className="h-3 w-1/4 animate-pulse rounded bg-zinc-800" />
        <div className="mt-2 space-y-1.5">
          <div className="h-5 w-1/3 animate-pulse rounded bg-zinc-800" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-800" />
        </div>
      </div>
    </div>
  )
}

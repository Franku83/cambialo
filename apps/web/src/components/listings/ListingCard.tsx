'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Smartphone, Shield, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getListingThumbnail } from '@/lib/cloudinary'
import type { ListingCondition, VerificationStatus } from '@cambialo/types'

export type ViewMode = 'list' | 'grid'

interface SellerInfo {
  username: string
  reputationScore?: number
  totalSales?: number
}

interface ListingCardProps {
  id: string
  coverPhoto?: { cloudinaryUrl: string }
  deviceModel: { brand: string; modelName: string }
  storageGb: number
  color?: string
  priceUsd: number | string
  batteryHealth: number
  condition: ListingCondition
  city?: string | null
  verificationStatus: VerificationStatus
  isBumped?: boolean
  acceptsOffers?: boolean
  seller?: SellerInfo
  viewMode?: ViewMode
}

const CONDITION_MAP: Record<ListingCondition, { label: string; cls: string }> = {
  mint: { label: 'Nuevo',    cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  good: { label: 'Bueno',   cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  fair: { label: 'Regular', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  poor: { label: 'Detalles',cls: 'bg-red-50 text-red-700 border border-red-200' },
}

function BatteryBar({ health }: { health: number }) {
  const color =
    health >= 80 ? '#16a34a' : health >= 60 ? '#d97706' : '#dc2626'
  return (
    <div className="flex items-center gap-1.5">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1" y="3" width="11" height="8" rx="1.5" stroke={color} strokeWidth="1.5" />
        <path d="M12 5.5V8.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <rect x="2.5" y="4.5" width={`${(health / 100) * 8}`} height="5" rx="0.5" fill={color} />
      </svg>
      <span className="text-xs font-medium" style={{ color }}>{health}%</span>
      <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${health}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export function ListingCard({
  id,
  coverPhoto,
  deviceModel,
  storageGb,
  color,
  priceUsd,
  batteryHealth,
  condition,
  city,
  verificationStatus,
  isBumped,
  acceptsOffers,
  seller,
  viewMode = 'list',
}: ListingCardProps) {
  const price = Number(priceUsd)
  const { label: condLabel, cls: condCls } = CONDITION_MAP[condition] ?? CONDITION_MAP.good
  const isVerified = verificationStatus === 'verified'

  const photoUrl = coverPhoto?.cloudinaryUrl
    ? getListingThumbnail(
        coverPhoto.cloudinaryUrl.includes('cloudinary.com')
          ? coverPhoto.cloudinaryUrl.split('/upload/')[1] ?? coverPhoto.cloudinaryUrl
          : coverPhoto.cloudinaryUrl
      )
    : null

  if (viewMode === 'grid') {
    return (
      <Link
        href={`/listings/${id}`}
        className={cn(
          'group relative flex flex-col overflow-hidden rounded-xl border bg-white transition-all duration-200',
          'hover:shadow-md hover:border-slate-300',
          isBumped ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200',
        )}
      >
        {isBumped && (
          <div className="absolute top-0 left-0 right-0 z-10 text-center">
            <span className="inline-block bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-white rounded-b-md">
              ⬆ Destacado
            </span>
          </div>
        )}
        <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={`${deviceModel.brand} ${deviceModel.modelName}`}
              fill
              sizes="(max-width:640px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Smartphone className="h-10 w-10 text-slate-300" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5 p-3">
          <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">
            {deviceModel.brand} {deviceModel.modelName}
            {storageGb ? ` · ${storageGb}GB` : ''}
          </h3>
          <BatteryBar health={batteryHealth} />
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', condCls)}>
              {condLabel}
            </span>
            {isVerified && (
              <span className="verified-badge inline-flex items-center gap-0.5 rounded-full bg-green-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                <Shield className="h-2.5 w-2.5" /> Verif.
              </span>
            )}
          </div>
          <div className="mt-1 flex items-end justify-between">
            <span className="text-base font-bold text-green-600">
              ${price.toLocaleString('es-VE')} USD
            </span>
            {city && (
              <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
                <MapPin className="h-2.5 w-2.5" />{city}
              </span>
            )}
          </div>
          {acceptsOffers && (
            <p className="text-[11px] text-slate-400">Acepta ofertas</p>
          )}
        </div>
      </Link>
    )
  }

  // List mode
  return (
    <Link
      href={`/listings/${id}`}
      className={cn(
        'group relative flex gap-3 rounded-xl border bg-white p-3 transition-all duration-200',
        'hover:shadow-md',
        isBumped
          ? 'border-amber-300 bg-amber-50/20 hover:border-amber-400'
          : 'border-slate-200 hover:border-slate-300 hover:border-l-[3px] hover:border-l-green-500',
      )}
    >
      {isBumped && (
        <div className="absolute -top-px left-3 text-[10px] font-bold text-amber-500">
          ⬆ Destacado
        </div>
      )}

      {/* Foto 96x96 */}
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={`${deviceModel.brand} ${deviceModel.modelName}`}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Smartphone className="h-8 w-8 text-slate-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Título */}
        <h3 className="line-clamp-1 text-[15px] font-semibold text-slate-900">
          {deviceModel.brand} {deviceModel.modelName}
          {storageGb ? ` · ${storageGb}GB` : ''}
          {color ? ` · ${color}` : ''}
        </h3>

        {/* Batería */}
        <BatteryBar health={batteryHealth} />

        {/* Badges: condición + verificado */}
        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', condCls)}>
            {condLabel}
          </span>
          {isVerified ? (
            <span className="verified-badge inline-flex items-center gap-1 rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-semibold text-white">
              <Shield className="h-2.5 w-2.5" /> Verificado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">
              <Clock className="h-2.5 w-2.5" /> Pendiente
            </span>
          )}
          {city && (
            <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
              <MapPin className="h-2.5 w-2.5" />{city}
            </span>
          )}
        </div>

        {/* Vendedor */}
        {seller && (
          <p className="text-[11px] text-slate-400">
            @{seller.username}
            {seller.reputationScore ? ` · ⭐ ${(seller.reputationScore / 20).toFixed(1)}` : ''}
            {seller.totalSales ? ` · ${seller.totalSales} ventas` : ''}
          </p>
        )}
      </div>

      {/* Precio — esquina derecha */}
      <div className="flex shrink-0 flex-col items-end justify-between">
        <span className="text-[17px] font-bold text-green-600">
          ${price.toLocaleString('es-VE')}
        </span>
        <span className="text-[11px] text-slate-400">USD</span>
        {acceptsOffers && (
          <span className="text-[10px] text-slate-400">Ofertas</span>
        )}
      </div>
    </Link>
  )
}

export function ListingCardSkeleton({ viewMode = 'list' }: { viewMode?: ViewMode }) {
  if (viewMode === 'grid') {
    return (
      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="aspect-square w-full skeleton" />
        <div className="flex flex-col gap-2 p-3">
          <div className="h-4 w-3/4 skeleton" />
          <div className="h-3 w-1/2 skeleton" />
          <div className="h-3 w-2/3 skeleton" />
          <div className="h-5 w-1/3 skeleton" />
        </div>
      </div>
    )
  }
  return (
    <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <div className="h-24 w-24 shrink-0 rounded-lg skeleton" />
      <div className="flex flex-1 flex-col gap-2 py-1">
        <div className="h-4 w-3/4 skeleton" />
        <div className="h-3 w-1/2 skeleton" />
        <div className="h-4 w-1/3 skeleton" />
        <div className="h-3 w-2/5 skeleton" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="h-5 w-16 skeleton" />
        <div className="h-3 w-8 skeleton" />
      </div>
    </div>
  )
}

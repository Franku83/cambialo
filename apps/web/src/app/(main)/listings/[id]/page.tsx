import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Shield, Star, Phone, Bookmark } from 'lucide-react'
import { ListingGallery } from '@/components/listings/ListingGallery'
import { SaveButton } from '@/components/listings/SaveButton'
import { ListingCard } from '@/components/listings/ListingCard'
import { formatPrice, generateContactMessage, generateWhatsAppLink } from '@/lib/utils'
import type { ListingCondition, VerificationStatus } from '@cambialo/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface Photo { id: string; cloudinaryUrl: string; width: number | null; height: number | null; isCover: boolean }
interface SafeZone { id: string; name: string; type: string; address: string | null; city: string; googleMapsUrl: string | null; openingHours: Record<string, string> | null }
interface Seller {
  id: string; username: string; fullName: string; avatarUrl: string | null
  reputationScore: number; totalSales: number; isVerifiedSeller: boolean; idVerified: boolean
  whatsappNumber: string | null
}
interface DeviceModel { id: string; brand: string; modelName: string; modelNumber: string }
interface ListingDetail {
  id: string; priceUsd: string; storageGb: number; color: string; batteryHealth: number
  condition: ListingCondition; verificationStatus: VerificationStatus; status: string
  hasIcloudLock: boolean; hasGoogleLock: boolean; hasRepairs: boolean; repairDetails: string | null
  includesBox: boolean; includesCharger: boolean; includesEarphones: boolean
  description: string | null; acceptsOffers: boolean; minOfferUsd: string | null
  city: string | null; state: string | null; meetAtMall: boolean
  isBumped: boolean; viewsCount: number; savesCount: number; isSaved: boolean
  photos: Photo[]; seller: Seller; deviceModel: DeviceModel
}
interface SimilarListing {
  id: string; priceUsd: string; storageGb: number; batteryHealth: number
  condition: ListingCondition; verificationStatus: VerificationStatus; isBumped: boolean
  city: string | null; photos: Photo[]; deviceModel: { brand: string; modelName: string }
}

async function getListing(id: string): Promise<ListingDetail | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/listings/${id}`, { next: { revalidate: 60 } })
    if (!res.ok) return null
    return res.json() as Promise<ListingDetail>
  } catch { return null }
}

async function getSimilar(id: string): Promise<SimilarListing[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/listings/${id}/similar`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    return res.json() as Promise<SimilarListing[]>
  } catch { return [] }
}

async function getSafeZones(id: string): Promise<SafeZone[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/listings/${id}/safe-zones`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    return res.json() as Promise<SafeZone[]>
  } catch { return [] }
}

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const listing = await getListing(id)
  if (!listing) return { title: 'Listing no encontrado' }

  const title = `${listing.deviceModel.brand} ${listing.deviceModel.modelName} ${listing.storageGb}GB — ${formatPrice(Number(listing.priceUsd))}`
  const description = `${listing.condition === 'mint' ? 'Nuevo' : listing.condition === 'good' ? 'Buen estado' : 'En buen estado'} · Batería ${listing.batteryHealth}% · ${listing.city ?? 'Venezuela'} · ${listing.verificationStatus === 'verified' ? 'Verificado ✓' : 'Pendiente'}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: listing.photos[0] ? [{ url: listing.photos[0].cloudinaryUrl }] : [],
      type: 'website',
    },
  }
}

const CONDITION_LABEL: Record<ListingCondition, string> = {
  mint: 'Nuevo', good: 'Buen estado', fair: 'Estado regular', poor: 'Con detalles'
}
const CONDITION_COLOR: Record<ListingCondition, string> = {
  mint: 'bg-emerald-600', good: 'bg-blue-600', fair: 'bg-yellow-600', poor: 'bg-zinc-600'
}
const SAFE_ZONE_TYPE: Record<string, string> = {
  mall: '🏬 Centro Comercial', bank: '🏦 Banco', police: '👮 Comisaría', other: '📍 Otro'
}

function BatteryGauge({ health }: { health: number }) {
  const r = 30, c = 2 * Math.PI * r
  const color = health >= 85 ? '#22c55e' : health >= 70 ? '#eab308' : '#ef4444'
  return (
    <div className="relative h-20 w-20">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 68 68">
        <circle cx="34" cy="34" r={r} fill="none" stroke="#27272a" strokeWidth="5" />
        <circle cx="34" cy="34" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={c} strokeDashoffset={c - (health / 100) * c} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-white">{health}%</span>
        <span className="text-[10px] text-zinc-500">batería</span>
      </div>
    </div>
  )
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params
  const [listing, similar, safeZones] = await Promise.all([
    getListing(id),
    getSimilar(id),
    getSafeZones(id),
  ])

  if (!listing || listing.status !== 'active') notFound()

  const contactMsg = generateContactMessage({
    model: `${listing.deviceModel.brand} ${listing.deviceModel.modelName}`,
    price: Number(listing.priceUsd),
    id: listing.id,
  })
  const whatsappUrl = listing.seller.whatsappNumber
    ? generateWhatsAppLink(listing.seller.whatsappNumber, contactMsg)
    : null

  const accessories = [
    listing.includesBox && 'Caja',
    listing.includesCharger && 'Cargador',
    listing.includesEarphones && 'Auriculares',
  ].filter(Boolean)

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">

        {/* Galería */}
        <ListingGallery photos={listing.photos} alt={`${listing.deviceModel.brand} ${listing.deviceModel.modelName}`} />

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {listing.isBumped && (
                <span className="rounded bg-yellow-500 px-2 py-0.5 text-xs font-bold text-black">↑ TOP</span>
              )}
              {listing.verificationStatus === 'verified' && (
                <span className="flex items-center gap-1 rounded bg-emerald-600/20 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-600/30">
                  <Shield className="h-3 w-3" /> Verificado por Cambialo
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white">
              {listing.deviceModel.brand} {listing.deviceModel.modelName} {listing.storageGb}GB
            </h1>
            <p className="mt-1 text-sm text-zinc-500">{listing.deviceModel.modelNumber} · {listing.color}</p>
          </div>
          <SaveButton listingId={listing.id} initialSaved={listing.isSaved} />
        </div>

        {/* Precio */}
        <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <div>
            <p className="text-3xl font-bold text-white">{formatPrice(Number(listing.priceUsd))}</p>
            {listing.acceptsOffers && listing.minOfferUsd && (
              <p className="text-sm text-zinc-500 mt-0.5">Acepta ofertas desde {formatPrice(Number(listing.minOfferUsd))}</p>
            )}
          </div>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <Phone className="h-4 w-4" />
              Contactar
            </a>
          )}
        </div>

        {/* Estado del equipo */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex flex-col items-center rounded-xl border border-zinc-800 bg-zinc-900 p-4 gap-2">
            <BatteryGauge health={listing.batteryHealth} />
            <p className="text-xs text-zinc-500">Salud batería</p>
          </div>

          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <span className={`rounded-lg px-3 py-1.5 text-sm font-semibold text-white ${CONDITION_COLOR[listing.condition]}`}>
              {CONDITION_LABEL[listing.condition]}
            </span>
            <p className="mt-2 text-xs text-zinc-500">Condición</p>
          </div>

          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xl font-bold text-white">{listing.storageGb} GB</p>
            <p className="mt-1 text-xs text-zinc-500">Almacenamiento</p>
          </div>

          {listing.city && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <MapPin className="h-5 w-5 text-zinc-400 mb-1" />
              <p className="text-sm font-medium text-white text-center">{listing.city}</p>
              {listing.state && <p className="text-xs text-zinc-500">{listing.state}</p>}
            </div>
          )}
        </div>

        {/* Detalles */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
          <h2 className="font-semibold text-white">Detalles del equipo</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">iCloud Lock</span>
              <span className={listing.hasIcloudLock ? 'text-red-400' : 'text-zinc-300'}>{listing.hasIcloudLock ? '⚠️ Sí' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Google Lock</span>
              <span className={listing.hasGoogleLock ? 'text-red-400' : 'text-zinc-300'}>{listing.hasGoogleLock ? '⚠️ Sí' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Reparaciones</span>
              <span className={listing.hasRepairs ? 'text-yellow-400' : 'text-zinc-300'}>{listing.hasRepairs ? 'Sí' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Acepta ofertas</span>
              <span className="text-zinc-300">{listing.acceptsOffers ? 'Sí' : 'No'}</span>
            </div>
          </div>
          {listing.hasRepairs && listing.repairDetails && (
            <p className="text-sm text-zinc-400 border-t border-zinc-800 pt-3">{listing.repairDetails}</p>
          )}
          {accessories.length > 0 && (
            <div className="border-t border-zinc-800 pt-3">
              <p className="text-sm text-zinc-500 mb-1">Incluye:</p>
              <div className="flex gap-2">
                {accessories.map((a) => (
                  <span key={String(a)} className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-300">{String(a)}</span>
                ))}
              </div>
            </div>
          )}
          {listing.description && (
            <p className="border-t border-zinc-800 pt-3 text-sm text-zinc-400">{listing.description}</p>
          )}
        </div>

        {/* Vendedor */}
        <Link
          href={`/profile/${listing.seller.username}`}
          className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700"
        >
          {listing.seller.avatarUrl ? (
            <img src={listing.seller.avatarUrl} alt={listing.seller.fullName} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
              {listing.seller.fullName[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-white truncate">{listing.seller.fullName}</p>
              {listing.seller.idVerified && <Shield className="h-4 w-4 shrink-0 text-blue-400" />}
              {listing.seller.isVerifiedSeller && <Star className="h-4 w-4 shrink-0 text-yellow-400" />}
            </div>
            <p className="text-sm text-zinc-500">@{listing.seller.username}</p>
            <p className="text-xs text-zinc-600 mt-0.5">{listing.seller.totalSales} ventas · Score {listing.seller.reputationScore}/100</p>
          </div>
          <span className="text-zinc-600">›</span>
        </Link>

        {/* Zonas seguras */}
        {safeZones.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-white">Puntos de encuentro seguros</h2>
            <div className="space-y-2">
              {safeZones.map((zone) => (
                <div key={zone.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-white">{zone.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{SAFE_ZONE_TYPE[zone.type] ?? zone.type}</p>
                      {zone.address && <p className="text-xs text-zinc-600 mt-0.5">{zone.address}</p>}
                    </div>
                    {zone.googleMapsUrl && (
                      <a href={zone.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                        className="shrink-0 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors">
                        Ver mapa
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Similares */}
        {similar.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-white">Equipos similares</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {similar.map((item) => (
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
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

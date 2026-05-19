import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Shield, Star } from 'lucide-react'
import { ListingGallery } from '@/components/listings/ListingGallery'
import { SaveButton } from '@/components/listings/SaveButton'
import { ListingCard } from '@/components/listings/ListingCard'
import PriceIndicator from '@/components/listings/PriceIndicator'
import TradeInSimulator from '@/components/listings/TradeInSimulator'
import { formatPrice } from '@/lib/utils'
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
  acceptsTradeIn: boolean
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
  const description = `${listing.condition === 'mint' ? 'Nuevo' : 'Buen estado'} · Batería ${listing.batteryHealth}% · ${listing.city ?? 'Venezuela'} · ${listing.verificationStatus === 'verified' ? 'Verificado ✓' : 'Pendiente'}`
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
const CONDITION_CLS: Record<ListingCondition, string> = {
  mint: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  good: 'bg-blue-50 text-blue-700 border border-blue-200',
  fair: 'bg-amber-50 text-amber-700 border border-amber-200',
  poor: 'bg-red-50 text-red-700 border border-red-200',
}
const SAFE_ZONE_TYPE: Record<string, string> = {
  mall: 'Centro Comercial', bank: 'Banco', police: 'Comisaría', other: 'Punto de encuentro'
}

function BatteryGauge({ health }: { health: number }) {
  const r = 30, c = 2 * Math.PI * r
  const color = health >= 80 ? '#16a34a' : health >= 60 ? '#d97706' : '#dc2626'
  return (
    <div className="relative h-20 w-20">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 68 68">
        <circle cx="34" cy="34" r={r} fill="none" stroke="#e2e8f0" strokeWidth="5" />
        <circle cx="34" cy="34" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={c} strokeDashoffset={c - (health / 100) * c} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-slate-900">{health}%</span>
        <span className="text-[10px] text-slate-400">batería</span>
      </div>
    </div>
  )
}

function WhatsAppButton({ url, responseTime }: { url: string; responseTime?: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex w-full items-center gap-3 rounded-xl px-6 py-4 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(37,211,102,0.3)]"
      style={{ background: '#25D366' }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
      <span className="flex-1 text-base">Contactar por WhatsApp</span>
      {responseTime && (
        <span className="text-sm opacity-85">Responde en {responseTime}</span>
      )}
    </a>
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

  const message = encodeURIComponent(
    `Hola! Vi tu ${listing.deviceModel.modelName} en Cambialo ` +
    `(${CONDITION_LABEL[listing.condition]}, ${listing.batteryHealth}% batería, $${listing.priceUsd}) ` +
    `¿Sigue disponible?`
  )
  const whatsappUrl = listing.seller.whatsappNumber
    ? `https://wa.me/${listing.seller.whatsappNumber}?text=${message}`
    : null

  const accessories = [
    listing.includesBox && 'Caja',
    listing.includesCharger && 'Cargador',
    listing.includesEarphones && 'Auriculares',
  ].filter(Boolean)

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-5">

        {/* Galería */}
        <ListingGallery photos={listing.photos} alt={`${listing.deviceModel.brand} ${listing.deviceModel.modelName}`} />

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {listing.isBumped && (
                <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-white">⬆ Destacado</span>
              )}
              {listing.verificationStatus === 'verified' && (
                <span className="verified-badge inline-flex items-center gap-1 rounded-full bg-green-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                  <Shield className="h-3 w-3" /> Verificado por Cambialo
                </span>
              )}
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CONDITION_CLS[listing.condition]}`}>
                {CONDITION_LABEL[listing.condition]}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {listing.deviceModel.brand} {listing.deviceModel.modelName} {listing.storageGb}GB
            </h1>
            <p className="mt-1 text-sm text-slate-500">{listing.deviceModel.modelNumber} · {listing.color}</p>
          </div>
          <SaveButton listingId={listing.id} initialSaved={listing.isSaved} />
        </div>

        {/* Precio + WhatsApp */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-slate-900">{formatPrice(Number(listing.priceUsd))}</p>
              {listing.acceptsOffers && listing.minOfferUsd && (
                <p className="text-sm text-slate-500 mt-0.5">Acepta ofertas desde {formatPrice(Number(listing.minOfferUsd))}</p>
              )}
            </div>
            <p className="text-xs text-slate-400">{listing.viewsCount} vistas</p>
          </div>
          {whatsappUrl && (
            <WhatsAppButton url={whatsappUrl} responseTime="~2 horas" />
          )}
        </div>

        {/* Estado del equipo */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 gap-2">
            <BatteryGauge health={listing.batteryHealth} />
            <p className="text-xs text-slate-500">Salud batería</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-4">
            <span className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${CONDITION_CLS[listing.condition]}`}>
              {CONDITION_LABEL[listing.condition]}
            </span>
            <p className="mt-2 text-xs text-slate-500">Condición</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xl font-bold text-slate-900">{listing.storageGb} GB</p>
            <p className="mt-1 text-xs text-slate-500">Almacenamiento</p>
          </div>
          {listing.city && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-4">
              <MapPin className="h-5 w-5 text-slate-400 mb-1" />
              <p className="text-sm font-medium text-slate-900 text-center">{listing.city}</p>
              {listing.state && <p className="text-xs text-slate-400">{listing.state}</p>}
            </div>
          )}
        </div>

        {/* Detalles */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
          <h2 className="font-semibold text-slate-900">Detalles del equipo</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">iCloud Lock</span>
              <span className={listing.hasIcloudLock ? 'text-red-600 font-medium' : 'text-slate-600'}>{listing.hasIcloudLock ? '⚠ Sí' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Google Lock</span>
              <span className={listing.hasGoogleLock ? 'text-red-600 font-medium' : 'text-slate-600'}>{listing.hasGoogleLock ? '⚠ Sí' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Reparaciones</span>
              <span className={listing.hasRepairs ? 'text-amber-600 font-medium' : 'text-slate-600'}>{listing.hasRepairs ? 'Sí' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Acepta ofertas</span>
              <span className="text-slate-600">{listing.acceptsOffers ? 'Sí' : 'No'}</span>
            </div>
          </div>
          {listing.hasRepairs && listing.repairDetails && (
            <p className="text-sm text-slate-600 border-t border-slate-100 pt-3">{listing.repairDetails}</p>
          )}
          {accessories.length > 0 && (
            <div className="border-t border-slate-100 pt-3">
              <p className="text-sm text-slate-500 mb-1.5">Incluye:</p>
              <div className="flex gap-2">
                {accessories.map((a) => (
                  <span key={String(a)} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-0.5 text-xs text-slate-600">{String(a)}</span>
                ))}
              </div>
            </div>
          )}
          {listing.description && (
            <p className="border-t border-slate-100 pt-3 text-sm text-slate-600">{listing.description}</p>
          )}
        </div>

        {/* Price indicator */}
        <PriceIndicator
          listingPrice={Number(listing.priceUsd)}
          deviceModelId={listing.deviceModel.id}
          storageGb={listing.storageGb}
        />

        {/* Trade-in */}
        {listing.acceptsTradeIn && (
          <TradeInSimulator
            listingPrice={Number(listing.priceUsd)}
            listingId={listing.id}
            {...(listing.seller.whatsappNumber && { sellerWhatsapp: listing.seller.whatsappNumber })}
          />
        )}

        {/* Vendedor */}
        <Link
          href={`/profile/${listing.seller.username}`}
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-sm"
        >
          {listing.seller.avatarUrl ? (
            <img src={listing.seller.avatarUrl} alt={listing.seller.fullName} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-700">
              {listing.seller.fullName[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-slate-900 truncate">{listing.seller.fullName}</p>
              {listing.seller.idVerified && <Shield className="h-4 w-4 shrink-0 text-green-600" />}
              {listing.seller.isVerifiedSeller && <Star className="h-4 w-4 shrink-0 text-amber-400 fill-amber-400" />}
            </div>
            <p className="text-sm text-slate-500">@{listing.seller.username}</p>
            <p className="text-xs text-slate-400 mt-0.5">{listing.seller.totalSales} ventas · Reputación {listing.seller.reputationScore}/100</p>
          </div>
          <span className="text-slate-300 text-lg">›</span>
        </Link>

        {/* Zonas seguras */}
        {safeZones.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-slate-900">Puntos de encuentro seguros</h2>
            <div className="space-y-2">
              {safeZones.map((zone) => (
                <div key={zone.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{zone.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{SAFE_ZONE_TYPE[zone.type] ?? zone.type} · {zone.city}</p>
                      {zone.address && <p className="text-xs text-slate-400 mt-0.5">{zone.address}</p>}
                    </div>
                    {zone.googleMapsUrl && (
                      <a href={zone.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                        className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors">
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
            <h2 className="font-semibold text-slate-900">Equipos similares</h2>
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
                  viewMode="grid"
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

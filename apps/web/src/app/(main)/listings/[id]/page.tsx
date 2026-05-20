import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Shield, Star, ArrowLeft, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { ListingGallery } from '@/components/listings/ListingGallery'
import { SaveButton } from '@/components/listings/SaveButton'
import { ListingCard } from '@/components/listings/ListingCard'
import PriceIndicator from '@/components/listings/PriceIndicator'
import TradeInSimulator from '@/components/listings/TradeInSimulator'
import { formatPrice } from '@/lib/utils'
import type { ListingCondition, VerificationStatus } from '@cambialo/types'
import WhatsAppButton from '@/components/listings/WhatsAppButton'

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
  distance_km?: number
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
  const description = `${listing.deviceModel.modelName} ${listing.storageGb}GB en ${CONDITION_LABEL[listing.condition]}, batería ${listing.batteryHealth}%, ${formatPrice(Number(listing.priceUsd))} USD. Vendedor verificado en ${listing.city ?? 'Venezuela'}.`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: listing.photos[0] ? [{ url: listing.photos[0].cloudinaryUrl, width: 800, height: 800, alt: title }] : [{ url: '/og-image.png' }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: listing.photos[0] ? [listing.photos[0].cloudinaryUrl] : ['/og-image.png'],
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

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params
  const [listing, similar, safeZones] = await Promise.all([
    getListing(id),
    getSimilar(id),
    getSafeZones(id),
  ])

  const isInactive = ['sold', 'expired', 'removed'].includes(listing?.status ?? '')
  if (!listing || (!isInactive && listing.status !== 'active')) {
    notFound()
  }

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

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${listing.deviceModel.brand} ${listing.deviceModel.modelName} ${listing.storageGb}GB`,
    description: listing.description ?? `${listing.deviceModel.modelName} ${listing.storageGb}GB en ${CONDITION_LABEL[listing.condition]}, batería ${listing.batteryHealth}%`,
    image: listing.photos.map((p) => p.cloudinaryUrl),
    brand: { '@type': 'Brand', name: listing.deviceModel.brand },
    offers: {
      '@type': 'Offer',
      price: listing.priceUsd,
      priceCurrency: 'USD',
      availability: listing.status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Person', name: listing.seller.username },
    },
  }

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-5">

        {/* Back */}
        <Link href="/explore" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Volver al feed
        </Link>

        {/* Galería */}
        <ListingGallery photos={listing.photos} alt={`${listing.deviceModel.brand} ${listing.deviceModel.modelName}`} />

        {/* Status Warning Banners */}
        {listing.status === 'sold' && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 flex items-start gap-4">
            <div className="rounded-full bg-blue-100 p-2.5 text-blue-600 shrink-0">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-blue-950 text-sm">Este equipo ya fue vendido</h3>
              <p className="text-xs text-blue-700 leading-relaxed mt-0.5">
                El vendedor ha marcado esta publicación como vendida. El contacto ha sido desactivado. ¡Busca otros equipos similares a continuación!
              </p>
            </div>
          </div>
        )}

        {listing.status === 'expired' && (
          <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-5 flex items-start gap-4">
            <div className="rounded-full bg-orange-100 p-2.5 text-orange-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-orange-950 text-sm">Esta publicación ha expirado</h3>
              <p className="text-xs text-orange-700 leading-relaxed mt-0.5">
                El tiempo de publicación de este equipo ha finalizado. El contacto con el vendedor está inhabilitado.
              </p>
            </div>
          </div>
        )}

        {listing.status === 'removed' && (
          <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5 flex items-start gap-4">
            <div className="rounded-full bg-red-100 p-2.5 text-red-600 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-red-950 text-sm">Publicación removida por moderación</h3>
              <p className="text-xs text-red-700 leading-relaxed mt-0.5">
                Esta publicación ha sido desactivada permanentemente por infringir las normas de nuestra comunidad.
              </p>
            </div>
          </div>
        )}

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
          {isInactive ? (
            <div className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-200 px-4 py-3 text-sm font-bold text-slate-500 cursor-not-allowed">
              Contacto deshabilitado
            </div>
          ) : (
            whatsappUrl && (
              <WhatsAppButton url={whatsappUrl} listingId={listing.id} responseTime="~2 horas" />
            )
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
        {listing.acceptsTradeIn && !isInactive && (
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
                  {...(item.distance_km !== undefined && { distanceKm: item.distance_km })}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

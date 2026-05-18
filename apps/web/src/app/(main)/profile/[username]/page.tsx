import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Shield, Star, MapPin, Calendar, Package, BadgeCheck, Trophy, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'

interface Props {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  return {
    title: `@${username}`,
    description: `Perfil de vendedor de @${username} en Cambialo`,
  }
}

function ReputationGauge({ score }: { score: number }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const color = score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626'

  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${progress} ${circumference}`} strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900">{score}</span>
        <span className="text-xs text-slate-400">/100</span>
      </div>
    </div>
  )
}

function ReviewStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
      ))}
    </div>
  )
}

type ProfileData = {
  id: string; username: string; full_name: string; avatar_url: string | null
  id_verified: boolean; reputation_score: number; total_sales: number; total_purchases: number
  is_verified_seller: boolean; location_city: string | null; location_state: string | null; created_at: string
}
type ReviewData = {
  id: string; rating: number; comment: string | null; transaction_type: string; created_at: string
  reviewer: { username: string; avatar_url: string | null } | null
}
type ListingData = {
  id: string; price_usd: number; battery_health: number; condition: string; verification_status: string
  city: string | null; is_bumped: boolean
  photos: { cloudinary_url: string; is_cover: boolean; sort_order: number }[]
  device_model: { brand: string; model_name: string } | null
}

function SellerBadge({ type }: { type: 'id' | 'verified' | 'top' | 'new' }) {
  const map = {
    id:       { icon: <Shield className="w-3.5 h-3.5" />, label: 'Identidad Verificada', cls: 'bg-green-50 text-green-700 border border-green-200' },
    verified: { icon: <Star className="w-3.5 h-3.5 fill-current" />, label: 'Vendedor Verificado', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    top:      { icon: <Trophy className="w-3.5 h-3.5" />, label: 'Top Seller', cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
    new:      { icon: <Sparkles className="w-3.5 h-3.5" />, label: 'Nuevo vendedor', cls: 'bg-slate-50 text-slate-600 border border-slate-200' },
  }
  const { icon, label, cls } = map[type]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${cls}`}>
      {icon} {label}
    </span>
  )
}

const conditionLabel: Record<string, string> = {
  mint: 'Nuevo', good: 'Bueno', fair: 'Regular', poor: 'Con detalles',
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await (supabase
    .from('users')
    .select('id, username, full_name, avatar_url, id_verified, reputation_score, total_sales, total_purchases, is_verified_seller, location_city, location_state, created_at')
    .eq('username', username)
    .eq('is_banned', false)
    .single() as unknown as Promise<{ data: ProfileData | null; error: unknown }>)

  if (!profile) notFound()

  const [{ data: reviews }, { data: listings }] = await Promise.all([
    supabase
      .from('reviews')
      .select('id, rating, comment, transaction_type, created_at, reviewer:reviewer_id(username, avatar_url)')
      .eq('reviewed_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5) as unknown as Promise<{ data: ReviewData[] | null; error: unknown }>,
    supabase
      .from('listings')
      .select(`id, price_usd, battery_health, condition, verification_status, city, is_bumped, photos:listing_photos(cloudinary_url, is_cover, sort_order), device_model:device_models(brand, model_name)`)
      .eq('seller_id', profile.id)
      .eq('status', 'active')
      .order('is_bumped', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(6) as unknown as Promise<{ data: ListingData[] | null; error: unknown }>,
  ])

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null

  const joinedDate = new Date(profile.created_at).toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })
  const isTopSeller = profile.total_sales >= 50 && profile.reputation_score >= 90
  const isNew = profile.total_sales < 5

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* Header del perfil */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-start gap-5">
            <div className="relative shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className={`w-20 h-20 rounded-full object-cover ${profile.is_verified_seller ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}
                />
              ) : (
                <div className={`w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-3xl font-bold text-green-700 ${profile.is_verified_seller ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}>
                  {(profile.full_name[0] ?? '?').toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-900 truncate">{profile.full_name}</h1>
              <p className="text-slate-500 text-sm">@{profile.username}</p>

              <div className="flex flex-wrap gap-2 mt-3">
                {profile.id_verified && <SellerBadge type="id" />}
                {profile.is_verified_seller && <SellerBadge type="verified" />}
                {isTopSeller && <SellerBadge type="top" />}
                {isNew && <SellerBadge type="new" />}
              </div>

              <div className="flex flex-wrap gap-3 mt-2">
                {(profile.location_city || profile.location_state) && (
                  <span className="flex items-center gap-1 text-slate-400 text-xs">
                    <MapPin className="w-3 h-3" />
                    {[profile.location_city, profile.location_state].filter(Boolean).join(', ')}
                  </span>
                )}
                <span className="flex items-center gap-1 text-slate-400 text-xs">
                  <Calendar className="w-3 h-3" />
                  Miembro desde {joinedDate}
                </span>
              </div>
            </div>
          </div>

          {/* Stats + Gauge */}
          <div className="mt-6 flex items-center gap-6">
            <ReputationGauge score={profile.reputation_score} />
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-slate-900">{profile.total_sales}</p>
                <p className="text-xs text-slate-400">Ventas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{profile.total_purchases}</p>
                <p className="text-xs text-slate-400">Compras</p>
              </div>
              {avgRating !== null && (
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <ReviewStars rating={Math.round(avgRating)} />
                    <span className="text-sm font-semibold text-slate-700">{avgRating.toFixed(1)}</span>
                    <span className="text-xs text-slate-400">({reviews?.length} reseñas)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Listings activos */}
        {listings && listings.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                Publicaciones activas
              </h2>
              <span className="text-xs text-slate-400">{listings.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {listings.map((listing) => {
                const coverPhoto = listing.photos?.find((p) => p.is_cover) ?? listing.photos?.[0]
                const deviceName = listing.device_model
                  ? `${listing.device_model.brand} ${listing.device_model.model_name}`
                  : 'Dispositivo'

                return (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 hover:shadow-sm transition-all"
                  >
                    <div className="aspect-square bg-slate-100 relative">
                      {coverPhoto && (
                        <img
                          src={coverPhoto.cloudinary_url}
                          alt={deviceName}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {listing.is_bumped && (
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-amber-400 text-white text-[10px] font-bold">
                          ⬆ TOP
                        </span>
                      )}
                      {listing.verification_status === 'verified' && (
                        <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-green-600 text-white text-[10px] font-bold flex items-center gap-0.5">
                          <Shield className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-slate-600 truncate font-medium">{deviceName}</p>
                      <p className="text-sm font-bold text-green-600 mt-0.5">
                        {formatPrice(Number(listing.price_usd))}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-slate-400">{listing.battery_health}% bat.</span>
                        <span className="text-xs text-slate-400">{conditionLabel[listing.condition] ?? listing.condition}</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Reviews */}
        {reviews && reviews.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-3">
              Reseñas recientes
            </h2>
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500 font-medium">
                        {(review.reviewer as { username?: string })?.username?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <span className="text-sm text-slate-700">
                        @{(review.reviewer as { username?: string })?.username ?? 'usuario'}
                      </span>
                    </div>
                    <ReviewStars rating={review.rating} />
                  </div>
                  {review.comment && (
                    <p className="text-sm text-slate-600">{review.comment}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1.5">
                    {new Date(review.created_at).toLocaleDateString('es-VE')}
                    {' · '}
                    {review.transaction_type === 'buy' ? 'Como comprador' : 'Como vendedor'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {listings?.length === 0 && reviews?.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Este vendedor aún no tiene actividad</p>
          </div>
        )}
      </div>
    </div>
  )
}

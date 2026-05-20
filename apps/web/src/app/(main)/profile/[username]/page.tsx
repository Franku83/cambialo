import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Shield, Star, MapPin, Calendar, Trophy, Sparkles, Instagram, Twitter, Globe, Edit, Crown, Package, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'

interface Props {
  params: Promise<{ username: string }>
  searchParams: Promise<{ tab?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  return {
    title: `@${username} | Cambialo`,
    description: `Perfil de @${username} en Cambialo — marketplace de smartphones verificados en Venezuela`,
  }
}

function ReputationGauge({ score }: { score: number }) {
  const r = 40, c = 2 * Math.PI * r
  const color = score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626'
  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${(score / 100) * c} ${c}`} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-slate-900">{score}</span>
        <span className="text-[10px] text-slate-400">/100</span>
      </div>
    </div>
  )
}

function ReviewStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
      ))}
    </div>
  )
}

type ProfileData = {
  id: string; username: string; full_name: string; avatar_url: string | null
  id_verified: boolean; reputation_score: number; total_sales: number; total_purchases: number
  is_verified_seller: boolean; location_city: string | null; location_state: string | null
  created_at: string; bio: string | null; instagram: string | null; twitter: string | null
  tiktok: string | null; website: string | null; whatsapp_number: string | null; whatsapp_public: boolean
}
type ReviewData = {
  id: string; rating: number; comment: string | null; transaction_type: string; created_at: string
  reviewer: { username: string; avatar_url: string | null } | null
}
type ListingData = {
  id: string; price_usd: number; battery_health: number; condition: string; verification_status: string; status: string
  city: string | null; is_bumped: boolean
  photos: { cloudinary_url: string; is_cover: boolean }[]
  device_model: { brand: string; model_name: string } | null
}
type RoleData = { role: string }

const conditionLabel: Record<string, string> = {
  mint: 'Nuevo', good: 'Bueno', fair: 'Regular', poor: 'Con detalles',
}

export default async function PublicProfilePage({ params, searchParams }: Props) {
  const { username } = await params
  const tab = (await searchParams).tab || 'activos'
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  const { data: profile } = await (supabase
    .from('users')
    .select('id, username, full_name, avatar_url, id_verified, reputation_score, total_sales, total_purchases, is_verified_seller, location_city, location_state, created_at, bio, instagram, twitter, tiktok, website, whatsapp_number, whatsapp_public')
    .eq('username', username)
    .eq('is_banned', false)
    .single() as unknown as Promise<{ data: ProfileData | null }>)

  if (!profile) notFound()

  const isOwnProfile = authUser?.id != null && (
    await supabase.from('users').select('id').eq('id', authUser.id).eq('username', username).single()
  ).data != null

  // Roles del perfil para badges
  const { data: profileRoles } = await (supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', profile.id) as unknown as Promise<{ data: RoleData[] | null }>)

  const isOwner = profileRoles?.some(r => r.role === 'owner') ?? false
  const isAdmin = profileRoles?.some(r => r.role === 'admin') ?? false

  const [{ data: reviews }, { data: listings }] = await Promise.all([
    supabase
      .from('reviews')
      .select('id, rating, comment, transaction_type, created_at, reviewer:reviewer_id(username, avatar_url)')
      .eq('reviewed_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5) as unknown as Promise<{ data: ReviewData[] | null }>,
    supabase
      .from('listings')
      .select('id, price_usd, battery_health, condition, verification_status, status, city, is_bumped, photos:listing_photos(cloudinary_url, is_cover), device_model:device_models(brand, model_name)')
      .eq('seller_id', profile.id)
      .in('status', ['active', 'sold'])
      .order('is_bumped', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50) as unknown as Promise<{ data: ListingData[] | null }>,
  ])

  const avgRating = reviews?.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null
  const isTopSeller = profile.total_sales >= 50 && profile.reputation_score >= 90
  const isNew = profile.total_sales < 5
  const joinedDate = new Date(profile.created_at).toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })

  const activeListings = listings?.filter(l => l.status === 'active') || []
  const soldListings = listings?.filter(l => l.status === 'sold') || []
  const displayedListings = tab === 'vendidos' ? soldListings : activeListings

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* Card principal */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {/* Banner */}
          <div className="h-24 bg-gradient-to-r from-green-500 to-emerald-600" />

          <div className="px-6 pb-6">
            {/* Avatar + edit */}
            <div className="flex items-end justify-between -mt-10 mb-4">
              <div className="relative">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name}
                    className={`w-20 h-20 rounded-full object-cover border-4 border-white ${profile.is_verified_seller ? 'ring-2 ring-amber-400' : ''}`} />
                ) : (
                  <div className={`w-20 h-20 rounded-full bg-green-100 border-4 border-white flex items-center justify-center text-3xl font-bold text-green-700 ${profile.is_verified_seller ? 'ring-2 ring-amber-400' : ''}`}>
                    {(profile.full_name[0] ?? '?').toUpperCase()}
                  </div>
                )}
                {profile.id_verified && (
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-600 border-2 border-white">
                    <Shield className="h-3 w-3 text-white" />
                  </span>
                )}
              </div>

              {isOwnProfile && (
                <Link href="/profile/edit"
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  <Edit className="h-3.5 w-3.5" /> Editar perfil
                </Link>
              )}
            </div>

            {/* Nombre y username */}
            <div className="mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{profile.full_name}</h1>
                {isOwner && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                    <Crown className="h-3 w-3" /> Owner
                  </span>
                )}
                {!isOwner && isAdmin && (
                  <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700">Admin</span>
                )}
              </div>
              <p className="text-slate-500 text-sm">@{profile.username}</p>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">{profile.bio}</p>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {profile.is_verified_seller && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  <Star className="w-3.5 h-3.5 fill-current" /> Vendedor Verificado
                </span>
              )}
              {profile.id_verified && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                  <Shield className="w-3.5 h-3.5" /> Identidad Verificada
                </span>
              )}
              {isTopSeller && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  <Trophy className="w-3.5 h-3.5" /> Top Seller
                </span>
              )}
              {isNew && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  <Sparkles className="w-3.5 h-3.5" /> Nuevo vendedor
                </span>
              )}
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-400 mb-4">
              {(profile.location_city || profile.location_state) && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {[profile.location_city, profile.location_state].filter(Boolean).join(', ')}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Miembro desde {joinedDate}
              </span>
            </div>

            {/* Redes sociales */}
            {(profile.instagram || profile.twitter || profile.tiktok || profile.website || (profile.whatsapp_number && profile.whatsapp_public)) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.instagram && (
                  <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-pink-300 hover:text-pink-600 transition-colors">
                    <Instagram className="h-3.5 w-3.5" /> @{profile.instagram}
                  </a>
                )}
                {profile.twitter && (
                  <a href={`https://x.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-sky-300 hover:text-sky-600 transition-colors">
                    <Twitter className="h-3.5 w-3.5" /> @{profile.twitter}
                  </a>
                )}
                {profile.tiktok && (
                  <a href={`https://tiktok.com/@${profile.tiktok}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-400 transition-colors">
                    <span className="text-xs font-bold">TT</span> @{profile.tiktok}
                  </a>
                )}
                {profile.website && (
                  <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-green-300 hover:text-green-600 transition-colors">
                    <Globe className="h-3.5 w-3.5" /> Sitio web
                  </a>
                )}
                {profile.whatsapp_number && profile.whatsapp_public && (
                  <a href={`https://wa.me/${profile.whatsapp_number.replace(/\D/g, '')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors">
                    📲 WhatsApp
                  </a>
                )}
              </div>
            )}

            {/* Stats inline */}
            <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
              {[
                { label: 'Ventas', value: profile.total_sales },
                { label: 'Compras', value: profile.total_purchases },
                { label: 'Reputación', value: `${profile.reputation_score}/100` },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-lg font-bold text-slate-900">{s.value}</p>
                  <p className="text-xs text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reputación gauge + rating */}
        {avgRating !== null && (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
              <ReputationGauge score={profile.reputation_score} />
              <p className="mt-2 text-xs text-slate-400">Score de reputación</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center flex flex-col items-center justify-center gap-1">
              <p className="text-4xl font-bold text-slate-900">{avgRating.toFixed(1)}</p>
              <ReviewStars rating={Math.round(avgRating)} />
              <p className="text-xs text-slate-400">{reviews!.length} reseña{reviews!.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        )}

        {/* Listings Section */}
        {listings && listings.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-6">
              <Link
                href={`/profile/${username}?tab=activos`}
                scroll={false}
                className={`flex-1 pb-3 text-center text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  tab === 'activos'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Package className="h-4 w-4" />
                Activos ({activeListings.length})
              </Link>
              <Link
                href={`/profile/${username}?tab=vendidos`}
                scroll={false}
                className={`flex-1 pb-3 text-center text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  tab === 'vendidos'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                Vendidos ({soldListings.length})
              </Link>
            </div>

            {displayedListings.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                {tab === 'vendidos'
                  ? 'Aún no hay equipos vendidos por este usuario.'
                  : 'Aún no hay equipos activos en venta.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {displayedListings.map(l => {
                  const cover = l.photos?.find(p => p.is_cover) ?? l.photos?.[0]
                  return (
                    <Link key={l.id} href={`/listings/${l.id}`}
                      className="group overflow-hidden rounded-xl border border-slate-200 hover:border-green-400 hover:shadow-sm transition-all relative">
                      <div className="relative aspect-square bg-slate-100 overflow-hidden">
                        {cover ? (
                          <img src={cover.cloudinary_url} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-3xl">📱</div>
                        )}
                        {l.is_bumped && (
                          <span className="absolute top-1.5 left-1.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-white">⬆</span>
                        )}
                        {l.verification_status === 'verified' && (
                          <span className="absolute top-1.5 right-1.5 rounded-full bg-green-600 px-1.5 py-0.5 text-[10px] font-bold text-white">🛡</span>
                        )}
                        {l.status === 'sold' && (
                          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-[0.5px]">
                            <span className="rounded bg-green-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                              Vendido
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-[11px] text-slate-400">{l.device_model?.brand} {l.device_model?.model_name}</p>
                        <p className="text-sm font-bold text-slate-900">{formatPrice(Number(l.price_usd))}</p>
                        <p className="text-[10px] text-slate-400">{conditionLabel[l.condition] ?? l.condition} · {l.battery_health}%</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Reseñas */}
        {reviews && reviews.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 font-semibold text-slate-900">Reseñas recientes</h2>
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r.id} className="flex gap-3">
                  {r.reviewer?.avatar_url ? (
                    <img src={r.reviewer.avatar_url} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-500">
                      {r.reviewer?.username[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-900">@{r.reviewer?.username ?? 'Usuario'}</span>
                      <ReviewStars rating={r.rating} />
                      <span className="text-xs text-slate-400">{r.transaction_type === 'buy' ? 'Comprador' : 'Vendedor'}</span>
                    </div>
                    {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
                    <p className="mt-0.5 text-xs text-slate-400">
                      {new Date(r.created_at).toLocaleDateString('es-VE')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sin actividad */}
        {(!listings || listings.length === 0) && (!reviews || reviews.length === 0) && (
          <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center">
            <p className="text-slate-400">Este vendedor aún no tiene actividad</p>
          </div>
        )}

      </div>
    </div>
  )
}

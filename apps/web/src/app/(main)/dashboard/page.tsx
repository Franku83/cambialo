import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ShoppingBag, TrendingUp, Award, Layers, ShieldCheck, Crown } from 'lucide-react'
import Link from 'next/link'
import MyListingsPanel from '@/components/dashboard/MyListingsPanel'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  const user = session.user

  type ProfileRow = {
    username: string; full_name: string; avatar_url: string | null
    reputation_score: number; total_sales: number; total_purchases: number
    is_verified_seller: boolean; id_verified: boolean
  }

  const { data: profile } = await (supabase
    .from('users')
    .select('username, full_name, avatar_url, reputation_score, total_sales, total_purchases, is_verified_seller, id_verified')
    .eq('id', user.id)
    .single() as unknown as Promise<{ data: ProfileRow | null; error: unknown }>)

  const { data: roles } = await (supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id) as unknown as Promise<{ data: { role: string }[] | null; error: unknown }>)

  const isAdmin = roles?.some(r => r.role === 'admin' || r.role === 'owner') ?? false
  const isOwner = roles?.some(r => r.role === 'owner') ?? false

  const { count: activeListings } = await (supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', user.id)
    .eq('status', 'active') as unknown as Promise<{ count: number | null; data: null; error: unknown }>)

  // Fetch KYC status
  const kycRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/v1/kyc/status`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: 'no-store',
  }).catch(() => null)
  const kycData = kycRes?.ok ? await kycRes.json() as { status: string; rejectionReason?: string } : null
  const kycStatus = kycData?.status ?? 'none'
  const rejectionReason = kycData?.rejectionReason

  const stats = [
    { label: 'Ventas',           value: profile?.total_sales ?? 0,      icon: TrendingUp,  iconCls: 'text-green-600',  bgCls: 'bg-green-50' },
    { label: 'Compras',          value: profile?.total_purchases ?? 0,   icon: ShoppingBag, iconCls: 'text-blue-600',   bgCls: 'bg-blue-50' },
    { label: 'Reputación',       value: `${profile?.reputation_score ?? 0}/100`, icon: Award, iconCls: 'text-amber-600', bgCls: 'bg-amber-50' },
    { label: 'Listings Activos', value: activeListings ?? 0,             icon: Layers,      iconCls: 'text-purple-600', bgCls: 'bg-purple-50' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                ¡Hola, {profile?.full_name?.split(' ')[0] ?? profile?.username ?? 'Usuario'}!
              </h1>
              {isOwner && (
                <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                  <Crown className="h-3 w-3" /> Owner
                </span>
              )}
              {!isOwner && isAdmin && (
                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700">Admin</span>
              )}
            </div>
            {profile?.username && (
              <p className="mt-0.5 text-sm text-slate-400">@{profile.username}</p>
            )}
            <p className="mt-1 text-sm text-slate-500">Resumen de tu actividad</p>
          </div>
          {profile?.avatar_url && (
            <img src={profile.avatar_url} alt="avatar" className="h-12 w-12 rounded-full object-cover border-2 border-slate-200" />
          )}
        </div>

        {/* KYC Status Banner */}
        {kycStatus !== 'approved' && (
          <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-5 transition-all shadow-sm ${
              kycStatus === 'rejected'
                ? 'border-red-200 bg-red-55/30 bg-red-50 text-red-900'
                : kycStatus === 'pending'
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-green-200 bg-green-50 text-green-950'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm sm:text-base">
                {kycStatus === 'rejected' && '❌ Tu verificación fue rechazada'}
                {kycStatus === 'pending' && '⏳ Tu verificación está en revisión'}
                {kycStatus === 'none' && '🔒 Verifica tu identidad y publica con más confianza'}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-normal">
                {kycStatus === 'rejected' && (rejectionReason || 'Tus documentos no cumplen con los requisitos de legibilidad o validez.')}
                {kycStatus === 'pending' && 'Estamos revisando tu información. Te notificaremos pronto.'}
                {kycStatus === 'none' && 'Obtén el badge verificado, mayor visibilidad y publica hasta 10 listings.'}
              </p>
            </div>
            {kycStatus !== 'pending' && (
              <Link
                href="/kyc"
                className={`shrink-0 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-[0.98] text-center ${
                  kycStatus === 'rejected'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {kycStatus === 'rejected' ? 'Reintentar verificación' : 'Verificar ahora — tarda 5 minutos'}
              </Link>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className={`inline-flex rounded-xl p-2.5 ${s.bgCls} mb-3`}>
                <s.icon className={`h-5 w-5 ${s.iconCls}`} />
              </div>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Seller listings panel component */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <MyListingsPanel authToken={session.access_token} />
        </div>

        {/* Nav links */}
        <div className="flex flex-wrap gap-2">
          {[
            { href: '/dashboard/listings', label: 'Mis listings' },
            { href: '/dashboard/reviews', label: 'Mis reseñas' },
            { href: '/dashboard/alerts', label: 'Alertas de búsqueda' },
            ...(profile?.username ? [{ href: `/profile/${profile.username}`, label: 'Ver mi perfil' }] : []),
          ].map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50">
              {l.label}
            </Link>
          ))}
        </div>

        {/* Admin panel — solo para admin/owner */}
        {isAdmin && (
          <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-purple-900">
              <ShieldCheck className="h-4 w-4" /> Panel de administración
            </h2>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/users" className="rounded-lg border border-purple-200 bg-white px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100 transition-colors">
                Gestión de usuarios
              </Link>
              <Link href="/admin/moderation" className="rounded-lg border border-purple-200 bg-white px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100 transition-colors">
                Cola de moderación
              </Link>
              <Link href="/admin/kyc" className="rounded-lg border border-purple-200 bg-white px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100 transition-colors">
                Verificaciones KYC
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

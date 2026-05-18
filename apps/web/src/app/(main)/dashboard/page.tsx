import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ShoppingBag, TrendingUp, Award, Layers, PlusCircle, List, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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

  const { count: activeListings } = await (supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', user.id)
    .eq('status', 'active') as unknown as Promise<{ count: number | null; data: null; error: unknown }>)

  const stats = [
    { label: 'Ventas',           value: profile?.total_sales ?? 0,      icon: TrendingUp,  iconCls: 'text-green-600',  bgCls: 'bg-green-50' },
    { label: 'Compras',          value: profile?.total_purchases ?? 0,   icon: ShoppingBag, iconCls: 'text-blue-600',   bgCls: 'bg-blue-50' },
    { label: 'Reputación',       value: `${profile?.reputation_score ?? 0}/100`, icon: Award, iconCls: 'text-amber-600', bgCls: 'bg-amber-50' },
    { label: 'Listings Activos', value: activeListings ?? 0,             icon: Layers,      iconCls: 'text-purple-600', bgCls: 'bg-purple-50' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            ¡Hola, {profile?.full_name?.split(' ')[0] ?? 'Usuario'}!
          </h1>
          <p className="mt-1 text-sm text-slate-500">Resumen de tu actividad</p>
        </div>

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

        {/* Quick actions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Acciones rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/sell"
              className="group flex items-center gap-4 rounded-xl border border-slate-200 p-4 transition-all hover:border-green-300 hover:bg-green-50"
            >
              <div className="rounded-lg bg-green-50 p-3 group-hover:bg-green-100 transition-colors">
                <PlusCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Publicar equipo</p>
                <p className="text-xs text-slate-500 mt-0.5">Empieza a vender hoy mismo</p>
              </div>
            </Link>

            <Link
              href="/dashboard/listings"
              className="group flex items-center gap-4 rounded-xl border border-slate-200 p-4 transition-all hover:border-slate-300 hover:bg-slate-50"
            >
              <div className="rounded-lg bg-slate-100 p-3 group-hover:bg-slate-200 transition-colors">
                <List className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Mis listings</p>
                <p className="text-xs text-slate-500 mt-0.5">Gestiona tus publicaciones</p>
              </div>
            </Link>

            <Link
              href="/verify-identity"
              className="group flex items-center gap-4 rounded-xl border border-slate-200 p-4 transition-all hover:border-green-300 hover:bg-green-50"
            >
              <div className="rounded-lg bg-green-50 p-3 group-hover:bg-green-100 transition-colors">
                <ShieldCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Verificar identidad</p>
                <p className="text-xs text-slate-500 mt-0.5">Aumenta tu reputación</p>
              </div>
            </Link>
          </div>
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
      </div>
    </div>
  )
}

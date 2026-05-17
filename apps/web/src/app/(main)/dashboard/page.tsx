// apps/web/src/app/(main)/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { 
  ShoppingBag, 
  TrendingUp, 
  Award, 
  Layers, 
  PlusCircle, 
  List, 
  ShieldCheck 
} from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  type ProfileRow = { username: string; full_name: string; avatar_url: string | null; reputation_score: number; total_sales: number; total_purchases: number; is_verified_seller: boolean; id_verified: boolean }

  // Fetch profile
  const { data: profile } = await (supabase
    .from('users')
    .select('username, full_name, avatar_url, reputation_score, total_sales, total_purchases, is_verified_seller, id_verified')
    .eq('id', user.id)
    .single() as unknown as Promise<{ data: ProfileRow | null; error: unknown }>)

  // Fetch active listings count
  const { count: activeListings } = await (supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', user.id)
    .eq('status', 'active') as unknown as Promise<{ count: number | null; data: null; error: unknown }>)

  const stats = [
    {
      label: 'Ventas',
      value: profile?.total_sales || 0,
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Compras',
      value: profile?.total_purchases || 0,
      icon: ShoppingBag,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Score',
      value: `${profile?.reputation_score || 0}%`,
      icon: Award,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Listings Activos',
      value: activeListings || 0,
      icon: Layers,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-white">
          ¡Hola, {profile?.full_name?.split(' ')[0] || 'Usuario'}! 👋
        </h1>
        <p className="text-zinc-400">
          Este es el resumen de tu actividad hoy.
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <p className="text-zinc-400 text-sm font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link 
            href="/sell" 
            className="flex items-center gap-4 p-4 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-blue-600 transition-colors group"
          >
            <div className="p-3 bg-blue-600/10 rounded-lg group-hover:bg-blue-600 transition-colors">
              <PlusCircle className="w-6 h-6 text-blue-600 group-hover:text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">Publicar equipo</p>
              <p className="text-xs text-zinc-500">Empieza a vender hoy mismo</p>
            </div>
          </Link>

          <Link 
            href="/dashboard/listings" 
            className="flex items-center gap-4 p-4 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors group"
          >
            <div className="p-3 bg-zinc-800 rounded-lg group-hover:bg-zinc-700 transition-colors">
              <List className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">Ver mis listings</p>
              <p className="text-xs text-zinc-500">Gestiona tus publicaciones</p>
            </div>
          </Link>

          <Link 
            href="/verify-identity" 
            className="flex items-center gap-4 p-4 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-emerald-600 transition-colors group"
          >
            <div className="p-3 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500 transition-colors">
              <ShieldCheck className="w-6 h-6 text-emerald-500 group-hover:text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">Verificar identidad</p>
              <p className="text-xs text-zinc-500">Aumenta tu reputación</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

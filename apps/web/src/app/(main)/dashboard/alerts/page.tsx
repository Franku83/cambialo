import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { Bell, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { DeleteAlertButton } from './DeleteAlertButton'

export const metadata: Metadata = { title: 'Mis alertas de búsqueda' }

interface SearchAlert {
  id: string; brand: string | null; model_name: string | null
  max_price_usd: number | null; min_battery: number | null
  city: string | null; is_active: boolean; created_at: string
}

export default async function AlertsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/dashboard/alerts')

  const { data: alerts } = await (supabase
    .from('search_alerts')
    .select('id, brand, model_name, max_price_usd, min_battery, city, is_active, created_at')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false }) as unknown as Promise<{ data: SearchAlert[] | null; error: unknown }>)

  const list = alerts ?? []

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Alertas de búsqueda</h1>
            <p className="mt-1 text-sm text-zinc-500">Te avisamos cuando aparezca un equipo que te interese</p>
          </div>
          <a
            href="/dashboard/alerts/new"
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nueva alerta
          </a>
        </div>

        {list.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-12 text-center">
            <Bell className="mx-auto mb-3 h-10 w-10 text-zinc-700" />
            <p className="text-zinc-500">No tienes alertas activas</p>
            <p className="mt-1 text-xs text-zinc-600">Crea una para recibir notificaciones de nuevos equipos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-semibold text-white">
                    {[alert.brand, alert.model_name].filter(Boolean).join(' ') || 'Cualquier modelo'}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                    {alert.max_price_usd && <span>Máx ${alert.max_price_usd}</span>}
                    {alert.min_battery && <span>🔋 ≥{alert.min_battery}%</span>}
                    {alert.city && <span>📍 {alert.city}</span>}
                  </div>
                </div>
                <DeleteAlertButton alertId={alert.id} onDeleted={() => {}} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

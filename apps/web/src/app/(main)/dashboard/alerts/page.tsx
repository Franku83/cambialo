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
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Alertas de búsqueda</h1>
            <p className="mt-1 text-sm text-slate-500">Te avisamos cuando aparezca un equipo que te interese</p>
          </div>
          <a
            href="/dashboard/alerts/new"
            className="flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            Nueva alerta
          </a>
        </div>

        {list.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <Bell className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-slate-500">No tienes alertas activas</p>
            <p className="mt-1 text-xs text-slate-400">Crea una para recibir notificaciones de nuevos equipos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-semibold text-slate-900">
                    {[alert.brand, alert.model_name].filter(Boolean).join(' ') || 'Cualquier modelo'}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                    {alert.max_price_usd && <span>Máx ${alert.max_price_usd}</span>}
                    {alert.min_battery && <span>Bat. ≥{alert.min_battery}%</span>}
                    {alert.city && <span>{alert.city}</span>}
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

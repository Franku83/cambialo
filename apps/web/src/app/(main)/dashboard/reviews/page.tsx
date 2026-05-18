import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export const metadata: Metadata = { title: 'Mis reseñas' }

interface Review {
  id: string; rating: number; comment: string | null; transaction_type: string; created_at: string
  reviewer: { username: string; avatar_url: string | null } | null
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`w-4 h-4 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
      ))}
    </div>
  )
}

export default async function DashboardReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/dashboard/reviews')

  const { data: reviews } = await (supabase
    .from('reviews')
    .select('id, rating, comment, transaction_type, created_at, reviewer:reviewer_id(username, avatar_url)')
    .eq('reviewed_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20) as unknown as Promise<{ data: Review[] | null; error: unknown }>)

  const list = reviews ?? []
  const avgRating = list.length > 0 ? (list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1) : null

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mis reseñas</h1>
          {avgRating && (
            <div className="mt-2 flex items-center gap-2">
              <Stars rating={Math.round(Number(avgRating))} />
              <span className="text-slate-500 text-sm">{avgRating} promedio · {list.length} reseña{list.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {list.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
            <Star className="mx-auto mb-3 h-10 w-10 opacity-30" />
            <p>Aún no tienes reseñas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-600 font-medium">
                      {r.reviewer?.username?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span className="text-sm text-slate-700">@{r.reviewer?.username ?? 'usuario'}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${r.transaction_type === 'buy' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                      {r.transaction_type === 'buy' ? 'Comprador' : 'Vendedor'}
                    </span>
                  </div>
                  <Stars rating={r.rating} />
                </div>
                {r.comment && <p className="text-sm text-slate-600">{r.comment}</p>}
                <p className="text-xs text-slate-400">
                  {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: es })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

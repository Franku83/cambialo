import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Eye, Heart, ShieldCheck, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cn, formatPrice } from '@/lib/utils'

export default async function MyListingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/dashboard/listings')

  const { data: rawListings } = await supabase
    .from('listings')
    .select(`id, status, price_usd, views_count, saves_count, verification_status, created_at,
       device_model:device_models(brand, model_name),
       photos:listing_photos(cloudinary_url, is_cover)`)
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  const listings = (rawListings ?? []) as Array<{
    id: string; status: string; price_usd: number; views_count: number; saves_count: number
    verification_status: string; created_at: string
    device_model: { brand: string; model_name: string } | null
    photos: { cloudinary_url: string; is_cover: boolean }[]
  }>

  const STATUS: Record<string, { label: string; cls: string }> = {
    active:  { label: 'Activo',    cls: 'bg-green-50 text-green-700 border border-green-200' },
    draft:   { label: 'Borrador',  cls: 'bg-slate-100 text-slate-500 border border-slate-200' },
    paused:  { label: 'Pausado',   cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    sold:    { label: 'Vendido',   cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
    expired: { label: 'Expirado',  cls: 'bg-red-50 text-red-700 border border-red-200' },
    removed: { label: 'Eliminado', cls: 'bg-slate-100 text-slate-400 border border-slate-200' },
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Mis listings</h1>
              <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-bold text-slate-500">
                {listings.length}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">Gestiona tus equipos publicados</p>
          </div>
          <Link
            href="/sell"
            className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            Publicar equipo
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h3 className="text-lg font-bold text-slate-900">Aún no tienes publicaciones</h3>
            <p className="mt-1 text-sm text-slate-500">Publica tu primer equipo y empieza a vender</p>
            <Link
              href="/sell"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              Empezar a vender
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => {
              const cover = listing.photos?.find((p) => p.is_cover) ?? listing.photos?.[0]
              const status = STATUS[listing.status] ?? STATUS['draft']!
              return (
                <div key={listing.id} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-sm">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {cover ? (
                      <img src={cover.cloudinary_url} alt={listing.device_model?.model_name ?? 'Foto'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-6 w-6 text-slate-300" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {listing.device_model ? `${listing.device_model.brand} ${listing.device_model.model_name}` : 'Dispositivo'}
                      </p>
                      <span className={cn('flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase', status.cls)}>
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-base font-bold text-green-600">{formatPrice(Number(listing.price_usd))}</p>
                    <div className="mt-1.5 flex items-center gap-4 text-xs text-slate-400">
                      {listing.verification_status === 'verified' && (
                        <span className="flex items-center gap-1 text-green-600">
                          <ShieldCheck className="h-3 w-3" /> Verificado
                        </span>
                      )}
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {listing.views_count ?? 0}</span>
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {listing.saves_count ?? 0}</span>
                      <span>{new Date(listing.created_at).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 gap-2">
                    <Link href={`/listings/${listing.id}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50">
                      Ver
                    </Link>
                    {listing.status !== 'sold' && listing.status !== 'removed' && (
                      <Link href={`/sell?edit=${listing.id}`} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200">
                        Editar
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

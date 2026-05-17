import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Eye, Heart, ShieldCheck, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cn, formatPrice } from '@/lib/utils'

export default async function MyListingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirectTo=/dashboard/listings')

  const { data: rawListings } = await supabase
    .from('listings')
    .select(
      `id, status, price_usd, views_count, saves_count, verification_status, created_at,
       device_model:device_models(brand, model_name),
       photos:listing_photos(cloudinary_url, is_cover)`,
    )
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  // Cast to any[] to avoid Supabase stub type issues
  const listings = (rawListings ?? []) as Array<{
    id: string
    status: string
    price_usd: number
    views_count: number
    saves_count: number
    verification_status: string
    created_at: string
    device_model: { brand: string; model_name: string } | null
    photos: { cloudinary_url: string; is_cover: boolean }[]
  }>

  const STATUS: Record<string, { label: string; cls: string }> = {
    active:  { label: 'Activo',    cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    draft:   { label: 'Borrador',  cls: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
    paused:  { label: 'Pausado',   cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    sold:    { label: 'Vendido',   cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    expired: { label: 'Expirado',  cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
    removed: { label: 'Eliminado', cls: 'bg-zinc-800 text-zinc-500 border-zinc-700' },
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Mis listings</h1>
              <span className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-0.5 text-xs font-bold text-zinc-400">
                {listings.length}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-500">Gestiona tus equipos publicados</p>
          </div>

          <Link
            href="/sell"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Publicar equipo
          </Link>
        </div>

        {/* Empty state */}
        {listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-16 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-zinc-700" />
            <h3 className="text-lg font-bold text-white">Aún no tienes publicaciones</h3>
            <p className="mt-1 text-sm text-zinc-500">Publica tu primer equipo y empieza a vender</p>
            <Link
              href="/sell"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
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
                <div
                  key={listing.id}
                  className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700"
                >
                  {/* Thumbnail */}
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                    {cover ? (
                      <img
                        src={cover.cloudinary_url}
                        alt={listing.device_model?.model_name ?? 'Foto'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-6 w-6 text-zinc-700" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-white">
                        {listing.device_model
                          ? `${listing.device_model.brand} ${listing.device_model.model_name}`
                          : 'Dispositivo'}
                      </p>
                      <span
                        className={cn(
                          'flex-shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase',
                          status.cls,
                        )}
                      >
                        {status.label}
                      </span>
                    </div>

                    <p className="mt-0.5 text-base font-bold text-blue-400">
                      {formatPrice(Number(listing.price_usd))}
                    </p>

                    <div className="mt-1.5 flex items-center gap-4 text-xs text-zinc-600">
                      {listing.verification_status === 'verified' && (
                        <span className="flex items-center gap-1 text-emerald-500">
                          <ShieldCheck className="h-3 w-3" />
                          Verificado
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {listing.views_count ?? 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {listing.saves_count ?? 0}
                      </span>
                      <span>
                        {new Date(listing.created_at).toLocaleDateString('es-VE', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-shrink-0 gap-2">
                    <Link
                      href={`/listings/${listing.id}`}
                      className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300"
                    >
                      Ver
                    </Link>
                    {listing.status !== 'sold' && listing.status !== 'removed' && (
                      <Link
                        href={`/sell?edit=${listing.id}`}
                        className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700"
                      >
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

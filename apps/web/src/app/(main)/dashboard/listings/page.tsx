'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Eye, Heart, ShieldCheck, Package, Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, formatPrice } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface Listing {
  id: string
  status: string
  price_usd: number
  views_count: number
  saves_count: number
  verification_status: string
  created_at: string
  device_model: { brand: string; model_name: string } | null
  photos: { cloudinary_url: string; is_cover: boolean }[]
}

const STATUS: Record<string, { label: string; cls: string }> = {
  active:         { label: 'Activo',           cls: 'bg-green-50 text-green-700 border border-green-200' },
  draft:          { label: 'Borrador',          cls: 'bg-slate-100 text-slate-500 border border-slate-200' },
  pending_review: { label: 'En revisión',       cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  paused:         { label: 'Pausado',           cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  sold:           { label: 'Vendido',           cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  expired:        { label: 'Expirado',          cls: 'bg-red-50 text-red-700 border border-red-200' },
  removed:        { label: 'Eliminado',         cls: 'bg-slate-100 text-slate-400 border border-slate-200' },
}

export default function MyListingsPage() {
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchListings = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login?redirectTo=/dashboard/listings'); return }

    const { data } = await supabase
      .from('listings')
      .select(`id, status, price_usd, views_count, saves_count, verification_status, created_at,
         device_model:device_models(brand, model_name),
         photos:listing_photos(cloudinary_url, is_cover)`)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })

    setListings((data ?? []) as Listing[])
    setLoading(false)
  }, [router])

  useEffect(() => { void fetchListings() }, [fetchListings])

  const handleDeleteDraft = async (id: string) => {
    if (!confirm('¿Eliminar este borrador? Esta acción no se puede deshacer.')) return
    setDeletingId(id)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch(`${API_URL}/api/v1/listings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ status: 'removed' }),
      })
      if (res.ok) setListings((prev) => prev.filter((l) => l.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  // Ocultar listings removidos del historial visible (solo mostrar si son recientes, < 7 días)
  const visibleListings = listings.filter((l) => {
    if (l.status !== 'removed') return true
    const age = Date.now() - new Date(l.created_at).getTime()
    return age < 7 * 24 * 60 * 60 * 1000
  })

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Mis listings</h1>
              <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-bold text-slate-500">
                {visibleListings.length}
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

        {visibleListings.length === 0 ? (
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
            {visibleListings.map((listing) => {
              const cover = listing.photos?.find((p) => p.is_cover) ?? listing.photos?.[0]
              const status = STATUS[listing.status] ?? STATUS['draft']!
              const isDraft = listing.status === 'draft'
              const isFinished = listing.status === 'sold' || listing.status === 'removed'

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

                  <div className="flex flex-shrink-0 items-center gap-2">
                    {/* Borradores: continuar en wizard / eliminar */}
                    {isDraft && (
                      <>
                        <Link
                          href={`/sell?draft=${listing.id}`}
                          className="rounded-lg bg-green-50 border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100"
                        >
                          Continuar
                        </Link>
                        <button
                          onClick={() => void handleDeleteDraft(listing.id)}
                          disabled={deletingId === listing.id}
                          className="rounded-lg border border-red-100 bg-red-50 p-1.5 text-red-500 transition-colors hover:bg-red-100 disabled:opacity-40"
                        >
                          {deletingId === listing.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </>
                    )}

                    {/* Listings activos/pausados: Ver + Editar */}
                    {!isDraft && !isFinished && (
                      <>
                        <Link href={`/listings/${listing.id}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50">
                          Ver
                        </Link>
                        <Link href={`/sell?edit=${listing.id}`} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200">
                          Editar
                        </Link>
                      </>
                    )}

                    {/* Vendidos/removidos: solo Ver */}
                    {isFinished && (
                      <Link href={`/listings/${listing.id}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50">
                        Ver
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

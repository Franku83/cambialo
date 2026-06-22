'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Eye,
  Heart,
  MessageCircle,
  BarChart2,
  Loader2,
  Play,
  Pause,
  CheckCircle,
  Shield,
  PlusCircle,
  ExternalLink,
  AlertTriangle,
  Trash2,
  Archive,
} from 'lucide-react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import MarkSoldModal from '@/components/listings/MarkSoldModal'
import ArchivedListingsPanel from '@/components/dashboard/ArchivedListingsPanel'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface MyListingStats {
  id: string
  brand: string
  modelName: string
  storageGb: number
  priceUsd: string
  status: 'draft' | 'active' | 'paused' | 'sold' | 'expired' | 'removed' | 'pending_review'
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'expired'
  viewsCount: number
  savesCount: number
  whatsappClicks: number
  coverPhotoUrl: string | null
  createdAt: string
}

interface MyListingsPanelProps {
  authToken: string
  isVerifiedSeller?: boolean
  idVerified?: boolean
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-12 px-4 text-center space-y-3">
      <div className="rounded-full bg-slate-50 p-3">
        <PlusCircle className="h-6 w-6 text-slate-400" />
      </div>
      <p className="font-semibold text-slate-800 text-sm">{message}</p>
      <Link
        href="/sell"
        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
      >
        Publicar equipo
      </Link>
    </div>
  )
}

function ListingItem({
  item,
  actioningId,
  confirmingAction,
  setConfirmingAction,
  setMarkSoldListing,
  handleUpdateStatus,
}: {
  item: MyListingStats
  actioningId: string | null
  confirmingAction: string | null
  setConfirmingAction: (v: string | null) => void
  setMarkSoldListing: (v: { id: string; name: string } | null) => void
  handleUpdateStatus: (id: string, status: 'active' | 'paused' | 'sold' | 'removed') => Promise<void>
}) {
  const isVerificationPending = item.verificationStatus === 'pending'
  const isVerificationVerified = item.verificationStatus === 'verified'
  const isVerificationRejected = item.verificationStatus === 'rejected'
  const ctr = item.viewsCount > 0 ? (item.whatsappClicks / item.viewsCount * 100).toFixed(1) + '%' : '—'
  const isActioning = actioningId === item.id

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-white p-4 sm:p-5 transition-all hover:shadow-md ${
        isActioning ? 'opacity-60 pointer-events-none' : 'border-slate-200'
      } ${['paused', 'expired'].includes(item.status) ? 'opacity-60' : 'opacity-100'}`}
    >
      {item.status === 'sold' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-1 rounded-2xl bg-white/95 px-5 py-3 shadow-md border border-slate-100">
            <CheckCircle className="h-6 w-6 text-green-600 animate-bounce" />
            <span className="text-sm font-bold text-slate-800 uppercase tracking-wider">Vendido</span>
          </div>
        </div>
      )}

      {item.status === 'removed' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/75 backdrop-blur-[1px] p-4 text-center">
          <div className="flex flex-col items-center gap-1 max-w-[85%] rounded-2xl bg-white/95 px-5 py-3 shadow-md border border-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Removido por Moderación</span>
            <p className="text-[10px] text-slate-500 leading-normal">
              Este listing infringe nuestras normas comunitarias y ha sido desactivado.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {item.coverPhotoUrl ? (
            <img
              src={item.coverPhotoUrl}
              alt={`${item.brand} ${item.modelName}`}
              className="h-14 w-14 rounded-xl object-cover border border-slate-100 shrink-0 bg-slate-50"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400 shrink-0">
              <PlusCircle className="h-5 w-5 text-slate-300" />
            </div>
          )}

          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {item.status === 'draft' ? (
                <Link
                  href={`/sell?draft=${item.id}`}
                  className="font-bold text-slate-900 hover:text-green-600 transition-colors truncate text-sm sm:text-base flex items-center gap-1"
                >
                  {item.brand} {item.modelName} · {item.storageGb}GB
                  <ExternalLink className="h-3 w-3 inline text-slate-400 shrink-0" />
                </Link>
              ) : (
                <Link
                  href={`/listings/${item.id}`}
                  className="font-bold text-slate-900 hover:text-green-600 transition-colors truncate text-sm sm:text-base flex items-center gap-1"
                >
                  {item.brand} {item.modelName} · {item.storageGb}GB
                  <ExternalLink className="h-3 w-3 inline text-slate-400 shrink-0" />
                </Link>
              )}

              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border shrink-0 ${
                item.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                item.status === 'paused' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                item.status === 'pending_review' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                item.status === 'sold' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                item.status === 'expired' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                item.status === 'removed' ? 'bg-red-50 text-red-700 border-red-200' :
                'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                {item.status === 'active' && <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />}
                {item.status === 'paused' && <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />}
                {item.status === 'active' ? 'Activo' :
                 item.status === 'paused' ? 'Pausado' :
                 item.status === 'pending_review' ? 'En revisión' :
                 item.status === 'sold' ? 'Vendido' :
                 item.status === 'expired' ? 'Expirado' :
                 item.status === 'removed' ? 'Removido' :
                 item.status === 'draft' ? 'Borrador' : item.status}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="font-extrabold text-slate-900 text-sm">
                {formatPrice(Number(item.priceUsd))}
              </span>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold shrink-0">
                {isVerificationVerified && (
                  <span className="flex items-center gap-0.5 text-green-600">
                    <Shield className="h-3.5 w-3.5 fill-green-50" /> 🛡 Verificado
                  </span>
                )}
                {isVerificationPending && (
                  <span className="flex items-center gap-0.5 text-amber-600">⏳ En revisión</span>
                )}
                {isVerificationRejected && (
                  <span className="flex items-center gap-0.5 text-red-600">❌ Rechazado</span>
                )}
                {item.verificationStatus === 'expired' && (
                  <span className="flex items-center gap-0.5 text-slate-400">Expirado</span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full sm:w-auto flex flex-col items-stretch sm:items-end gap-3.5 pt-3.5 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <div className="grid grid-cols-4 sm:flex items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
            <div className="flex flex-col sm:flex-row items-center gap-1" title="Vistas">
              <Eye className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-700 font-semibold">{item.viewsCount}</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">vistas</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-1" title="Clicks en WhatsApp">
              <MessageCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-700 font-semibold">{item.whatsappClicks}</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">clicks WA</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-1" title="Guardados">
              <Heart className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-700 font-semibold">{item.savesCount}</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">guardados</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-1" title="Conversión de clicks">
              <BarChart2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-700 font-semibold">{ctr}</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">conv.</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-end">
            {item.status === 'active' && (
              <>
                <button
                  onClick={() => void handleUpdateStatus(item.id, 'paused')}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Pause className="h-3 w-3" /> Pausar
                </button>
                {confirmingAction === item.id + '_sold' ? (
                  <div className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/50 p-1 px-2.5">
                    <span className="text-[11px] font-semibold text-amber-800">¿Seguro?</span>
                    <button
                      onClick={() => { setConfirmingAction(null); setMarkSoldListing({ id: item.id, name: `${item.brand} ${item.modelName} ${item.storageGb}GB` }) }}
                      className="rounded-lg bg-green-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-green-700 transition-colors"
                    >Sí</button>
                    <button onClick={() => setConfirmingAction(null)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">No</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmingAction(item.id + '_sold')} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 rounded-xl bg-green-50 border border-green-200 px-3.5 py-2 text-xs font-bold text-green-700 hover:bg-green-100 transition-colors">
                    <CheckCircle className="h-3 w-3" /> Marcar vendido
                  </button>
                )}
                <button disabled className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-400 cursor-not-allowed" title="Próximamente">Editar</button>
                <button disabled className="inline-flex items-center justify-center gap-1 rounded-xl border border-amber-200 bg-amber-50/50 px-3.5 py-2 text-xs font-medium text-amber-600 cursor-not-allowed" title="Próximamente">⬆ Destacar $1</button>
              </>
            )}

            {item.status === 'paused' && (
              <>
                <button onClick={() => void handleUpdateStatus(item.id, 'active')} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 rounded-xl border border-green-200 bg-green-50 px-3.5 py-2 text-xs font-bold text-green-700 hover:bg-green-100 transition-colors">
                  <Play className="h-3 w-3 fill-green-700" /> Reactivar
                </button>
                {confirmingAction === item.id + '_sold' ? (
                  <div className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/50 p-1 px-2.5">
                    <span className="text-[11px] font-semibold text-amber-800">¿Seguro?</span>
                    <button onClick={() => { setConfirmingAction(null); setMarkSoldListing({ id: item.id, name: `${item.brand} ${item.modelName} ${item.storageGb}GB` }) }} className="rounded-lg bg-green-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-green-700 transition-colors">Sí</button>
                    <button onClick={() => setConfirmingAction(null)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">No</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmingAction(item.id + '_sold')} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                    <CheckCircle className="h-3 w-3" /> Marcar vendido
                  </button>
                )}
                <button disabled className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-400 cursor-not-allowed" title="Próximamente">Editar</button>
              </>
            )}

            {item.status === 'draft' && (
              <>
                <Link href={`/sell?draft=${item.id}`} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 rounded-xl border border-green-200 bg-green-50 px-3.5 py-2 text-xs font-bold text-green-700 hover:bg-green-100 transition-colors">Continuar</Link>
                <button onClick={() => { if (!confirm('¿Eliminar este borrador?')) return; void handleUpdateStatus(item.id, 'removed') }} disabled={isActioning} className="inline-flex items-center justify-center gap-1 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-100 transition-colors disabled:opacity-40">
                  {isActioning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </>
            )}

            {item.status === 'pending_review' && (
              <button onClick={() => void handleUpdateStatus(item.id, 'paused')} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                <Pause className="h-3 w-3" /> Pausar
              </button>
            )}

            {item.status === 'expired' && (
              <button disabled className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 rounded-xl bg-green-600 border border-green-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-green-700 transition-colors opacity-50 cursor-not-allowed" title="Próximamente">Renovar</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MyListingsPanel({
  authToken,
  isVerifiedSeller = false,
  idVerified = false,
}: MyListingsPanelProps) {
  const [listings, setListings] = useState<MyListingStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [markSoldListing, setMarkSoldListing] = useState<{ id: string; name: string } | null>(null)
  const [confirmingAction, setConfirmingAction] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'active' | 'drafts' | 'archived'>('active')

  const activeListings = listings.filter((l) => ['active', 'paused', 'pending_review'].includes(l.status))
  const draftListings = listings.filter((l) => l.status === 'draft')
  const archivedListings = listings.filter((l) => ['sold', 'expired', 'removed'].includes(l.status))

  const activeCount = activeListings.length + draftListings.length
  const limit = isVerifiedSeller ? 25 : idVerified ? 10 : 3

  const fetchListings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/v1/listings/mine/stats`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (!res.ok) throw new Error('Error al cargar tus listings y estadísticas')
      setListings(await res.json() as MyListingStats[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [authToken])

  useEffect(() => { void fetchListings() }, [fetchListings])

  const handleUpdateStatus = async (id: string, newStatus: 'active' | 'paused' | 'sold' | 'removed') => {
    setActioningId(id)
    try {
      const res = await fetch(`${API_URL}/api/v1/listings/${id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('No se pudo actualizar el estado del listing')
      await fetchListings()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al actualizar el estado')
    } finally {
      setActioningId(null)
    }
  }

  if (loading && listings.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <Loader2 className="h-7 w-7 animate-spin text-green-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-semibold text-red-700">{error}</p>
        <button onClick={() => void fetchListings()} className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors">Reintentar</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Mis Equipos Publicados</h2>
        <Link href="/sell" className="flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-green-700 active:scale-[0.98] shadow-sm shadow-green-100">
          <PlusCircle className="h-4 w-4" /> Publicar nuevo
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-50">
        <button type="button" onClick={() => setActiveTab('active')} className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${activeTab === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          Activos ({activeListings.length})
        </button>
        <button type="button" onClick={() => setActiveTab('drafts')} className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${activeTab === 'drafts' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          Borradores ({draftListings.length})
        </button>
        <button type="button" onClick={() => setActiveTab('archived')} className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${activeTab === 'archived' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <Archive className="h-3.5 w-3.5" /> Archivados ({archivedListings.length})
        </button>
      </div>

      {activeTab === 'active' && (
        activeListings.length === 0 ? (
          <EmptyState message="No tienes publicaciones activas" />
        ) : (
          <div className="space-y-4">
            {activeListings.map((item) => (
              <ListingItem key={item.id} item={item} actioningId={actioningId} confirmingAction={confirmingAction} setConfirmingAction={setConfirmingAction} setMarkSoldListing={setMarkSoldListing} handleUpdateStatus={handleUpdateStatus} />
            ))}
          </div>
        )
      )}

      {activeTab === 'drafts' && (
        draftListings.length === 0 ? (
          <EmptyState message="No tienes borradores pendientes" />
        ) : (
          <div className="space-y-4">
            {draftListings.map((item) => (
              <ListingItem key={item.id} item={item} actioningId={actioningId} confirmingAction={confirmingAction} setConfirmingAction={setConfirmingAction} setMarkSoldListing={setMarkSoldListing} handleUpdateStatus={handleUpdateStatus} />
            ))}
          </div>
        )
      )}

      {activeTab === 'archived' && (
        <ArchivedListingsPanel authToken={authToken} />
      )}

      {markSoldListing && (
        <MarkSoldModal listingId={markSoldListing.id} listingName={markSoldListing.name} authToken={authToken} onConfirm={() => { setMarkSoldListing(null); void fetchListings() }} onCancel={() => setMarkSoldListing(null)} />
      )}
    </div>
  )
}

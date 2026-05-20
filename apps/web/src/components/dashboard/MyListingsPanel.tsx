'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Eye,
  Heart,
  MessageCircle,
  BarChart2,
  Loader2,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  Shield,
  PlusCircle,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface MyListingStats {
  id: string
  brand: string
  modelName: string
  storageGb: number
  priceUsd: string
  status: 'draft' | 'active' | 'paused' | 'sold' | 'expired' | 'removed'
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

export default function MyListingsPanel({
  authToken,
  isVerifiedSeller = false,
  idVerified = false,
}: MyListingsPanelProps) {
  const [listings, setListings] = useState<MyListingStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)

  const activeCount = listings.filter((l) => ['active', 'paused', 'draft'].includes(l.status)).length
  const limit = isVerifiedSeller ? 25 : idVerified ? 10 : 3
  const percentage = Math.min((activeCount / limit) * 100, 100)

  const fetchListings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/v1/listings/mine/stats`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
      if (!res.ok) {
        throw new Error('Error al cargar tus listings y estadísticas')
      }
      const data = await res.json() as MyListingStats[]
      setListings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [authToken])

  useEffect(() => {
    void fetchListings()
  }, [fetchListings])

  const handleUpdateStatus = async (id: string, newStatus: 'active' | 'paused' | 'sold') => {
    if (newStatus === 'sold') {
      const confirmSold = window.confirm('¿Confirmas que vendiste este equipo?')
      if (!confirmSold) return
    }

    setActioningId(id)
    try {
      const res = await fetch(`${API_URL}/api/v1/listings/${id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        throw new Error('No se pudo actualizar el estado del listing')
      }

      await fetchListings()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al actualizar el estado')
    } finally {
      setActioningId(null)
    }
  }

  const handleDeleteListing = async (id: string) => {
    const confirmDelete = window.confirm('¿Eliminar este listing? Esta acción no se puede deshacer.')
    if (!confirmDelete) return

    setActioningId(id)
    try {
      const res = await fetch(`${API_URL}/api/v1/listings/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (!res.ok) {
        throw new Error('No se pudo eliminar el listing')
      }

      await fetchListings()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el listing')
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
        <button
          onClick={() => void fetchListings()}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Mis Equipos Publicados</h2>
        <Link
          href="/sell"
          className="flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-green-700 active:scale-[0.98] shadow-sm shadow-green-100"
        >
          <PlusCircle className="h-4 w-4" />
          Publicar nuevo
        </Link>
      </div>

      {/* Barra de progreso de límite de listings publicados */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-700">Límite de publicaciones</span>
          <span className="font-medium text-slate-500">{activeCount} / {limit} listings</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              percentage >= 100 ? 'bg-red-500' : percentage >= 80 ? 'bg-amber-500' : 'bg-green-600'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {activeCount >= limit && (
          <p className="text-xs text-red-500 font-medium">
            Alcanzaste tu límite de {limit} listings.
          </p>
        )}
        {!isVerifiedSeller && (
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>¿Necesitas publicar más?</span>
            <Link href="/kyc" className="font-semibold text-green-600 hover:text-green-700">
              Verifica tu identidad para publicar hasta 10 listings →
            </Link>
          </div>
        )}
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-12 px-4 text-center space-y-3">
          <div className="rounded-full bg-slate-50 p-3">
            <PlusCircle className="h-6 w-6 text-slate-400" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-slate-800 text-sm">No tienes publicaciones todavía</p>
            <p className="text-xs text-slate-400">Publica tu primer teléfono verificado de manera rápida y segura.</p>
          </div>
          <Link
            href="/sell"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
          >
            Comenzar venta
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((item) => {
            const isVerificationPending = item.verificationStatus === 'pending'
            const isVerificationVerified = item.verificationStatus === 'verified'
            const isVerificationRejected = item.verificationStatus === 'rejected'

            const isStatusActive = item.status === 'active'
            const isStatusPaused = item.status === 'paused'
            const isStatusSold = item.status === 'sold'
            const isStatusExpired = item.status === 'expired'

            const ctr = item.viewsCount > 0 ? (item.whatsappClicks / item.viewsCount * 100).toFixed(1) + '%' : '—'
            const isActioning = actioningId === item.id

            return (
              <div
                key={item.id}
                className={`relative overflow-hidden rounded-2xl border bg-white p-4 sm:p-5 transition-all hover:shadow-md ${
                  isActioning ? 'opacity-60 pointer-events-none' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  
                  {/* Left Side: Thumbnail & Title Details */}
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
                        <Link
                          href={`/listings/${item.id}`}
                          className="font-bold text-slate-900 hover:text-green-600 transition-colors truncate text-sm sm:text-base flex items-center gap-1"
                        >
                          {item.brand} {item.modelName} · {item.storageGb}GB
                          <ExternalLink className="h-3 w-3 inline text-slate-400 shrink-0" />
                        </Link>
                        
                        {/* Status Badge */}
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border shrink-0 bg-slate-50 text-slate-600 border-slate-200">
                          {isStatusActive && (
                            <>
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                              Activo
                            </>
                          )}
                          {isStatusPaused && (
                            <>
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                              Pausado
                            </>
                          )}
                          {isStatusSold && 'Vendido'}
                          {isStatusExpired && 'Expirado'}
                          {item.status === 'draft' && 'Borrador'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <span className="font-extrabold text-slate-900 text-sm">
                          {formatPrice(Number(item.priceUsd))}
                        </span>

                        <span className="text-slate-300 hidden sm:inline">|</span>

                        {/* Verification Status Badge */}
                        <span className="inline-flex items-center gap-1 text-xs font-semibold shrink-0">
                          {isVerificationVerified && (
                            <span className="flex items-center gap-0.5 text-green-600">
                              <Shield className="h-3.5 w-3.5 fill-green-50" />
                              🛡 Verificado
                            </span>
                          )}
                          {isVerificationPending && (
                            <span className="flex items-center gap-0.5 text-amber-600">
                              ⏳ En revisión
                            </span>
                          )}
                          {isVerificationRejected && (
                            <span className="flex items-center gap-0.5 text-red-600">
                              ❌ Rechazado
                            </span>
                          )}
                          {item.verificationStatus === 'expired' && (
                            <span className="flex items-center gap-0.5 text-slate-400">
                              Expirado
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Performance Stats & Action Buttons */}
                  <div className="w-full sm:w-auto flex flex-col items-stretch sm:items-end gap-3.5 pt-3.5 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    
                    {/* Interaction Stats */}
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

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 justify-end">
                      {isStatusActive && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'paused')}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Pause className="h-3 w-3" />
                            Pausar
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'sold')}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 rounded-xl bg-green-50 border border-green-200 px-3.5 py-2 text-xs font-bold text-green-700 hover:bg-green-100 transition-colors"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Marcar vendido
                          </button>
                        </>
                      )}

                      {isStatusPaused && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'active')}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 rounded-xl border border-green-200 bg-green-50 px-3.5 py-2 text-xs font-bold text-green-700 hover:bg-green-100 transition-colors"
                          >
                            <Play className="h-3 w-3 fill-green-700" />
                            Reactivar
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'sold')}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Marcar vendido
                          </button>
                        </>
                      )}

                      {/* Delete is visible except if already deleted */}
                      <button
                        onClick={() => handleDeleteListing(item.id)}
                        className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50/50 px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                        title="Eliminar listing"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="ml-1 sm:hidden">Eliminar</span>
                      </button>
                    </div>

                  </div>

                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

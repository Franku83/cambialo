'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Shield, CheckCircle, XCircle, AlertTriangle, Loader2, Clock } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface ModerationListing {
  id: string
  priceUsd: string
  storageGb: number
  batteryHealth: number
  condition: string
  imeiLast4: string
  hasRepairs: boolean
  repairDetails: string | null
  description: string | null
  verificationStatus: string
  createdAt: string
  deviceModel: { brand: string; modelName: string; modelNumber: string }
  seller: { username: string; reputationScore: number; totalSales: number; idVerified: boolean }
  photos: { cloudinaryUrl: string; isVerificationPhoto: boolean }[]
}

const REJECTION_REASONS = [
  'Código de verificación ilegible',
  'Código de verificación no coincide',
  'El equipo en la foto no coincide con el modelo declarado',
  'Foto de baja calidad / borrosa',
  'Se detecta edición o manipulación de la imagen',
  'IMEI posiblemente duplicado (requiere revisión)',
  'Precio fuera de rango (muy bajo — posible fraude)',
  'Información incompleta o inconsistente',
]

const CONDITION_LABEL: Record<string, string> = {
  mint: 'Nuevo', good: 'Buen estado', fair: 'Regular', poor: 'Con detalles',
}

function timeSince(date: string) {
  const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours}h`
  return `hace ${Math.floor(hours / 24)}d`
}

export default function ModerationPage() {
  const router = useRouter()
  const [listings, setListings] = useState<ModerationListing[]>([])
  const [loading, setLoading] = useState(true)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [unauthorized, setUnauthorized] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showRejectMenu, setShowRejectMenu] = useState(false)
  const [processing, setProcessing] = useState(false)

  const fetchPending = useCallback(async (token: string) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/moderation/queue`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401 || res.status === 403) { setUnauthorized(true); return }
      if (!res.ok) return
      const data = await res.json() as ModerationListing[]
      setListings(data)
      if (data.length > 0) setActiveId(data[0]!.id)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    void (async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login?redirectTo=/admin/moderation'); return }
      setAuthToken(session.access_token)
      await fetchPending(session.access_token)
    })()
  }, [router, fetchPending])

  const handleAction = async (action: 'approve' | 'reject', listingId: string, reason?: string) => {
    if (!authToken) return
    setProcessing(true)
    try {
      await fetch(`${API_URL}/api/v1/moderation/${listingId}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        ...(reason && { body: JSON.stringify({ reason }) }),
      })
      setListings(prev => prev.filter(l => l.id !== listingId))
      setShowRejectMenu(false)
      setActiveId(listings.find(l => l.id !== listingId)?.id ?? null)
    } finally { setProcessing(false) }
  }

  const active = listings.find(l => l.id === activeId)

  if (unauthorized) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Shield className="h-12 w-12 text-red-400" />
        <h1 className="text-xl font-bold text-slate-900">Acceso restringido</h1>
        <p className="text-slate-500">Solo moderadores, admins y owners pueden acceder.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cola de verificación</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading ? '...' : `${listings.length} pendientes`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 py-20 text-center">
          <CheckCircle className="h-10 w-10 text-green-400" />
          <p className="font-semibold text-slate-700">Cola vacía — todo revisado</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5 md:grid md:grid-cols-4">
          {/* Lista izquierda */}
          <div className="md:col-span-1 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:overflow-x-visible pb-2 md:pb-0" style={{ maxHeight: 'none' }}>
            {listings.map(l => (
              <button
                key={l.id}
                onClick={() => setActiveId(l.id)}
                className={cn(
                  'w-full rounded-xl border p-3 text-left text-sm transition-all',
                  activeId === l.id
                    ? 'border-green-400 bg-green-50'
                    : 'border-slate-200 bg-white hover:border-slate-300',
                )}
              >
                <p className="font-medium text-slate-900">{l.deviceModel.brand} {l.deviceModel.modelName}</p>
                <p className="text-slate-500">@{l.seller.username}</p>
                <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  {timeSince(l.createdAt)}
                </div>
              </button>
            ))}
          </div>

          {/* Detalle derecho */}
          {active && (
            <div className="md:col-span-3 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {active.deviceModel.brand} {active.deviceModel.modelName} · {active.storageGb}GB
                  </h2>
                  <p className="text-sm text-slate-500">
                    {active.deviceModel.modelNumber} · {CONDITION_LABEL[active.condition] ?? active.condition} ·
                    Batería {active.batteryHealth}% · {formatPrice(Number(active.priceUsd))}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    IMEI últimos 4: <strong>{active.imeiLast4}</strong> ·
                    Vendedor: @{active.seller.username} (score {active.seller.reputationScore}, {active.seller.totalSales} ventas)
                    {active.seller.idVerified && ' · ✓ Identidad verificada'}
                  </p>
                </div>
                <span className="text-sm text-slate-400">{timeSince(active.createdAt)}</span>
              </div>

              {/* Fotos */}
              <div className="grid grid-cols-3 gap-3">
                {active.photos.map((p, i) => (
                  <div key={i} className="relative overflow-hidden rounded-xl bg-slate-100">
                    {p.isVerificationPhoto && (
                      <span className="absolute left-2 top-2 z-10 rounded-full bg-green-600 px-2 py-0.5 text-xs font-bold text-white">
                        Verificación
                      </span>
                    )}
                    <img src={p.cloudinaryUrl} alt="" className="aspect-square w-full object-cover" />
                  </div>
                ))}
              </div>

              {/* Reparaciones */}
              {active.hasRepairs && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-medium">Equipo con reparaciones declaradas</p>
                    {active.repairDetails && <p className="text-xs mt-0.5">{active.repairDetails}</p>}
                  </div>
                </div>
              )}

              {/* Descripción */}
              {active.description && (
                <p className="text-sm text-slate-600 italic">"{active.description}"</p>
              )}

              {/* Acciones */}
              <div className="flex gap-3 border-t border-slate-100 pt-4">
                <button
                  onClick={() => void handleAction('approve', active.id)}
                  disabled={processing}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-semibold text-white disabled:opacity-50 hover:bg-green-700"
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Aprobar
                </button>

                <div className="relative flex-1">
                  <button
                    onClick={() => setShowRejectMenu(v => !v)}
                    disabled={processing}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 font-semibold text-red-700 disabled:opacity-50 hover:bg-red-100"
                  >
                    <XCircle className="h-4 w-4" />
                    Rechazar ▼
                  </button>
                  {showRejectMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowRejectMenu(false)} />
                      <div className="absolute bottom-full z-20 mb-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                        {REJECTION_REASONS.map(r => (
                          <button
                            key={r}
                            onClick={() => void handleAction('reject', active.id, r)}
                            className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-700"
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <button
                  disabled={processing}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 disabled:opacity-50 hover:bg-slate-50"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Escalar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

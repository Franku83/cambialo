'use client'

import { Fragment, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Shield,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  Phone,
  User as UserIcon,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface KycRequest {
  id: string
  userId: string
  username: string
  fullName: string
  documentFrontUrl: string
  selfieUrl: string
  whatsappNumber: string
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected'
}

export default function AdminKycPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<KycRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [unauthorized, setUnauthorized] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  // Rejection modal state
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [actioning, setActioning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchKycQueue = useCallback(async (token: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/v1/kyc/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401 || res.status === 403) {
        setUnauthorized(true)
        return
      }
      if (!res.ok) {
        throw new Error('Error al cargar la cola de verificación KYC')
      }
      const data = await res.json() as KycRequest[]
      setRequests(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener pendientes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void (async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login?redirectTo=/admin/kyc')
        return
      }
      setAuthToken(session.access_token)
      await fetchKycQueue(session.access_token)
    })()
  }, [router, fetchKycQueue])

  const handleApprove = async (id: string) => {
    if (!authToken) return
    const confirmApprove = window.confirm('¿Confirmas que deseas APROBAR esta solicitud de identidad?')
    if (!confirmApprove) return

    setActioning(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/v1/kyc/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (!res.ok) {
        throw new Error('Error al aprobar la verificación')
      }
      setRequests(prev => prev.filter(r => r.id !== id))
      if (expandedId === id) setExpandedId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar aprobación')
    } finally {
      setActioning(false)
    }
  }

  const handleRejectSubmit = async () => {
    if (!authToken || !rejectingId) return
    if (!rejectionReason.trim()) {
      alert('Debes ingresar un motivo de rechazo')
      return
    }

    setActioning(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/v1/kyc/${rejectingId}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: rejectionReason.trim() }),
      })
      if (!res.ok) {
        throw new Error('Error al rechazar la verificación')
      }
      setRequests(prev => prev.filter(r => r.id !== rejectingId))
      if (expandedId === rejectingId) setExpandedId(null)
      setRejectingId(null)
      setRejectionReason('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar rechazo')
    } finally {
      setActioning(false)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  if (unauthorized) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Shield className="h-12 w-12 text-red-400" />
        <h1 className="text-xl font-bold text-slate-900 font-display">Acceso restringido</h1>
        <p className="text-slate-500">Solo owners y admins pueden ver esta sección.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Cola de verificación KYC</h1>
          <p className="mt-1.5 text-sm text-slate-500 font-medium">
            {loading ? 'Cargando solicitudes...' : `${requests.length} solicitudes pendientes`}
          </p>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Main List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-9 w-9 animate-spin text-green-600" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center gap-3.5 rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
          <CheckCircle className="h-10 w-10 text-green-400" />
          <p className="font-bold text-slate-700">Todo al día</p>
          <p className="text-xs text-slate-400">No hay verificaciones KYC pendientes en la cola.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-5">Usuario</th>
                  <th className="py-4 px-5">WhatsApp</th>
                  <th className="py-4 px-5">Fecha de Envío</th>
                  <th className="py-4 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {requests.map((req) => {
                  const isExpanded = expandedId === req.id
                  return (
                    <Fragment key={req.id}>
                      <tr
                        className={cn(
                          'hover:bg-slate-50/50 transition-colors cursor-pointer',
                          isExpanded && 'bg-slate-50/40'
                        )}
                        onClick={() => toggleExpand(req.id)}
                      >
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 shrink-0">
                              <UserIcon className="h-4.5 w-4.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate leading-snug">{req.fullName}</p>
                              <p className="text-xs text-slate-400 font-mono mt-0.5">@{req.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <a
                            href={`https://wa.me/${req.whatsappNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 font-medium text-green-600 hover:text-green-700 transition-colors"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            {req.whatsappNumber}
                          </a>
                        </td>
                        <td className="py-4 px-5 text-slate-500">
                          <span className="flex items-center gap-1.5 text-xs">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {new Date(req.submittedAt).toLocaleDateString('es-VE', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleExpand(req.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              Fotos
                            </button>
                            <button
                              disabled={actioning}
                              onClick={() => handleApprove(req.id)}
                              className="inline-flex items-center justify-center rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              Aprobar
                            </button>
                            <button
                              disabled={actioning}
                              onClick={() => setRejectingId(req.id)}
                              className="inline-flex items-center justify-center rounded-lg bg-red-55/10 border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50"
                            >
                              Rechazar
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={4} className="p-0 bg-slate-50/50 border-t border-slate-100">
                            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                              {/* Document front */}
                              <div className="space-y-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                  <Eye className="h-3.5 w-3.5" /> Documento (Parte Frontal)
                                </span>
                                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white aspect-video relative group">
                                  <a href={req.documentFrontUrl} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
                                    <img
                                      src={req.documentFrontUrl}
                                      alt="Documento Frontal"
                                      className="h-full w-full object-contain bg-slate-100 transition-transform group-hover:scale-[1.01]"
                                    />
                                    <span className="absolute bottom-2.5 right-2.5 rounded-md bg-black/60 px-2 py-1 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                      Abrir original ↗
                                    </span>
                                  </a>
                                </div>
                              </div>

                              {/* Selfie */}
                              <div className="space-y-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                  <Eye className="h-3.5 w-3.5" /> Selfie con documento
                                </span>
                                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white aspect-video relative group">
                                  <a href={req.selfieUrl} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
                                    <img
                                      src={req.selfieUrl}
                                      alt="Selfie"
                                      className="h-full w-full object-contain bg-slate-100 transition-transform group-hover:scale-[1.01]"
                                    />
                                    <span className="absolute bottom-2.5 right-2.5 rounded-md bg-black/60 px-2 py-1 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                      Abrir original ↗
                                    </span>
                                  </a>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REJECTION MODAL */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => {
              if (!actioning) {
                setRejectingId(null)
                setRejectionReason('')
              }
            }}
          />

          {/* Card */}
          <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all border border-slate-100 space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-6 w-6" />
              <h3 className="text-lg font-bold text-slate-900">Rechazar Solicitud KYC</h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-normal">
              Especifica la razón por la cual rechazas esta verificación. El usuario podrá visualizar este mensaje en su panel para reintentar la solicitud.
            </p>

            <div className="space-y-1.5">
              <label htmlFor="reason" className="text-xs font-bold text-slate-500">
                Motivo del rechazo
              </label>
              <textarea
                id="reason"
                rows={4}
                className="w-full rounded-xl border border-slate-200 p-3.5 text-sm text-slate-800 focus:border-red-500 focus:outline-none focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)] transition-all placeholder:text-slate-400"
                placeholder="Ej. La selfie se encuentra muy borrosa y no es posible distinguir los datos del documento."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                disabled={actioning}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={actioning}
                onClick={() => {
                  setRejectingId(null)
                  setRejectionReason('')
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={actioning || !rejectionReason.trim()}
                onClick={handleRejectSubmit}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4.5 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actioning && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { Loader2, Search, CheckCircle2, X } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface UserResult {
  id: string
  username: string
  fullName: string
  avatarUrl: string | null
}

interface Props {
  listingId: string
  listingName: string
  authToken: string
  onConfirm: () => void
  onCancel: () => void
}

export default function MarkSoldModal({ listingId, listingName, authToken, onConfirm, onCancel }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<UserResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step === 2) setTimeout(() => inputRef.current?.focus(), 100)
  }, [step])

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`${API_URL}/api/v1/users/search?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        })
        if (res.ok) setResults(await res.json() as UserResult[])
      } finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [query, authToken])

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      await fetch(`${API_URL}/api/v1/listings/${listingId}/mark-sold`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerUsername: selected?.username ?? undefined }),
      })
      onConfirm()
    } finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="font-bold text-slate-900">Marcar como vendido</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Paso 1 — confirmar */}
          {step === 1 && (
            <>
              <p className="text-sm text-slate-600">
                ¿Confirmas que vendiste <span className="font-semibold text-slate-900">{listingName}</span>?
              </p>
              <p className="text-xs text-slate-400">
                El listing se marcará como vendido y quedará fuera del feed.
              </p>
              <div className="flex gap-2 pt-1">
                <button onClick={onCancel} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  Cancelar
                </button>
                <button onClick={() => setStep(2)} className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700">
                  Sí, vendido
                </button>
              </div>
            </>
          )}

          {/* Paso 2 — buscar comprador */}
          {step === 2 && (
            <>
              <p className="text-sm text-slate-600">¿A quién se lo vendiste? <span className="text-slate-400">(opcional)</span></p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => { setQuery(e.target.value); setSelected(null) }}
                  placeholder="Buscar por username..."
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-green-500"
                />
                {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />}
              </div>

              {results.length > 0 && !selected && (
                <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                  {results.map(u => (
                    <button
                      key={u.id}
                      onClick={() => { setSelected(u); setQuery(u.username); setResults([]) }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left"
                    >
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-500">
                          {u.username[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-900">@{u.username}</p>
                        <p className="text-xs text-slate-400">{u.fullName}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selected && (
                <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <p className="text-sm text-green-800">@{selected.username} recibirá una solicitud de reseña.</p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setSelected(null); setStep(3) }}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
                >
                  No está en Cambialo
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!selected && query.length > 0 && results.length > 0}
                  className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {selected ? 'Continuar' : 'Omitir'}
                </button>
              </div>
            </>
          )}

          {/* Paso 3 — confirmar final */}
          {step === 3 && (
            <>
              <p className="text-sm text-slate-600">
                {selected
                  ? <>Se le enviará una solicitud de reseña a <span className="font-semibold text-slate-900">@{selected.username}</span>.</>
                  : 'El listing se marcará como vendido sin comprador registrado.'
                }
              </p>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setStep(2)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  Atrás
                </button>
                <button
                  onClick={() => void handleConfirm()}
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin inline" /> : 'Confirmar venta'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

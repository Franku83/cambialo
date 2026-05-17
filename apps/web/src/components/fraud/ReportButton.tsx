'use client'

import { useState } from 'react'
import { Flag, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ReportButtonProps {
  listingId: string
  reportedUserId: string
  currentUserId?: string
  listingOwnerId: string
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export function ReportButton({ listingId, reportedUserId, currentUserId, listingOwnerId }: ReportButtonProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  // No mostrar si no está autenticado o si es el dueño
  if (!currentUserId || currentUserId === listingOwnerId) return null

  const submit = async () => {
    if (!reason.trim()) return
    setSubmitting(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await fetch(`${API}/api/v1/fraud-reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ reportedUserId, listingId, reason }),
    })

    setDone(true)
    setSubmitting(false)
    setTimeout(() => setOpen(false), 1500)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:border-red-500/40 hover:text-red-400"
      >
        <Flag className="h-3.5 w-3.5" />
        Reportar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-white">Reportar listing</h3>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            {done ? (
              <p className="py-4 text-center text-sm text-emerald-400">✓ Reporte enviado. Lo revisaremos pronto.</p>
            ) : (
              <>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe el problema (equipo bloqueado, fotos falsas, estafa...)"
                  rows={4}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-red-500 resize-none mb-4"
                />
                <button
                  onClick={submit}
                  disabled={submitting || !reason.trim()}
                  className="w-full rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-red-700"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Enviar reporte
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

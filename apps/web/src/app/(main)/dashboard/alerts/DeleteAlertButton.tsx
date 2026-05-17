'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function DeleteAlertButton({ alertId, onDeleted }: { alertId: string; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar esta alerta?')) return
    setDeleting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/v1/search-alerts/${alertId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      if (res.ok) onDeleted()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
    >
      {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      Eliminar
    </button>
  )
}

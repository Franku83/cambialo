'use client'

import { useState } from 'react'
import { Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface SaveButtonProps {
  listingId: string
  initialSaved: boolean
}

export function SaveButton({ listingId, initialSaved }: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

  const toggle = async () => {
    if (loading) return
    setLoading(true)

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      window.location.href = `/login?redirectTo=/listings/${listingId}`
      return
    }

    const method = saved ? 'DELETE' : 'POST'
    const res = await fetch(`${API_URL}/api/v1/listings/${listingId}/save`, {
      method,
      headers: { Authorization: `Bearer ${session.access_token}` },
    }).catch(() => null)

    if (res?.ok) setSaved(!saved)
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors',
        saved
          ? 'border-blue-500 bg-blue-600/20 text-blue-400'
          : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300',
        loading && 'opacity-60',
      )}
      aria-label={saved ? 'Quitar de guardados' : 'Guardar listing'}
    >
      <Bookmark className={cn('h-5 w-5', saved && 'fill-current')} />
    </button>
  )
}

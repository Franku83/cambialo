'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, Loader2, BellRing } from 'lucide-react'
import { subscribeToPush, sendSubscriptionToServer, isPushSupported } from '@/lib/push'
import { createClient } from '@/lib/supabase/client'

type PushState = 'unsupported' | 'default' | 'loading' | 'granted' | 'denied'

export function PushPermission() {
  const [state, setState] = useState<PushState>('default')

  useEffect(() => {
    if (!isPushSupported()) { setState('unsupported'); return }
    if (Notification.permission === 'granted') setState('granted')
    else if (Notification.permission === 'denied') setState('denied')
  }, [])

  if (state === 'unsupported' || state === 'granted') return null

  const activate = async () => {
    setState('loading')
    try {
      const sub = await subscribeToPush()
      if (!sub) { setState('denied'); return }

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) await sendSubscriptionToServer(sub, session.access_token)

      setState('granted')
    } catch {
      setState('denied')
    }
  }

  if (state === 'denied') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-500">
        <BellOff className="h-4 w-4" />
        Notificaciones bloqueadas en el navegador
      </div>
    )
  }

  return (
    <button
      onClick={activate}
      disabled={state === 'loading'}
      className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-600/10 px-4 py-2.5 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-600/20 disabled:opacity-60"
    >
      {state === 'loading' ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <BellRing className="h-4 w-4" />
      )}
      Activar notificaciones
    </button>
  )
}

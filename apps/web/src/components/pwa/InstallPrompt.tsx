'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

const DISMISSED_KEY = 'cambialo-install-dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return

    const handler = (e: Event) => {
      e.preventDefault()
      setPromptEvent(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!promptEvent) return
    await promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    if (outcome === 'accepted') setVisible(false)
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-lg">
          C
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Instala Cambialo</p>
          <p className="text-xs text-zinc-400 mt-0.5">Accede más rápido desde tu pantalla de inicio</p>
        </div>
        <button onClick={handleDismiss} className="shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleDismiss}
          className="flex-1 rounded-xl border border-zinc-700 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Ahora no
        </button>
        <button
          onClick={handleInstall}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          Instalar
        </button>
      </div>
    </div>
  )
}

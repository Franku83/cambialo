'use client'

import { useState } from 'react'
import { MapPin, X } from 'lucide-react'
import { useLocation } from '@/hooks/useLocation'

export default function LocationBanner() {
  const { status, requestLocation } = useLocation()
  const [dismissed, setDismissed] = useState(false)

  if (status !== 'idle' || dismissed) return null

  return (
    <div className="mx-auto mb-4 max-w-5xl px-4">
      <div className="flex items-start justify-between gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-blue-900">¿Mostrar equipos cerca de ti?</p>
            <p className="mt-0.5 text-xs text-blue-700">Filtramos por los más cercanos automáticamente</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={requestLocation}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Usar mi ubicación
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
              >
                No, gracias
              </button>
            </div>
          </div>
        </div>
        <button onClick={() => setDismissed(true)} className="shrink-0 text-blue-400 hover:text-blue-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

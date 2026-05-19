'use client'

import { useState, useEffect } from 'react'

export interface Coords { lat: number; lng: number }
export type LocationStatus = 'idle' | 'granted' | 'denied' | 'manual'

const STORAGE_KEY = 'cambialo_coords'

export function useLocation() {
  const [coords, setCoords] = useState<Coords | null>(null)
  const [range, setRange] = useState(40)
  const [status, setStatus] = useState<LocationStatus>('idle')

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Coords
        setCoords(parsed)
        setStatus('granted')
      } catch { /* ignore */ }
    }
  }, [])

  function requestLocation() {
    if (!navigator.geolocation) { setStatus('denied'); return }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCoords(c)
        setStatus('granted')
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(c))
      },
      () => setStatus('denied')
    )
  }

  function setManualCity(city: string) {
    setStatus('manual')
    sessionStorage.setItem('cambialo_city', city)
  }

  function clearLocation() {
    setCoords(null)
    setStatus('idle')
    sessionStorage.removeItem(STORAGE_KEY)
  }

  return { coords, range, setRange, status, requestLocation, setManualCity, clearLocation }
}

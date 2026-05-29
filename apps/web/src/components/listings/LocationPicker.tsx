'use client'

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Circle, Marker, useMap } from 'react-leaflet'
import { VENEZUELA_STATES, STATE_COORDS } from '@/lib/venezuela-states'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

function findNearestState(lat: number, lng: number): string {
  let nearest = 'DC'
  let minDist = Infinity
  for (const [code, coords] of Object.entries(STATE_COORDS)) {
    const d = Math.sqrt((coords.lat - lat) ** 2 + (coords.lng - lng) ** 2)
    if (d < minDist) { minDist = d; nearest = code }
  }
  return nearest
}

interface LocationPickerProps {
  onLocationChange: (state: string, lat: number, lng: number, rangeKm: number) => void
  initialState?: string | undefined
  initialLat?: number | undefined
  initialLng?: number | undefined
  initialRangeKm?: number | undefined
  gpsCoords?: { lat: number; lng: number } | undefined
  showRadiusPicker?: boolean
}

export function LocationPicker({
  onLocationChange,
  initialState = '',
  initialLat,
  initialLng,
  initialRangeKm = 40,
  gpsCoords,
  showRadiusPicker = true,
}: LocationPickerProps) {
  const [selectedState, setSelectedState] = useState(initialState)
  const [rangeKm, setRangeKm] = useState(initialRangeKm)
  const [useCustomRadius, setUseCustomRadius] = useState(initialRangeKm !== 40)
  const [usingGps, setUsingGps] = useState(false)

  const [center, setCenter] = useState({
    lat: initialLat ?? 10.4806,
    lng: initialLng ?? -66.9036,
  })

  // Sync initial props (e.g. when filter sidebar re-opens)
  useEffect(() => {
    if (initialState) setSelectedState(initialState)
    if (initialLat && initialLng) setCenter({ lat: initialLat, lng: initialLng })
    if (initialRangeKm) {
      setRangeKm(initialRangeKm)
      setUseCustomRadius(initialRangeKm !== 40)
    }
  }, [initialState, initialLat, initialLng, initialRangeKm])

  // Auto-detect nearest state when GPS coords arrive
  useEffect(() => {
    if (!gpsCoords) return
    const nearest = findNearestState(gpsCoords.lat, gpsCoords.lng)
    setSelectedState(nearest)
    setCenter({ lat: gpsCoords.lat, lng: gpsCoords.lng })
    setUsingGps(true)
    const finalRange = useCustomRadius ? rangeKm : 40
    onLocationChange(nearest, gpsCoords.lat, gpsCoords.lng, finalRange)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpsCoords?.lat, gpsCoords?.lng])

  const handleStateChange = (stateCode: string) => {
    setSelectedState(stateCode)
    setUsingGps(false)
    if (!stateCode) {
      onLocationChange('', 0, 0, 40)
      return
    }
    const coords = STATE_COORDS[stateCode]
    if (coords) {
      setCenter(coords)
      const finalRange = useCustomRadius ? rangeKm : 40
      onLocationChange(stateCode, coords.lat, coords.lng, finalRange)
    }
  }

  const handleRadiusTypeChange = (custom: boolean) => {
    setUseCustomRadius(custom)
    const finalRange = custom ? rangeKm : 40
    if (selectedState) {
      onLocationChange(selectedState, center.lat, center.lng, finalRange)
    }
  }

  const handleSliderChange = (val: number) => {
    setRangeKm(val)
    if (selectedState) {
      onLocationChange(selectedState, center.lat, center.lng, val)
    }
  }

  // Define custom pin icon to prevent Next.js image-bundling issues with Leaflet default marker
  const customIcon = typeof window !== 'undefined'
    ? L.divIcon({
        className: 'custom-leaflet-pin',
        html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 border-2 border-white shadow-lg text-white">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                   <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                   <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25A7.5 7.5 0 1119.5 10.5z" />
                 </svg>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      })
    : undefined

  return (
    <div className="space-y-4">
      {/* Dropdown de estados */}
      <select
        value={selectedState}
        onChange={(e) => handleStateChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-green-500 focus:bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgba(22,163,74,0.15)]"
      >
        <option value="">Todos los estados</option>
        {VENEZUELA_STATES.map((state) => (
          <option key={state.code} value={state.code}>
            {state.name}
          </option>
        ))}
      </select>

      {/* GPS badge */}
      {usingGps && (
        <div className="flex items-center gap-1.5 rounded-lg bg-green-50 border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700">
          <span>📍</span>
          <span>Usando tu ubicación GPS</span>
        </div>
      )}

      {/* Mapa y controles — solo si hay un estado seleccionado */}
      {selectedState && (
        <div className="space-y-3">
          {/* Opciones de radio */}
          {showRadiusPicker && <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleRadiusTypeChange(false)}
              className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                !useCustomRadius
                  ? 'border-green-600 bg-green-50/40 text-green-950 shadow-[0_0_0_2px_rgba(22,163,74,0.2)]'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-wider">Radio Sugerido</span>
              <span className="text-[11px] text-slate-500 mt-1 leading-normal">
                Ver publicaciones del área general (40 km).
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleRadiusTypeChange(true)}
              className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                useCustomRadius
                  ? 'border-green-600 bg-green-50/40 text-green-950 shadow-[0_0_0_2px_rgba(22,163,74,0.2)]'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-wider">Radio Personalizado</span>
              <span className="text-[11px] text-slate-500 mt-1 leading-normal">
                Filtrar equipos dentro de una distancia específica.
              </span>
            </button>
          </div>}

          {/* Slider de radio personalizado */}
          {showRadiusPicker && useCustomRadius && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Rango seleccionado:</span>
                <span className="text-green-600 text-sm font-bold">{rangeKm} km</span>
              </div>
              <input
                type="range"
                min={1}
                max={402}
                value={rangeKm}
                onChange={(e) => handleSliderChange(Number(e.target.value))}
                className="w-full accent-green-600"
              />
              <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                <span>1 km</span>
                <span>402 km</span>
              </div>
            </div>
          )}

          {/* Mapa con círculo de cobertura */}
          <div className="relative h-48 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm z-0">
            <MapContainer
              center={[center.lat, center.lng]}
              zoom={8}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <ChangeView center={[center.lat, center.lng]} zoom={useCustomRadius && rangeKm < 15 ? 11 : rangeKm > 150 ? 6 : 8} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              {customIcon && <Marker position={[center.lat, center.lng]} icon={customIcon} />}
              <Circle
                center={[center.lat, center.lng]}
                radius={(useCustomRadius ? rangeKm : 40) * 1000}
                pathOptions={{
                  color: '#16a34a',
                  fillColor: '#16a34a',
                  fillOpacity: 0.1,
                  weight: 2,
                }}
              />
            </MapContainer>
          </div>

          <p className="text-[10px] text-slate-400 text-center leading-normal">
            Los cambios en el mapa se aplican al filtro de ubicación al buscar.
          </p>
        </div>
      )}
    </div>
  )
}

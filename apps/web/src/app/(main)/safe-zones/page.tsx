import type { Metadata } from 'next'
import { MapPin, Clock, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Zonas Seguras',
  description: 'Puntos de encuentro seguros para cerrar tratos en Cambialo',
}

const TYPE_EMOJI: Record<string, string> = {
  mall: '🏬', bank: '🏦', police: '👮', other: '📍',
}

interface SafeZone {
  id: string; name: string; type: string; address: string | null
  city: string; state: string; google_maps_url: string | null
  opening_hours: Record<string, string> | null
}

type CityGroup = Record<string, SafeZone[]>

export default async function SafeZonesPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>
}) {
  const { city } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('safe_zones')
    .select('id, name, type, address, city, state, google_maps_url, opening_hours')
    .eq('is_active', true)
    .order('state')
    .order('city')
    .order('name')

  if (city) query = query.ilike('city', `%${city}%`)

  const { data: zones } = await (query as unknown as Promise<{ data: SafeZone[] | null; error: unknown }>)
  const list = zones ?? []

  // Agrupar por ciudad
  const byCityRaw = list.reduce<CityGroup>((acc, z) => {
    const key = `${z.city}, ${z.state}`
    if (!acc[key]) acc[key] = []
    acc[key].push(z)
    return acc
  }, {})

  const { data: cities } = await supabase
    .from('safe_zones')
    .select('city, state')
    .eq('is_active', true)
    .order('city')

  const uniqueCities = [...new Set((cities ?? []).map((c) => c.city))]

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Zonas seguras</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Cierra tus tratos en estos puntos públicos con cámaras y seguridad.
          </p>
        </div>

        {/* Filtro por ciudad */}
        <div className="flex flex-wrap gap-2">
          <a
            href="/safe-zones"
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${!city ? 'border-blue-500 bg-blue-600/20 text-blue-400' : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'}`}
          >
            Todas
          </a>
          {uniqueCities.map((c) => (
            <a
              key={c}
              href={`/safe-zones?city=${encodeURIComponent(c)}`}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${city === c ? 'border-blue-500 bg-blue-600/20 text-blue-400' : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'}`}
            >
              {c}
            </a>
          ))}
        </div>

        {/* Zonas agrupadas por ciudad */}
        {list.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-12 text-center text-zinc-500">
            <MapPin className="mx-auto mb-3 h-10 w-10 opacity-30" />
            <p>No hay zonas en esta ciudad</p>
          </div>
        ) : (
          Object.entries(byCityRaw).map(([cityLabel, cityZones]) => (
            <div key={cityLabel}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                <MapPin className="mr-1 inline h-3.5 w-3.5" />
                {cityLabel}
              </h2>
              <div className="space-y-3">
                {cityZones.map((zone) => (
                  <div key={zone.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{TYPE_EMOJI[zone.type] ?? '📍'}</span>
                          <h3 className="font-semibold text-white truncate">{zone.name}</h3>
                        </div>
                        {zone.address && (
                          <p className="mt-1 text-xs text-zinc-500">{zone.address}</p>
                        )}
                        {zone.opening_hours && (
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                            {Object.entries(zone.opening_hours).map(([day, hours]) => (
                              <span key={day} className="flex items-center gap-1 text-xs text-zinc-500">
                                <Clock className="h-3 w-3" />
                                <span className="text-zinc-400">{day}:</span> {hours}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {zone.google_maps_url && (
                        <a
                          href={zone.google_maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-700"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Mapa
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { modelToSlug } from '@/lib/slug'

export const metadata: Metadata = {
  title: 'iPhones en Venezuela | Cambialo',
  description: 'Compra y vende iPhones verificados en Venezuela. Todos los modelos desde iPhone 7 hasta iPhone 17 Pro Max.',
  openGraph: { title: 'iPhones en Venezuela | Cambialo', siteName: 'Cambialo' },
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface DeviceModel {
  id: string
  brand: string
  modelName: string
  modelNumber: string
  releaseYear: number | null
  originalStorageOptions: number[]
  imageUrl: string | null
  minPrice?: number | null
  avgRating?: number | null
  activeListings?: number
}

async function getAppleModels(): Promise<DeviceModel[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/device-models?brand=Apple&limit=50`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    return res.json() as Promise<DeviceModel[]>
  } catch { return [] }
}

export default async function ApplePage() {
  const models = await getAppleModels()

  // Agrupar por año para separar series
  const byYear = models.reduce<Record<string, DeviceModel[]>>((acc, m) => {
    const year = String(m.releaseYear ?? 'Otro')
    if (!acc[year]) acc[year] = []
    acc[year]!.push(m)
    return acc
  }, {})
  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a))

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Hero */}
      <div className="mb-10 text-center">
        <div className="mb-4 text-6xl">🍎</div>
        <h1 className="text-3xl font-bold text-slate-900">iPhones en Venezuela</h1>
        <p className="mt-2 text-slate-500">{models.length} modelos disponibles · Todos verificados en Cambialo</p>
      </div>

      {years.map(year => (
        <div key={year} className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-slate-400">{year}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {byYear[year]!.map(model => (
              <Link
                key={model.id}
                href={`/apple/${modelToSlug(model.modelName)}`}
                className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-4 text-center transition-all hover:border-green-400 hover:shadow-md"
              >
                {model.imageUrl ? (
                  <img src={model.imageUrl} alt={model.modelName} className="mb-3 h-16 w-16 object-contain" />
                ) : (
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-3xl">
                    📱
                  </div>
                )}
                <p className="text-sm font-semibold text-slate-900 group-hover:text-green-700">
                  {model.modelName}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {model.originalStorageOptions.join(' · ')}GB
                </p>

                {/* NUEVO — precio mínimo */}
                {model.minPrice ? (
                  <div className="model-pricing w-full mt-2 flex justify-between items-center text-xs">
                    <span className="model-rating text-slate-500">
                      ⭐ {model.avgRating ? model.avgRating.toFixed(1) : '—'}
                    </span>
                    <span className="model-price text-slate-600">
                      Desde <strong className="text-green-600 text-sm font-bold">${model.minPrice}</strong>
                    </span>
                  </div>
                ) : (
                  <span className="model-no-listings mt-2 text-[11px] text-slate-400 block">Sin disponibles</span>
                )}

                {/* Contador de listings activos */}
                {model.activeListings && model.activeListings > 0 ? (
                  <span className="model-count mt-1 text-[11px] text-green-600 font-semibold block">
                    {model.activeListings} disponible{model.activeListings !== 1 ? 's' : ''}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      ))}

      {models.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <p className="text-slate-400">No hay modelos disponibles por el momento.</p>
        </div>
      )}
    </div>
  )
}

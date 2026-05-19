import type { Metadata } from 'next'
import Link from 'next/link'
import { modelToSlug } from '@/lib/slug'

export const metadata: Metadata = {
  title: 'Samsung Galaxy en Venezuela | Cambialo',
  description: 'Compra y vende Samsung Galaxy verificados en Venezuela. Serie S, Serie A y más.',
  openGraph: { title: 'Samsung Galaxy en Venezuela | Cambialo', siteName: 'Cambialo' },
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
}

async function getSamsungModels(): Promise<DeviceModel[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/device-models?brand=Samsung&limit=100`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    return res.json() as Promise<DeviceModel[]>
  } catch { return [] }
}

function getSerie(modelName: string): string {
  if (modelName.includes('Z Fold') || modelName.includes('Z Flip')) return 'Galaxy Z (Foldables)'
  if (modelName.match(/Galaxy S\d/)) return 'Galaxy S (Flagship)'
  if (modelName.match(/Galaxy A\d/)) return 'Galaxy A (Mid-range)'
  return 'Otros'
}

export default async function SamsungPage() {
  const models = await getSamsungModels()

  const bySerie = models.reduce<Record<string, DeviceModel[]>>((acc, m) => {
    const serie = getSerie(m.modelName)
    if (!acc[serie]) acc[serie] = []
    acc[serie]!.push(m)
    return acc
  }, {})

  const serieOrder = ['Galaxy S (Flagship)', 'Galaxy A (Mid-range)', 'Galaxy Z (Foldables)', 'Otros']
  const series = serieOrder.filter(s => bySerie[s]?.length)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-10 text-center">
        <div className="mb-4 text-6xl">🌀</div>
        <h1 className="text-3xl font-bold text-slate-900">Samsung Galaxy en Venezuela</h1>
        <p className="mt-2 text-slate-500">{models.length} modelos disponibles · Todos verificados en Cambialo</p>
      </div>

      {series.map(serie => (
        <div key={serie} className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-slate-400">{serie}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {bySerie[serie]!.sort((a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0)).map(model => (
              <Link
                key={model.id}
                href={`/samsung/${modelToSlug(model.modelName)}`}
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

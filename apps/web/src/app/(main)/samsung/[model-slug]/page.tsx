import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { slugToWords } from '@/lib/slug'
import ModelListings from '@/components/brand/ModelListings'

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

async function getModelBySlug(slug: string): Promise<DeviceModel | null> {
  const search = slugToWords(slug)
  try {
    const res = await fetch(`${API_URL}/api/v1/device-models?brand=Samsung&search=${encodeURIComponent(search)}&limit=5`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const models = await res.json() as DeviceModel[]
    return models[0] ?? null
  } catch { return null }
}

export async function generateMetadata({ params }: { params: Promise<{ 'model-slug': string }> }): Promise<Metadata> {
  const { 'model-slug': slug } = await params
  const model = await getModelBySlug(slug)
  const name = model?.modelName ?? slugToWords(slug)
  return {
    title: `${name} en Venezuela | Cambialo`,
    description: `Compra ${name} verificado en Venezuela. Precios, condición y fotos reales.`,
  }
}

export default async function SamsungModelPage({ params }: { params: Promise<{ 'model-slug': string }> }) {
  const { 'model-slug': slug } = await params
  const model = await getModelBySlug(slug)
  if (!model) notFound()

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-400">
        <Link href="/" className="hover:text-slate-600">Inicio</Link>
        <span>/</span>
        <Link href="/samsung" className="hover:text-slate-600">Samsung</Link>
        <span>/</span>
        <span className="text-slate-700">{model.modelName}</span>
      </nav>

      <div className="mb-8 flex items-center gap-6 rounded-2xl border border-slate-200 bg-white p-6">
        {model.imageUrl ? (
          <img src={model.imageUrl} alt={model.modelName} className="h-24 w-24 object-contain" />
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-5xl">📱</div>
        )}
        <div>
          <p className="text-sm font-medium text-blue-600">Samsung</p>
          <h1 className="text-2xl font-bold text-slate-900">{model.modelName}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {model.releaseYear} · {model.modelNumber} · {model.originalStorageOptions.join(', ')}GB
          </p>
        </div>
      </div>

      <ModelListings brand="Samsung" modelName={model.modelName} modelId={model.id} />
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface Props {
  listingPrice: number
  listingId: string
  sellerWhatsapp?: string
}

const CONDITION_MULT: Record<string, number> = {
  mint: 1.0, good: 0.88, fair: 0.72, poor: 0.55,
}

const BRANDS_OPTS = ['Apple', 'Samsung']
const STORAGE_OPTS = [32, 64, 128, 256, 512, 1024]

export default function TradeInSimulator({ listingPrice, listingId, sellerWhatsapp }: Props) {
  const [brand, setBrand] = useState('')
  const [modelSearch, setModelSearch] = useState('')
  const [models, setModels] = useState<{ id: string; modelName: string; brand: string }[]>([])
  const [selectedModel, setSelectedModel] = useState<{ id: string; modelName: string; brand: string } | null>(null)
  const [storage, setStorage] = useState(128)
  const [battery, setBattery] = useState(80)
  const [condition, setCondition] = useState('good')
  const [estimatedValue, setEstimatedValue] = useState<number | null>(null)
  const [sampleSize, setSampleSize] = useState(0)
  const [calculating, setCalculating] = useState(false)

  const searchModels = async (q: string) => {
    if (q.length < 2) { setModels([]); return }
    const res = await fetch(`${API_URL}/api/v1/device-models?search=${encodeURIComponent(q)}&${brand ? `brand=${brand}&` : ''}limit=8`)
    const data = await res.json() as typeof models
    setModels(data)
  }

  const calculate = async () => {
    if (!selectedModel) return
    setCalculating(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/price-index?deviceModelId=${selectedModel.id}&storageGb=${storage}`)
      const idx = await res.json() as { avgPrice: string; sampleSize: number } | null
      if (!idx || idx.sampleSize < 3) { setEstimatedValue(0); setSampleSize(0); return }
      const avg = Number(idx.avgPrice)
      const condMult = CONDITION_MULT[condition] ?? 0.88
      const batMult = battery >= 85 ? 1.0 : battery >= 70 ? 0.93 : 0.82
      setEstimatedValue(Math.round(avg * condMult * batMult))
      setSampleSize(idx.sampleSize)
    } finally { setCalculating(false) }
  }

  const openWhatsApp = () => {
    if (!sellerWhatsapp || estimatedValue === null) return
    const diff = listingPrice - estimatedValue
    const msg = encodeURIComponent(
      `Hola! Vi tu equipo en Cambialo ($${listingPrice}).\n` +
      `Me interesa hacer trade-in con mi ${selectedModel?.brand} ${selectedModel?.modelName} ` +
      `${storage}GB, ${battery}% batería, condición ${condition}.\n` +
      `Valor estimado por Cambialo: $${estimatedValue}\n` +
      `Diferencia: $${diff > 0 ? diff : 0} a tu favor.\n` +
      `cambialo.app/listings/${listingId}`
    )
    window.open(`https://wa.me/${sellerWhatsapp.replace(/\D/g, '')}?text=${msg}`)
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4 text-green-600" />
        <h3 className="font-semibold text-slate-900">Vendedor acepta Trade-in</h3>
      </div>
      <p className="text-xs text-slate-500">Calcula el valor estimado de tu equipo como parte de pago</p>

      {/* Brand */}
      <div className="flex gap-2">
        {BRANDS_OPTS.map(b => (
          <button
            key={b}
            onClick={() => { setBrand(b); setSelectedModel(null); setModels([]) }}
            className={cn('flex-1 rounded-lg border py-2 text-sm font-medium transition-colors',
              brand === b ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
            )}
          >{b}</button>
        ))}
      </div>

      {/* Modelo */}
      <div className="relative">
        <input
          value={selectedModel ? `${selectedModel.brand} ${selectedModel.modelName}` : modelSearch}
          onChange={e => { setModelSearch(e.target.value); setSelectedModel(null); void searchModels(e.target.value) }}
          placeholder="Buscar modelo de tu equipo..."
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-green-500"
        />
        {models.length > 0 && !selectedModel && (
          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            {models.map(m => (
              <button key={m.id} onClick={() => { setSelectedModel(m); setModels([]) }}
                className="flex w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50">
                {m.brand} {m.modelName}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Storage + Batería + Condición */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Almacenamiento</label>
          <select value={storage} onChange={e => setStorage(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-green-500">
            {STORAGE_OPTS.map(s => <option key={s} value={s}>{s >= 1024 ? `${s / 1024} TB` : `${s} GB`}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Condición</label>
          <select value={condition} onChange={e => setCondition(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-green-500">
            <option value="mint">Nuevo</option>
            <option value="good">Buen estado</option>
            <option value="fair">Regular</option>
            <option value="poor">Con detalles</option>
          </select>
        </div>
      </div>

      {/* Batería */}
      <div>
        <label className="mb-1 flex items-center justify-between text-xs font-medium text-slate-500">
          <span>Salud de batería</span>
          <span className="font-bold text-slate-700">{battery}%</span>
        </label>
        <input type="range" min={50} max={100} value={battery} onChange={e => setBattery(Number(e.target.value))}
          className="w-full accent-green-600" />
      </div>

      <button
        onClick={() => void calculate()}
        disabled={!selectedModel || calculating}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-green-700"
      >
        {calculating && <Loader2 className="h-4 w-4 animate-spin" />}
        Calcular valor estimado
      </button>

      {estimatedValue !== null && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
          {estimatedValue > 0 ? (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-slate-500">Valor estimado:</span>
                <span className="text-xl font-bold text-green-700">${estimatedValue.toLocaleString()}</span>
              </div>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-slate-500">Diferencia a pagar:</span>
                <span className="font-semibold text-slate-900">${Math.max(0, listingPrice - estimatedValue).toLocaleString()}</span>
              </div>
              {sampleSize > 0 && (
                <p className="text-xs text-slate-400">Basado en {sampleSize} listings similares en Cambialo</p>
              )}
              <p className="text-xs text-slate-400 italic">
                Estimación orientativa. El precio final es acuerdo entre las partes.
              </p>
              {sellerWhatsapp && (
                <button onClick={openWhatsApp}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 text-sm font-semibold text-white hover:bg-[#20ba58]">
                  📲 Enviar oferta por WhatsApp
                </button>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-400">No hay datos suficientes para calcular el valor de este equipo aún.</p>
          )}
        </div>
      )}
    </div>
  )
}

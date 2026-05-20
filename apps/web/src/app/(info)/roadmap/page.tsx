import type { Metadata } from 'next'
import { CheckCircle, Clock, Calendar } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Roadmap',
  description: 'Lo que ya hicimos y lo que viene en Cambialo.',
}

const DONE = [
  'Catálogo verificado de smartphones',
  'Verificación visual con código único',
  'KYC de identidad real',
  'Sistema de reputación y reviews',
  'Búsqueda avanzada con filtros',
  'Zonas seguras de intercambio',
  'PWA instalable',
  'Panel de vendedores',
  'Índice de precios del mercado',
]

const IN_PROGRESS = [
  'Homepage pública',
  '2FA para cuentas de alto nivel',
  'Geolocalización y distancia',
]

const UPCOMING = [
  'App nativa Android e iOS',
  'Envíos verificados entre estados',
  'Escrow en cripto (USDT)',
  'TechCheck — diagnóstico certificado',
  'API pública para tiendas',
]

export default function RoadmapPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      {/* Header */}
      <div className="mb-12 text-center">
        <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 mb-4">
          Transparencia total
        </span>
        <h1 className="text-4xl font-bold text-slate-900">Roadmap público</h1>
        <p className="mt-4 text-slate-600 leading-relaxed">
          Lo que ya construimos, lo que estamos construyendo, y lo que viene.
          Sin fechas exactas — solo estados reales.
        </p>
      </div>

      <div className="space-y-8">
        {/* Completado */}
        <div className="rounded-2xl border border-green-200 bg-green-50/40 p-6">
          <div className="flex items-center gap-2 mb-5">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h2 className="text-base font-bold text-green-800">Completado</h2>
          </div>
          <ul className="space-y-2.5">
            {DONE.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* En progreso */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="h-5 w-5 text-amber-600" />
            <h2 className="text-base font-bold text-amber-800">En progreso</h2>
          </div>
          <ul className="space-y-2.5">
            {IN_PROGRESS.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Próximamente */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Calendar className="h-5 w-5 text-slate-500" />
            <h2 className="text-base font-bold text-slate-700">Próximamente</h2>
          </div>
          <ul className="space-y-2.5">
            {UPCOMING.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-10 text-center text-xs text-slate-400">
        Los estados se actualizan conforme avanzamos. No publicamos fechas para no generar falsas expectativas.
      </p>
    </div>
  )
}

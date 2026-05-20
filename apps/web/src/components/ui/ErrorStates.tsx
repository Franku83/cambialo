'use client'

/**
 * Componentes de error reutilizables para errores de red y API.
 * Usados junto con el api-client para mostrar UI diferenciada según el tipo de fallo.
 */

/** Banner global sticky — API caída o problemas técnicos */
export function ApiDownBanner() {
  return (
    <div className="sticky top-14 z-30 w-full border-b border-amber-200 bg-amber-50 px-4 py-2.5">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-sm font-medium text-amber-800">
        <span aria-hidden>⚠️</span>
        <span>Estamos teniendo problemas técnicos. Trabajando en resolverlo.</span>
      </div>
    </div>
  )
}

/** Empty state del feed cuando no hay conexión a internet */
export function ConnectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white py-20 text-center px-6">
      <span className="text-5xl" aria-hidden>📡</span>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-900">Sin conexión</h3>
        <p className="text-sm text-slate-500">
          Verifica tu conexión a internet e intenta de nuevo.
        </p>
      </div>
      <button
        onClick={onRetry}
        className="mt-1 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
      >
        Reintentar
      </button>
    </div>
  )
}

/** Empty state cuando la API está caída o tarda demasiado */
export function ApiError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white py-20 text-center px-6">
      <span className="text-5xl" aria-hidden>🔧</span>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-900">Estamos teniendo problemas</h3>
        <p className="text-sm text-slate-500">
          Nuestro equipo ya está trabajando en esto. Vuelve en unos minutos.
        </p>
      </div>
      <button
        onClick={onRetry}
        className="mt-1 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
      >
        Reintentar
      </button>
    </div>
  )
}

/** Error genérico de timeout */
export function TimeoutError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white py-20 text-center px-6">
      <span className="text-5xl" aria-hidden>⏱️</span>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-900">La respuesta tardó demasiado</h3>
        <p className="text-sm text-slate-500">
          Intenta de nuevo — puede ser una falla temporal.
        </p>
      </div>
      <button
        onClick={onRetry}
        className="mt-1 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
      >
        Reintentar
      </button>
    </div>
  )
}

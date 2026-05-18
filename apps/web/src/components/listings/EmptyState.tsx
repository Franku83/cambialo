import Link from 'next/link'

function PhoneCheckIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto mb-4 text-green-600">
      <rect x="12" y="4" width="24" height="40" rx="4" stroke="currentColor" strokeWidth="2.5" />
      <path d="M20 8h8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="40" r="1.5" fill="currentColor" />
      <path d="M18 24l4 4 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto mb-4 text-slate-300">
      <circle cx="20" cy="20" r="12" stroke="currentColor" strokeWidth="2.5" />
      <path d="M29 29l8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M15 20h10M20 15v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto mb-4 text-slate-300">
      <rect x="12" y="4" width="24" height="40" rx="4" stroke="currentColor" strokeWidth="2.5" />
      <path d="M20 8h8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="40" r="1.5" fill="currentColor" />
    </svg>
  )
}

interface EmptyStateWithFiltersProps {
  onClearFilters: () => void
}

export function EmptyStateWithFilters({ onClearFilters }: EmptyStateWithFiltersProps) {
  return (
    <div className="py-16 text-center">
      <SearchIcon />
      <h3 className="text-lg font-semibold text-slate-900">No encontramos equipos con esos filtros</h3>
      <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto">
        Prueba reduciendo el precio mínimo o la batería mínima requerida.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onClearFilters}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Limpiar filtros
        </button>
        <Link
          href="/sell"
          className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
        >
          Crear alerta de búsqueda
        </Link>
      </div>
    </div>
  )
}

export function EmptyStateCategory({ brand }: { brand: string }) {
  return (
    <div className="py-16 text-center">
      <PhoneIcon />
      <h3 className="text-lg font-semibold text-slate-900">
        Todavía no hay {brand} en Cambialo
      </h3>
      <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto">
        Sé el primero en publicar uno y véndelo más rápido que en Facebook Marketplace.
      </p>
      <div className="mt-6">
        <Link
          href="/sell"
          className="rounded-xl bg-green-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
        >
          Publicar equipo
        </Link>
      </div>
    </div>
  )
}

export function EmptyStateFeed() {
  return (
    <div className="py-16 text-center">
      <PhoneCheckIcon />
      <h3 className="text-lg font-semibold text-slate-900">Cambialo está arrancando</h3>
      <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto">
        Pronto habrá equipos verificados disponibles. Regístrate para ser el primero en enterarte.
      </p>
      <div className="mt-6">
        <Link
          href="/register"
          className="rounded-xl bg-green-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
        >
          Unirme a la lista de espera
        </Link>
      </div>
    </div>
  )
}

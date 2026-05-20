'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { X, SlidersHorizontal } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useLocation } from '@/hooks/useLocation'

const BRANDS = ['Apple', 'Samsung']
const CONDITIONS = [
  { value: 'mint', label: 'Nuevo' },
  { value: 'good', label: 'Bueno' },
  { value: 'fair', label: 'Regular' },
  { value: 'poor', label: 'Detalles' },
]
const STORAGE = ['64', '128', '256', '512']

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'bg-green-600 text-white'
          : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300',
      )}
    >
      {children}
    </button>
  )
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-1">
      <span className="text-sm text-slate-700">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-5 w-9 rounded-full transition-colors',
          checked ? 'bg-green-600' : 'bg-slate-200',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0.5',
          )}
        />
      </button>
    </label>
  )
}

interface Filters {
  brands: string[]
  conditions: string[]
  storage: string[]
  minPrice: string
  maxPrice: string
  minBattery: number
  onlyVerified: boolean
  acceptsOffers: boolean
  includesBox: boolean
  rangeKm: number
}

function parseFilters(params: URLSearchParams): Filters {
  return {
    brands: params.getAll('brand'),
    conditions: params.getAll('condition'),
    storage: params.getAll('storage'),
    minPrice: params.get('minPrice') ?? '',
    maxPrice: params.get('maxPrice') ?? '',
    minBattery: Number(params.get('minBattery') ?? 0),
    onlyVerified: params.get('verified') === '1',
    acceptsOffers: params.get('offers') === '1',
    includesBox: params.get('box') === '1',
    rangeKm: Number(params.get('rangeKm') ?? 40),
  }
}

function countActiveFilters(f: Filters) {
  return (
    f.brands.length +
    f.conditions.length +
    f.storage.length +
    (f.minPrice ? 1 : 0) +
    (f.maxPrice ? 1 : 0) +
    (f.minBattery > 0 ? 1 : 0) +
    (f.onlyVerified ? 1 : 0) +
    (f.acceptsOffers ? 1 : 0) +
    (f.includesBox ? 1 : 0)
  )
}

function FiltersContent({
  filters,
  onApply,
  onClear,
  status,
  coords,
}: {
  filters: Filters
  onApply: (f: Filters) => void
  onClear: () => void
  status: string
  coords: { lat: number; lng: number } | null
}) {
  const [local, setLocal] = useState<Filters>(filters)

  const toggle = <K extends 'brands' | 'conditions' | 'storage'>(
    key: K,
    value: string,
  ) => {
    setLocal((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }))
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Filtros</h2>
        <button onClick={onClear} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
          Limpiar todo
        </button>
      </div>

      {/* Marca */}
      <div>
        <p className="mb-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Marca</p>
        <div className="flex flex-wrap gap-1.5">
          {BRANDS.map((b) => (
            <Chip key={b} active={local.brands.includes(b.toLowerCase())} onClick={() => toggle('brands', b.toLowerCase())}>
              {b}
            </Chip>
          ))}
        </div>
      </div>

      {/* Condición */}
      <div>
        <p className="mb-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Condición</p>
        <div className="flex flex-wrap gap-1.5">
          {CONDITIONS.map((c) => (
            <Chip key={c.value} active={local.conditions.includes(c.value)} onClick={() => toggle('conditions', c.value)}>
              {c.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Precio */}
      <div>
        <p className="mb-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Precio USD</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={local.minPrice}
            onChange={(e) => setLocal((p) => ({ ...p, minPrice: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-900 focus:border-green-500 focus:outline-none"
          />
          <span className="text-slate-400">—</span>
          <input
            type="number"
            placeholder="Max"
            value={local.maxPrice}
            onChange={(e) => setLocal((p) => ({ ...p, maxPrice: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-900 focus:border-green-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Batería */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Batería mínima</p>
          <span className="text-xs font-semibold text-green-600">{local.minBattery}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={local.minBattery}
          onChange={(e) => setLocal((p) => ({ ...p, minBattery: Number(e.target.value) }))}
          className="w-full accent-green-600"
        />
      </div>

      {/* Almacenamiento */}
      <div>
        <p className="mb-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Almacenamiento</p>
        <div className="flex flex-wrap gap-1.5">
          {STORAGE.map((s) => (
            <Chip key={s} active={local.storage.includes(s)} onClick={() => toggle('storage', s)}>
              {s}GB
            </Chip>
          ))}
        </div>
      </div>

      {/* Geolocation Range Slider */}
      {status === 'granted' && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Rango de distancia</p>
            <span className="text-xs font-semibold text-green-600">{local.rangeKm} km</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={local.rangeKm}
            onChange={(e) => setLocal((p) => ({ ...p, rangeKm: Number(e.target.value) }))}
            className="w-full accent-green-600"
          />
        </div>
      )}

      {/* Switches */}
      <div className="space-y-1 border-t border-slate-100 pt-3">
        <Toggle
          checked={local.onlyVerified}
          onChange={(v) => setLocal((p) => ({ ...p, onlyVerified: v }))}
          label="Solo verificados"
        />
        <Toggle
          checked={local.acceptsOffers}
          onChange={(v) => setLocal((p) => ({ ...p, acceptsOffers: v }))}
          label="Acepta ofertas"
        />
        <Toggle
          checked={local.includesBox}
          onChange={(v) => setLocal((p) => ({ ...p, includesBox: v }))}
          label="Incluye caja"
        />
      </div>

      <button
        onClick={() => onApply(local)}
        className="w-full rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
      >
        Aplicar filtros
      </button>
    </div>
  )
}

export function FilterSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)

  const { status, coords } = useLocation()
  const filters = parseFilters(searchParams)
  const activeCount = countActiveFilters(filters)

  const applyFilters = useCallback(
    (f: Filters) => {
      const params = new URLSearchParams()
      f.brands.forEach((b) => params.append('brand', b))
      f.conditions.forEach((c) => params.append('condition', c))
      f.storage.forEach((s) => params.append('storage', s))
      if (f.minPrice) params.set('minPrice', f.minPrice)
      if (f.maxPrice) params.set('maxPrice', f.maxPrice)
      if (f.minBattery > 0) params.set('minBattery', String(f.minBattery))
      if (f.onlyVerified) params.set('verified', '1')
      if (f.acceptsOffers) params.set('offers', '1')
      if (f.includesBox) params.set('box', '1')

      // Si hay coords activas:
      if (status === 'granted' && coords?.lat && coords?.lng) {
        params.set('lat', String(coords.lat))
        params.set('lng', String(coords.lng))
        params.set('rangeKm', String(f.rangeKm))
      }

      router.push(`${pathname}?${params.toString()}`)
      setMobileOpen(false)
    },
    [router, pathname, status, coords],
  )

  const clearFilters = useCallback(() => {
    router.push(pathname)
    setMobileOpen(false)
  }, [router, pathname])

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-[112px] rounded-xl border border-slate-200 bg-white p-4">
          <FiltersContent filters={filters} onApply={applyFilters} onClear={clearFilters} status={status} coords={coords} />
        </div>
      </aside>

      {/* Mobile: FAB button */}
      <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-slate-800"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros {activeCount > 0 && `(${activeCount})`}
        </button>
      </div>

      {/* Mobile: bottom sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/30 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5 lg:hidden"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="h-1 w-12 rounded-full bg-slate-200 mx-auto" />
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
              <FiltersContent filters={filters} onApply={applyFilters} onClear={clearFilters} status={status} coords={coords} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

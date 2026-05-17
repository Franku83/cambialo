'use client'

import { useSearchBox, useRefinementList, useRange, useToggleRefinement } from 'react-instantsearch'
import { useCallback, useState, useRef } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ListingCondition } from '@cambialo/types'

const CONDITION_LABELS: Record<ListingCondition, string> = {
  mint: 'Nuevo',
  good: 'Bueno',
  fair: 'Regular',
  poor: 'Con detalles',
}

function SearchInput() {
  const { query, refine } = useSearchBox()
  const [value, setValue] = useState(query)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value
      setValue(v)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => refine(v), 300)
    },
    [refine],
  )

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <input
        value={value}
        onChange={handleChange}
        placeholder="Buscar modelo, ciudad..."
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 pl-9 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-blue-500 transition-colors"
      />
      {value && (
        <button
          onClick={() => { setValue(''); refine('') }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

function ConditionFilter() {
  const { items, refine } = useRefinementList({ attribute: 'condition', limit: 4 })

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Condición</p>
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(CONDITION_LABELS) as ListingCondition[]).map((cond) => {
          const item = items.find((i) => i.value === cond)
          const isRefined = item?.isRefined ?? false
          return (
            <button
              key={cond}
              onClick={() => refine(cond)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors',
                isRefined
                  ? 'border-blue-500 bg-blue-600/20 text-blue-400'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300',
              )}
            >
              {CONDITION_LABELS[cond]}
              {item && <span className="ml-1 text-zinc-600">({item.count})</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PriceRangeFilter() {
  const { start, range, refine } = useRange({ attribute: 'price_usd' })
  const [min, setMin] = useState(start[0] !== -Infinity ? String(start[0]) : '')
  const [max, setMax] = useState(start[1] !== Infinity ? String(start[1]) : '')

  const apply = () => {
    refine([
      min ? Number(min) : range.min ?? 0,
      max ? Number(max) : range.max ?? 99999,
    ])
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Precio (USD)</p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder={`Mín ${range.min ? `($${range.min})` : ''}`}
          value={min}
          onChange={(e) => setMin(e.target.value)}
          onBlur={apply}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-blue-500"
        />
        <span className="shrink-0 text-zinc-600">—</span>
        <input
          type="number"
          placeholder={`Máx ${range.max ? `($${range.max})` : ''}`}
          value={max}
          onChange={(e) => setMax(e.target.value)}
          onBlur={apply}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-blue-500"
        />
      </div>
    </div>
  )
}

function BatteryFilter() {
  const { start, refine } = useRange({ attribute: 'battery_health' })
  const value = (start[0] !== undefined && start[0] !== -Infinity) ? start[0] : 0
  const pcts = [0, 70, 80, 85, 90]

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
        Batería mínima — {value > 0 ? `≥ ${value}%` : 'Cualquiera'}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {pcts.map((pct) => (
          <button
            key={pct}
            onClick={() => refine([pct, 100])}
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition-colors',
              value === pct
                ? 'border-blue-500 bg-blue-600/20 text-blue-400'
                : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600',
            )}
          >
            {pct === 0 ? 'Cualquiera' : `≥ ${pct}%`}
          </button>
        ))}
      </div>
    </div>
  )
}

function ToggleFilter({ attribute, label }: { attribute: string; label: string }) {
  const { value, refine } = useToggleRefinement({ attribute, on: true })
  return (
    <label className="flex cursor-pointer items-center justify-between">
      <span className="text-sm text-zinc-300">{label}</span>
      <button
        onClick={() => refine(value)}
        className={cn(
          'relative h-5 w-9 rounded-full transition-colors',
          value.isRefined ? 'bg-blue-600' : 'bg-zinc-700',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
            value.isRefined ? 'translate-x-4' : 'translate-x-0.5',
          )}
        />
      </button>
    </label>
  )
}

function CityFilter() {
  const { items, refine, searchForItems } = useRefinementList({
    attribute: 'city',
    limit: 8,
    showMore: true,
    showMoreLimit: 20,
  })
  const [search, setSearch] = useState('')

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Ciudad</p>
      <input
        placeholder="Buscar ciudad..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); searchForItems(e.target.value) }}
        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-blue-500"
      />
      <div className="max-h-36 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <label key={item.label} className="flex cursor-pointer items-center gap-2 py-0.5">
            <input
              type="checkbox"
              checked={item.isRefined}
              onChange={() => refine(item.value)}
              className="h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-800 accent-blue-500"
            />
            <span className="text-sm text-zinc-300">{item.label}</span>
            <span className="ml-auto text-xs text-zinc-600">{item.count}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

interface FilterPanelProps {
  className?: string
}

export function FilterPanel({ className }: FilterPanelProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:border-zinc-700 lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filtros
      </button>

      {/* Panel */}
      <div
        className={cn(
          'flex flex-col gap-5',
          // Mobile: colapsable
          open ? 'flex' : 'hidden',
          // Desktop: siempre visible
          'lg:flex',
          className,
        )}
      >
        <SearchInput />
        <ConditionFilter />
        <PriceRangeFilter />
        <BatteryFilter />
        <CityFilter />
        <div className="space-y-2.5">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Opciones</p>
          <ToggleFilter attribute="verification_status" label="Solo verificados" />
          <ToggleFilter attribute="accepts_offers" label="Acepta ofertas" />
        </div>
      </div>
    </>
  )
}

'use client'

import { X } from 'lucide-react'

interface ActiveFilterChipsProps {
  filters: Record<string, string | string[] | number | boolean | undefined | null>
  onRemove: (key: string) => void
  onClearAll: () => void
  labelMap: Record<string, string>
}

function formatValue(value: string | string[] | number | boolean | undefined | null): string {
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  return String(value)
}

export function ActiveFilterChips({ filters, onRemove, onClearAll, labelMap }: ActiveFilterChipsProps) {
  const active = Object.entries(filters).filter(([, v]) => {
    if (v === undefined || v === null || v === '') return false
    if (Array.isArray(v) && v.length === 0) return false
    return true
  })

  if (active.length === 0) return null

  return (
    <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {active.map(([key, value]) => (
        <div
          key={key}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-300"
        >
          <span className="text-zinc-500">{labelMap[key] ?? key}:</span>
          <span>{formatValue(value)}</span>
          <button
            onClick={() => onRemove(key)}
            className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-zinc-700 hover:text-white"
            aria-label={`Quitar filtro ${labelMap[key] ?? key}`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      <button
        onClick={onClearAll}
        className="shrink-0 px-2 text-xs font-medium text-blue-400 transition-colors hover:text-blue-300"
      >
        Limpiar todo
      </button>
    </div>
  )
}

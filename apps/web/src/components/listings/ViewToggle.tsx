'use client'

import { useState, useEffect } from 'react'
import { LayoutList, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ViewMode } from './ListingCard'

export function ViewToggle({ onChange }: { onChange: (mode: ViewMode) => void }) {
  const [mode, setMode] = useState<ViewMode>('list')

  useEffect(() => {
    const saved = (localStorage.getItem('cambialo_view_mode') as ViewMode) || 'list'
    setMode(saved)
    onChange(saved)
  }, [onChange])

  const toggle = (newMode: ViewMode) => {
    setMode(newMode)
    localStorage.setItem('cambialo_view_mode', newMode)
    onChange(newMode)
  }

  return (
    <div className="hidden md:flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5">
      <button
        onClick={() => toggle('list')}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
          mode === 'list'
            ? 'bg-green-600 text-white'
            : 'text-slate-400 hover:text-slate-600',
        )}
        title="Vista lista"
      >
        <LayoutList className="h-4 w-4" />
      </button>
      <button
        onClick={() => toggle('grid')}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
          mode === 'grid'
            ? 'bg-green-600 text-white'
            : 'text-slate-400 hover:text-slate-600',
        )}
        title="Vista cuadrícula"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
    </div>
  )
}

'use client'

import { Box, Zap, Headphones } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccessoriesChecklistProps {
  includesBox: boolean
  onBoxChange: (v: boolean) => void
  includesCharger: boolean
  onChargerChange: (v: boolean) => void
  includesEarphones: boolean
  onEarphonesChange: (v: boolean) => void
}

export default function AccessoriesChecklist({
  includesBox, onBoxChange,
  includesCharger, onChargerChange,
  includesEarphones, onEarphonesChange,
}: AccessoriesChecklistProps) {
  const items = [
    { label: 'Caja original',    Icon: Box,        value: includesBox,      onChange: onBoxChange },
    { label: 'Cargador original', Icon: Zap,        value: includesCharger,  onChange: onChargerChange },
    { label: 'Auriculares',      Icon: Headphones,  value: includesEarphones, onChange: onEarphonesChange },
  ]

  return (
    <div className="rounded-2xl border border-zinc-800 overflow-hidden">
      {items.map((item, i) => (
        <div
          key={item.label}
          className={cn(
            'flex items-center justify-between p-4',
            i !== items.length - 1 && 'border-b border-zinc-800',
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                item.value ? 'bg-blue-600/10 text-blue-400' : 'bg-zinc-800 text-zinc-500',
              )}
            >
              <item.Icon className="w-4 h-4" />
            </div>
            <span className={cn('text-sm font-medium', item.value ? 'text-white' : 'text-zinc-400')}>
              {item.label}
            </span>
          </div>

          <button
            type="button"
            onClick={() => item.onChange(!item.value)}
            className={cn(
              'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200',
              item.value ? 'bg-blue-600' : 'bg-zinc-700',
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200',
                item.value ? 'translate-x-4' : 'translate-x-0',
              )}
            />
          </button>
        </div>
      ))}
    </div>
  )
}

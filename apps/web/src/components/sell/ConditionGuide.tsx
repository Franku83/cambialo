'use client'

import { cn } from '@/lib/utils'
import type { ListingCondition } from '@cambialo/types'

interface ConditionGuideProps {
  value: ListingCondition | null
  onChange: (v: ListingCondition) => void
}

const CONDITIONS: {
  id: ListingCondition
  emoji: string
  title: string
  desc: string
  selected: string
}[] = [
  {
    id: 'mint',
    emoji: '🌟',
    title: 'Nuevo / Sellado',
    desc: 'Sin uso, en caja original o como nuevo',
    selected: 'bg-emerald-600/20 border-emerald-600/50',
  },
  {
    id: 'good',
    emoji: '✨',
    title: 'Buen estado',
    desc: 'Uso normal, sin ralladuras visibles',
    selected: 'bg-blue-600/20 border-blue-600/50',
  },
  {
    id: 'fair',
    emoji: '👍',
    title: 'Estado regular',
    desc: 'Algunas marcas de uso, funciona perfecto',
    selected: 'bg-yellow-600/20 border-yellow-600/50',
  },
  {
    id: 'poor',
    emoji: '🔧',
    title: 'Con detalles',
    desc: 'Visible desgaste, funciona correctamente',
    selected: 'bg-zinc-600/20 border-zinc-600/50',
  },
]

export default function ConditionGuide({ value, onChange }: ConditionGuideProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {CONDITIONS.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onChange(c.id)}
          className={cn(
            'flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all duration-150 active:scale-[0.98]',
            value === c.id
              ? c.selected
              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700',
          )}
        >
          <span className="text-2xl mb-2">{c.emoji}</span>
          <h4 className="font-bold text-sm text-white mb-0.5">{c.title}</h4>
          <p className="text-[11px] text-zinc-500 leading-tight">{c.desc}</p>
        </button>
      ))}
    </div>
  )
}

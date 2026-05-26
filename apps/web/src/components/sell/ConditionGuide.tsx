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
    title: 'Nuevo / Como nuevo',
    desc: 'Sin uso, en caja original o como nuevo',
    selected: 'bg-emerald-50/70 border-emerald-500/50 text-emerald-950',
  },
  {
    id: 'good',
    emoji: '✨',
    title: 'Buen estado',
    desc: 'Uso normal, sin ralladuras visibles',
    selected: 'bg-blue-50/70 border-blue-500/50 text-blue-950',
  },
  {
    id: 'fair',
    emoji: '👍',
    title: 'Estado regular',
    desc: 'Algunas marcas de uso, funciona perfecto',
    selected: 'bg-amber-50/70 border-amber-500/50 text-amber-950',
  },
  {
    id: 'poor',
    emoji: '🔧',
    title: 'Con detalles / Malo',
    desc: 'Visible desgaste, funciona correctamente',
    selected: 'bg-slate-100 border-slate-400 text-slate-900',
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
              : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800',
          )}
        >
          <span className="text-2xl mb-2">{c.emoji}</span>
          <h4 className="font-bold text-sm text-slate-900 mb-0.5">{c.title}</h4>
          <p className="text-[11px] text-slate-500 leading-tight">{c.desc}</p>
        </button>
      ))}
    </div>
  )
}

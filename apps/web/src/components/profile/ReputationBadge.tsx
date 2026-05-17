import { cn } from '@/lib/utils'

interface ReputationBadgeProps {
  score: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

function getLevel(score: number): { label: string; color: string; bg: string; border: string } {
  if (score >= 80) return { label: 'Top Seller', color: 'text-emerald-400', bg: 'bg-emerald-600/20', border: 'border-emerald-600/40' }
  if (score >= 60) return { label: 'Verificado',  color: 'text-blue-400',    bg: 'bg-blue-600/20',    border: 'border-blue-600/40' }
  if (score >= 30) return { label: 'Confiable',   color: 'text-yellow-400',  bg: 'bg-yellow-600/20',  border: 'border-yellow-600/40' }
  return               { label: 'Nuevo',         color: 'text-zinc-400',    bg: 'bg-zinc-800',       border: 'border-zinc-700' }
}

export function ReputationBadge({ score, showLabel = true, size = 'md' }: ReputationBadgeProps) {
  const { label, color, bg, border } = getLevel(score)
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
  const scoreSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'

  return (
    <div className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1', bg, border)}>
      <span className={cn('font-bold', scoreSize, color)}>{score}</span>
      {showLabel && <span className={cn('font-medium', textSize, color)}>{label}</span>}
    </div>
  )
}

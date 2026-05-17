import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { StarRating } from './StarRating'

interface ReviewCardProps {
  rating: number
  comment?: string | null
  transactionType: 'buy' | 'sell'
  createdAt: string
  reviewer: { username: string; avatarUrl?: string | null }
}

export function ReviewCard({ rating, comment, transactionType, createdAt, reviewer }: ReviewCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {reviewer.avatarUrl ? (
            <img src={reviewer.avatarUrl} alt={reviewer.username} className="h-7 w-7 rounded-full object-cover" />
          ) : (
            <div className="h-7 w-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-300">
              {reviewer.username[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <span className="text-sm text-zinc-300">@{reviewer.username}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${transactionType === 'buy' ? 'bg-blue-600/20 text-blue-400' : 'bg-emerald-600/20 text-emerald-400'}`}>
            {transactionType === 'buy' ? 'Comprador' : 'Vendedor'}
          </span>
        </div>
        <StarRating value={rating} readOnly size="sm" />
      </div>
      {comment && <p className="text-sm text-zinc-400 leading-relaxed">{comment}</p>}
      <p className="text-xs text-zinc-600">
        {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: es })}
      </p>
    </div>
  )
}

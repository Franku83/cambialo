'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  readOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = { sm: 16, md: 24, lg: 32 }

export function StarRating({ value, onChange, readOnly = false, size = 'md' }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)
  const px = sizeMap[size]
  const active = readOnly ? value : (hovered || value)

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange?.(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          className={cn('transition-transform', !readOnly && 'hover:scale-110 cursor-pointer', readOnly && 'cursor-default')}
          aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
        >
          <Star
            style={{ width: px, height: px }}
            className={cn(
              'transition-colors',
              star <= active ? 'fill-yellow-400 text-yellow-400' : 'fill-transparent text-zinc-700',
            )}
          />
        </button>
      ))}
    </div>
  )
}

import { Star } from 'lucide-react'

interface RatingStarsProps {
  rating: number
  reviewCount: number
}

export const RatingStars = ({ rating, reviewCount }: RatingStarsProps) => {
  return (
    <div className="flex items-center gap-2 text-xs text-white/70">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Star
            key={idx}
            size={14}
            className={idx < Math.round(rating) ? 'fill-[#D97706] text-[#D97706]' : 'text-white/25'}
          />
        ))}
      </div>
      <span>
        {rating.toFixed(1)} ({reviewCount})
      </span>
    </div>
  )
}

type Props = { rating: number } // 0-5

export function RatingStars({ rating }: Props) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <div className="flex items-center gap-1" aria-label={`Rating ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const isFull = i < full
        const isHalf = !isFull && i === full && half
        return <Star key={i} filled={isFull} half={isHalf} />
      })}
    </div>
  )
}

function Star({ filled, half }: { filled?: boolean; half?: boolean }) {
  const base = "h-4 w-4 inline-block"
  if (filled) return <span className={`${base} text-yellow-400`}>{"★"}</span>
  if (half) return <span className={`${base} text-yellow-400`}>{"☆"}</span>
  return <span className={`${base} text-white/40`}>{"☆"}</span>
}

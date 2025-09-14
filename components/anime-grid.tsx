import { type Anime, AnimeCard } from "./anime-card"

export function AnimeGrid({ items }: { items: Anime[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((a) => (
        <AnimeCard key={a.id} anime={a} />
      ))}
    </div>
  )
}

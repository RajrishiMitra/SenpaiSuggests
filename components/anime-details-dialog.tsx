"use client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import ImageWithFade from "./image-with-fade"
import { getAnimeImage } from "@/lib/get-anime-image"

type JikanAnime = {
  mal_id: number
  title: string
  images?: { jpg?: { image_url?: string }; webp?: { image_url?: string } }
  synopsis?: string
  score?: number
  url?: string
  genres?: { name: string }[]
}

export function AnimeDetailsDialog({ anime }: { anime: JikanAnime }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="btn-glass glow-border">More Info</button>
      </DialogTrigger>
      <DialogContent className="glass neon-border relative overflow-hidden">
        {/* ambient animated background */}
        <div aria-hidden="true" className="dialog-ambient" />
        <DialogHeader>
          <DialogTitle className="title-xl neon-text">{anime.title}</DialogTitle>
          {typeof anime.score === "number" ? (
            <DialogDescription className="neon-body">Score: {anime.score.toFixed(1)}</DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-5">
          {/* Poster in framed glass */}
          <div className="glass-frame">
            <ImageWithFade
              src={getAnimeImage(anime) || "/placeholder.svg?height=380&width=260&query=anime%20poster"}
              alt={anime.title}
              className="w-full h-auto rounded-lg"
            />
          </div>

          <div className="min-w-0 space-y-4">
            {/* Overview */}
            <h4 className="section-underline text-sm font-semibold text-white/90">Overview</h4>
            <div className="glass rounded-xl p-4 max-h-56 overflow-auto body-leading text-sm md:text-base text-white/85">
              <p className="opacity-90">{anime.synopsis || "No synopsis available."}</p>
            </div>

            {/* Genres */}
            {anime.genres?.length ? (
              <div>
                <h4 className="section-underline text-sm font-semibold text-white/90">Genres</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {anime.genres.map((g) => (
                    <span key={g.name} className="pill-neon">
                      {g.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Details */}
            <div>
              <h4 className="section-underline text-sm font-semibold text-white/90">Details</h4>
              {anime.url ? (
                <a
                  href={anime.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-glass glow-border inline-block mt-3"
                >
                  View on MyAnimeList
                </a>
              ) : (
                <p className="text-sm text-white/70 mt-3">External link unavailable.</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

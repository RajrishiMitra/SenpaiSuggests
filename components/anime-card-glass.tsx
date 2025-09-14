"use client"

import Image from "next/image"
import Link from "next/link"
import { useFavorites } from "@/hooks/use-favorites"

export type Anime = {
  id: number | string
  title: string
  synopsis?: string
  genres?: string[]
  score?: number
  image?: string
  url?: string
}

function truncateWords(text: string, maxWords = 15) {
  if (!text || text.trim() === "") return ""
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length <= maxWords) return text
  return words.slice(0, maxWords).join(" ") + "..."
}

export function AnimeCardGlass({ anime }: { anime: Anime }) {
  const { toggle, has } = useFavorites()
  const saved = has(Number(anime.id))

  return (
    <div className="group relative card-neumorphic overflow-hidden transition-all duration-300 hover:scale-105">
      {/* Main card content - always visible */}
      <div className="relative h-64 w-full">
        <Image
          src={anime.image || "/placeholder.svg?height=320&width=240&query=anime%20poster"}
          alt={anime.title}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-all duration-500 group-hover:brightness-50"
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />

        {/* Default content - title and genres */}
        <div className="absolute bottom-0 left-0 right-0 p-4 transition-opacity duration-300 group-hover:opacity-0">
          <h3 className="text-pretty text-base font-bold text-neumorphic mb-2 drop-shadow-lg leading-tight">
            {anime.title}
          </h3>

          {anime.genres?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {anime.genres.slice(0, 3).map((g) => (
                <span key={g} className="pill-neumorphic text-[10px]">
                  {g}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-center items-center space-y-4 p-4">
          {/* Score - appears first */}
          <div className="text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
            <span className="text-4xl font-bold text-neumorphic block">
              {typeof anime.score === "number" ? anime.score.toFixed(1) : "N/A"}
            </span>
          </div>

          {/* Description - appears second with proper truncation */}
          <div className="text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-150">
            <p className="text-sm text-muted-neumorphic max-w-[200px] leading-relaxed line-clamp-2">
              {anime.synopsis && anime.synopsis.trim()
                ? truncateWords(anime.synopsis, 15)
                : "Description not available."}
            </p>
          </div>

          {/* More Info Button - appears last with active tab styling */}
          <Link
            href={`/anime/${anime.id}`}
            className="opacity-0 group-hover:opacity-100 transition-all duration-300 delay-225 btn-neumorphic px-6 py-2.5 text-sm font-bold"
          >
            More Info
          </Link>
        </div>
      </div>
    </div>
  )
}

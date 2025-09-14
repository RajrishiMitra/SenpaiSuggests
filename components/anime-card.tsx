"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { RatingStars } from "./rating-stars"
import styles from "./anime-card.module.css"
import Link from "next/link"

export type Anime = {
  id: string
  title: string
  genres: string[]
  synopsis: string
  rating: number
  cover?: string
  image?: string
}

export function AnimeCard({ anime }: { anime: Anime }) {
  const [saved, setSaved] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const favs: Anime[] = JSON.parse(localStorage.getItem("animo_favorites") || "[]")
      setSaved(!!favs.find((f) => f.id === anime.id))
    } catch {}
  }, [anime.id])

  function toggleFavorite() {
    try {
      const key = "animo_favorites"
      const favs: Anime[] = JSON.parse(localStorage.getItem(key) || "[]")
      const exists = favs.find((f) => f.id === anime.id)
      let next = favs
      if (exists) {
        next = favs.filter((f) => f.id !== anime.id)
        setSaved(false)
      } else {
        next = [...favs, anime]
        setSaved(true)
      }
      localStorage.setItem(key, JSON.stringify(next))
    } catch {}
  }

  const src =
    anime.cover ||
    anime.image ||
    `/placeholder.svg?height=288&width=512&query=anime%20cover%20${encodeURIComponent(anime.title)}`

  return (
    <div className={`${styles.scene}`}>
      <div className={`${styles.card} relative h-72 w-full transition-transform duration-200 will-change-transform`}>
        <div className={`${styles.face} absolute inset-0 overflow-hidden rounded-xl frame-neumorphic`}>
          <Image
            src={src || "/placeholder.svg"}
            alt={`${anime.title} cover art`}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className={`object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
            onLoadingComplete={() => setLoaded(true)}
          />
          {/* translucent overlay so titles/scores pop */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-base md:text-lg font-semibold text-neumorphic">{anime.title}</h3>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {anime.genres.slice(0, 3).map((g) => (
                <span key={g} className="pill-neumorphic">
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div
          className={`${styles.face} ${styles.back} absolute inset-0 rounded-xl card-neumorphic flex flex-col justify-between`}
        >
          <div>
            <h3 className="text-base md:text-lg font-semibold text-neumorphic">{anime.title}</h3>
            <p className="mt-2 text-sm md:text-base text-muted-neumorphic body-leading line-clamp-3">
              {anime.synopsis}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <RatingStars rating={anime.rating} />
            <div className="flex items-center gap-2">
              <Link
                href={`/anime/${anime.id}`}
                className="btn-neumorphic px-3 py-1.5 text-xs"
                aria-label={`More info about ${anime.title}`}
              >
                More Info
              </Link>
              <button
                onClick={toggleFavorite}
                className="btn-neumorphic px-3 py-1.5 text-xs"
                aria-pressed={saved}
                aria-label={saved ? "Remove from favorites" : "Save to favorites"}
                title={saved ? "Saved" : "Save"}
              >
                {saved ? "Saved" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

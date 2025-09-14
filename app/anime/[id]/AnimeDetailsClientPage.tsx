"use client"

import React from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { BackButton } from "@/components/back-button"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Star, Check, X, Eye, EyeOff, BookOpen } from "lucide-react"
import { getCachedData, setCachedData } from "@/lib/cache"

const JIKAN = "https://api.jikan.moe/v4"

async function getDetails(id: string) {
  const [detailRes, charsRes] = await Promise.all([
    fetch(`${JIKAN}/anime/${id}/full`, { next: { revalidate: 3600 } }),
    fetch(`${JIKAN}/anime/${id}/characters`, { next: { revalidate: 3600 } }),
  ])
  if (!detailRes.ok) throw new Error("Failed to load details")
  const detailJson = await detailRes.json()
  const anime = detailJson?.data
  let characters: any[] = []
  if (charsRes.ok) {
    const charsJson = await charsRes.json()
    characters = charsJson?.data || []
  }
  return { anime, characters }
}

async function getYouTubeTrailerId(title: string, fallbackId?: string | null): Promise<string | null> {
  if (fallbackId) return fallbackId
  if (!process.env.YOUTUBE_API_KEY) return null

  const cacheKey = `youtube_${title}`
  const cached = getCachedData(cacheKey)
  if (cached) return cached

  try {
    const q = encodeURIComponent(`${title} trailer`)
    const r = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${q}&key=${process.env.YOUTUBE_API_KEY}`,
      { cache: "force-cache" },
    )
    const j = await r.json()
    const videoId = j?.items?.[0]?.id?.videoId ?? null
    setCachedData(cacheKey, videoId)
    return videoId
  } catch {
    return null
  }
}

function platformSearchLinks(title: string) {
  const q = encodeURIComponent(title)
  return [
    { name: "Crunchyroll", href: `https://www.crunchyroll.com/search?from=search&q=${q}` },
    { name: "Netflix", href: `https://www.netflix.com/search?q=${q}` },
    { name: "Hulu", href: `https://www.hulu.com/search?q=${q}` },
    { name: "Prime Video", href: `https://www.amazon.com/s?k=${q}+anime` },
  ]
}

export default function AnimeDetailsClientPage({
  params,
  initialAnime,
}: {
  params: { id: string }
  initialAnime: any
}) {
  const [anime, setAnime] = React.useState<any>(initialAnime)
  const [characters, setCharacters] = React.useState<any[]>([])
  const [trailerId, setTrailerId] = React.useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isWatched, setIsWatched] = useState(false)
  const [watchedData, setWatchedData] = useState<any>(null)
  const [showWatchedModal, setShowWatchedModal] = useState(false)
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(!initialAnime)

  const supabase = createClient()

  useEffect(() => {
    const fetchAdditionalData = async () => {
      if (!initialAnime) {
        try {
          const { anime } = await getDetails(params.id)
          setAnime(anime)
        } catch (error) {
          console.error("Failed to fetch anime data:", error)
          setDataLoading(false)
          return
        }
      }

      try {
        const [charactersRes, trailerId] = await Promise.all([
          fetch(`${JIKAN}/anime/${params.id}/characters`, { next: { revalidate: 3600 } })
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null),
          getYouTubeTrailerId((initialAnime || anime)?.title || "", (initialAnime || anime)?.trailer?.youtube_id).catch(
            () => null,
          ),
        ])

        if (charactersRes?.data) {
          setCharacters(charactersRes.data)
        }
        setTrailerId(trailerId)
      } catch (error) {
        console.error("Error fetching additional data:", error)
      } finally {
        setDataLoading(false)
      }
    }

    fetchAdditionalData()
    checkAuthAndWatchedStatus()
  }, [params.id, initialAnime])

  const checkAuthAndWatchedStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: watchedAnime } = await supabase
          .from("watched_anime")
          .select("*")
          .eq("user_id", user.id)
          .eq("anime_id", Number.parseInt(params.id))
          .single()

        if (watchedAnime) {
          setIsWatched(true)
          setWatchedData(watchedAnime)
          setRating(watchedAnime.rating || 0)
          setNotes(watchedAnime.notes || "")
        }
      }
    } catch (error) {
      console.error("Error checking watched status:", error)
    }
  }

  const handleMarkAsWatched = async () => {
    if (!user || !anime) return

    setLoading(true)
    try {
      const watchedAnimeData = {
        user_id: user.id,
        anime_id: anime.mal_id,
        anime_title: anime.title,
        anime_image: anime.images?.jpg?.image_url || null,
        rating: rating || null,
        notes: notes || null,
        watched_at: new Date().toISOString(),
      }

      if (isWatched) {
        const { error } = await supabase
          .from("watched_anime")
          .update({
            rating: rating || null,
            notes: notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("anime_id", anime.mal_id)

        if (!error) {
          setWatchedData({ ...watchedData, rating, notes })
        }
      } else {
        const { data, error } = await supabase.from("watched_anime").insert(watchedAnimeData).select().single()

        if (!error && data) {
          setIsWatched(true)
          setWatchedData(data)
        }
      }

      setShowWatchedModal(false)
    } catch (error) {
      console.error("Error marking as watched:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFromWatched = async () => {
    if (!user || !anime) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from("watched_anime")
        .delete()
        .eq("user_id", user.id)
        .eq("anime_id", anime.mal_id)

      if (!error) {
        setIsWatched(false)
        setWatchedData(null)
        setRating(0)
        setNotes("")
      }
    } catch (error) {
      console.error("Error removing from watched:", error)
    } finally {
      setLoading(false)
    }
  }

  if (dataLoading || !anime) {
    return (
      <main className="relative overflow-hidden">
        <div className="navbar-container">
          <Navbar />
        </div>
        <div className="px-4 py-8 md:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6">
              <BackButton />
            </div>
            <div className="animate-pulse space-y-8">
              <div className="h-16 bg-neumorphic-surface rounded-lg"></div>
              <div className="h-64 bg-neumorphic-surface rounded-lg"></div>
              <div className="h-32 bg-neumorphic-surface rounded-lg"></div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const cast = (characters || []).slice(0, 12).map((c: any) => ({
    character: { name: c?.character?.name, image: c?.character?.images?.jpg?.image_url },
    va: c?.voice_actors?.[0]
      ? { name: c.voice_actors[0].person?.name, image: c.voice_actors[0].person?.images?.jpg?.image_url }
      : null,
  }))

  const platforms = platformSearchLinks(anime?.title || "")

  return (
    <main className="relative overflow-hidden">
      <div className="navbar-container">
        <Navbar />
      </div>

      <div className="px-4 py-8 md:px-8">
        <div className="animate-fade-slide">
          <div className="mx-auto max-w-6xl space-y-12">
            <div className="mb-6">
              <BackButton />
            </div>

            <header className="flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-pretty text-5xl md:text-6xl font-extrabold tracking-tight text-neumorphic mb-4">
                  {anime?.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-white/80">
                  <span className="pill-neumorphic text-sm font-bold">⭐ {anime?.score ?? "—"}</span>
                  {anime?.year ? <span className="pill-neumorphic text-sm">📅 {anime.year}</span> : null}
                  {anime?.status ? <span className="pill-neumorphic text-sm">📺 {anime.status}</span> : null}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {user && (
                  <div className="flex items-center gap-2">
                    {isWatched ? (
                      <>
                        <button
                          onClick={() => setShowWatchedModal(true)}
                          className="px-6 py-3 rounded-full flex items-center justify-center gap-2 font-medium text-white transition-all duration-300"
                          style={{
                            background: "#0A0C14",
                            boxShadow: "6px 6px 12px #05060a, -6px -6px 12px #14161c",
                            minWidth: "160px",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = "8px 8px 16px #05060a, -8px -8px 16px #14161c"
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = "6px 6px 12px #05060a, -6px -6px 12px #14161c"
                          }}
                          onMouseDown={(e) => {
                            e.currentTarget.style.boxShadow = "inset 4px 4px 8px #05060a, inset -4px -4px 8px #14161c"
                          }}
                          onMouseUp={(e) => {
                            e.currentTarget.style.boxShadow = "8px 8px 16px #05060a, -8px -8px 16px #14161c"
                          }}
                        >
                          <Eye className="h-4 w-4 text-[#E0E0E0]" />
                          <span className="text-[#E0E0E0]">
                            Watched {watchedData?.rating && `(${watchedData.rating}/10)`}
                          </span>
                        </button>

                        <button
                          onClick={handleRemoveFromWatched}
                          disabled={loading}
                          className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
                          style={{
                            background: "#0A0C14",
                            boxShadow: "6px 6px 12px #05060a, -6px -6px 12px #14161c",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = "8px 8px 16px #05060a, -8px -8px 16px #14161c"
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = "6px 6px 12px #05060a, -6px -6px 12px #14161c"
                          }}
                          onMouseDown={(e) => {
                            e.currentTarget.style.boxShadow = "inset 4px 4px 8px #05060a, inset -4px -4px 8px #14161c"
                          }}
                          onMouseUp={(e) => {
                            e.currentTarget.style.boxShadow = "8px 8px 16px #05060a, -8px -8px 16px #14161c"
                          }}
                        >
                          <EyeOff className="h-4 w-4 text-[#E0E0E0]" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setShowWatchedModal(true)}
                        className="px-6 py-3 rounded-full flex items-center justify-center gap-2 font-medium text-white transition-all duration-300"
                        style={{
                          background: "#0A0C14",
                          boxShadow: "6px 6px 12px #05060a, -6px -6px 12px #14161c",
                          minWidth: "160px",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = "8px 8px 16px #05060a, -8px -8px 16px #14161c"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = "6px 6px 12px #05060a, -6px -6px 12px #14161c"
                        }}
                        onMouseDown={(e) => {
                          e.currentTarget.style.boxShadow = "inset 4px 4px 8px #05060a, inset -4px -4px 8px #14161c"
                        }}
                        onMouseUp={(e) => {
                          e.currentTarget.style.boxShadow = "8px 8px 16px #05060a, -8px -8px 16px #14161c"
                        }}
                      >
                        <Eye className="h-4 w-4 text-[#E0E0E0]" />
                        <span className="text-[#E0E0E0]">Mark as Watched</span>
                      </button>
                    )}

                    {anime?.url && (
                      <Link
                        href={anime.url}
                        target="_blank"
                        className="px-6 py-3 rounded-full flex items-center justify-center gap-2 transition-all duration-300 font-medium"
                        title="View on MyAnimeList"
                        style={{
                          background: "#0A0C14",
                          boxShadow: "6px 6px 12px #05060a, -6px -6px 12px #14161c",
                          minWidth: "160px",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = "8px 8px 16px #05060a, -8px -8px 16px #14161c"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = "6px 6px 12px #05060a, -6px -6px 12px #14161c"
                        }}
                        onMouseDown={(e) => {
                          e.currentTarget.style.boxShadow = "inset 4px 4px 8px #05060a, inset -4px -4px 8px #14161c"
                        }}
                        onMouseUp={(e) => {
                          e.currentTarget.style.boxShadow = "8px 8px 16px #05060a, -8px -8px 16px #14161c"
                        }}
                      >
                        <BookOpen className="w-4 h-4 text-[#E0E0E0]" />
                        <span className="text-[#E0E0E0]">MyAnimeList</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </header>

            <section>
              <h2 className="section-neumorphic text-2xl mb-6 font-semibold">
                <span style={{ color: "#B084F7" }}>About</span>
              </h2>
              <div className="card-neumorphic">
                <p className="text-base leading-7 text-neumorphic mb-6">
                  {anime?.synopsis || "No synopsis available."}
                </p>
                {anime?.genres?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {anime.genres.map((g: any) => (
                      <span key={g.name} className="pill-neumorphic">
                        {g.name}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </section>

            <section>
              <h2 className="section-neumorphic text-2xl mb-6 font-semibold">
                <span style={{ color: "#B084F7" }}>Where to Watch</span>
              </h2>
              <div className="flex flex-wrap gap-4">
                {platforms.map((p) => (
                  <a
                    key={p.name}
                    href={p.href}
                    target="_blank"
                    rel="noreferrer"
                    className="pill-neumorphic px-5 py-3 rounded-full transition-all duration-300 hover:shadow-lg hover:scale-105 active:shadow-inner"
                    style={{
                      boxShadow: "6px 6px 12px #05060a, -6px -6px 12px #14161c",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "0 0 8px #8a2be2, 6px 6px 12px #05060a, -6px -6px 12px #14161c"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "6px 6px 12px #05060a, -6px -6px 12px #14161c"
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.boxShadow = "inset 4px 4px 8px #05060a, inset -4px -4px 8px #14161c"
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.boxShadow = "0 0 8px #8a2be2, 6px 6px 12px #05060a, -6px -6px 12px #14161c"
                    }}
                  >
                    <span className="inline-flex items-center gap-2">
                      <img
                        alt=""
                        src={
                          p.name === "Crunchyroll"
                            ? "/crunchyroll-logo.png"
                            : p.name === "Netflix"
                              ? "/logos/netflix-logo.png"
                              : p.name === "Hulu"
                                ? "/logos/hulu-logo.png"
                                : "/placeholder.svg?height=16&width=16&query=play"
                        }
                        className="h-4 w-4 rounded-sm object-contain"
                      />
                      <span className="font-bold text-neumorphic">{p.name}</span>
                    </span>
                  </a>
                ))}
              </div>
            </section>

            <section>
              <h2 className="section-neumorphic text-2xl mb-6 font-semibold">
                <span style={{ color: "#B084F7" }}>Trailer</span>
              </h2>
              <div className="frame-neumorphic aspect-video w-full overflow-hidden">
                {trailerId ? (
                  <iframe
                    className="h-full w-full rounded-lg"
                    src={`https://www.youtube-nocookie.com/embed/${trailerId}`}
                    title="YouTube trailer"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-neumorphic text-lg">
                    🎬 No trailer available
                  </div>
                )}
              </div>
            </section>

            <section>
              <h2 className="section-neumorphic text-2xl mb-6 font-semibold">
                <span style={{ color: "#B084F7" }}>Cast</span>
              </h2>
              <div className="cast-grid">
                {cast.map((c, i) => (
                  <div key={i} className="cast-card-cyberpunk group">
                    <div className="cast-hud-overlay" />

                    <div className="cast-tooltip">
                      <div>Character: {c.character.name}</div>
                      {c.va && <div>VA: {c.va.name}</div>}
                    </div>

                    <div className="cast-avatar-frame">
                      {c.character.image ? (
                        <img
                          alt={c.character.name}
                          src={c.character.image || "/placeholder.svg"}
                          className="cast-avatar-image"
                        />
                      ) : (
                        <div className="cast-avatar-image flex items-center justify-center bg-neumorphic-surface">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <span className="text-white font-bold text-xl">?</span>
                          </div>
                        </div>
                      )}
                      <div className="cast-avatar-glow" />
                    </div>

                    <div className="cast-info">
                      <div className="cast-character-name">{c.character.name}</div>
                      {c.va && (
                        <div className="cast-va-info">
                          <span className="cast-va-label">VA</span>
                          <span className="cast-va-name">{c.va.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {showWatchedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card-neumorphic w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-neumorphic">{isWatched ? "Update Rating" : "Mark as Watched"}</h3>
              <Button
                onClick={() => setShowWatchedModal(false)}
                variant="ghost"
                size="sm"
                className="text-muted-neumorphic hover:text-neumorphic"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block text-neumorphic">Rating (optional)</Label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`p-1 transition-colors ${
                        star <= rating ? "text-yellow-400" : "text-gray-600 hover:text-yellow-300"
                      }`}
                    >
                      <Star className="h-5 w-5 fill-current" />
                    </button>
                  ))}
                  {rating > 0 && <span className="ml-2 text-sm text-muted-neumorphic">{rating}/10</span>}
                </div>
              </div>

              <div>
                <Label htmlFor="notes" className="text-sm font-medium text-neumorphic">
                  Notes (optional)
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Your thoughts about this anime..."
                  className="input-neumorphic resize-none mt-2"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleMarkAsWatched}
                  disabled={loading}
                  className="flex-1 btn-neumorphic bg-green-600 hover:bg-green-700 text-white font-medium border-0"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {loading ? "Saving..." : isWatched ? "Update" : "Mark as Watched"}
                </Button>
                <Button
                  onClick={() => setShowWatchedModal(false)}
                  className="btn-neumorphic bg-neumorphic-surface text-neumorphic border-0"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="backtotop">
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Scroll to top">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </div>
    </main>
  )
}

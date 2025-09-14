"use client"

import useSWR from "swr"
import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { SearchBar } from "@/components/search-bar"
import { AnimeCardGlass, type Anime } from "@/components/anime-card-glass"
import { Footer } from "@/components/footer"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function RecommendPage() {
  const params = useSearchParams()
  const q = params.get("q") || ""
  const { data, isLoading } = useSWR<Anime[]>(q ? `/api/recommend?anime=${encodeURIComponent(q)}` : null, fetcher)

  useEffect(() => {
    if (!q) return
    try {
      const key = "animo_recent"
      const prev: string[] = JSON.parse(localStorage.getItem(key) || "[]")
      const next = [q, ...prev.filter((p) => p.toLowerCase() !== q.toLowerCase())].slice(0, 10)
      localStorage.setItem(key, JSON.stringify(next))
    } catch {}
  }, [q])

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-balance">Senpai's Picks Just For You</h1>
        <p className="text-white/80 text-base mt-2 leading-7">Type a title and get 5–10 AI-powered suggestions.</p>
        <div className="mt-4 frame-neumorphic">
          <SearchBar />
        </div>

        <div className="mt-8">
          {!q && <p className="text-white/70">Try searching for "Naruto", "Demon Slayer", or "Spy x Family".</p>}
          {q && isLoading && <p className="text-white/70">Fetching recommendations for "{q}"...</p>}
          {q && data && data.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {data.map((item) => (
                <AnimeCardGlass key={item.id} anime={item} />
              ))}
            </div>
          )}
          {q && data && data.length === 0 && <p className="text-white/70">No recommendations found.</p>}
        </div>
      </section>
      <Footer />
    </main>
  )
}

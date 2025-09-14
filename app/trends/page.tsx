"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AnimeCardGlass, type Anime as GlassAnime } from "@/components/anime-card-glass"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Filter, ChevronLeft, ChevronRight } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type CategoryKey = "airing" | "movie" | "upcoming" | "popular"
const TAB_LABELS: Record<CategoryKey, string> = {
  airing: "Top Airing",
  movie: "Top Movies",
  upcoming: "Upcoming",
  popular: "Most Popular",
}

// MAL genre IDs: https://docs.api.jikan.moe/#/genres/get_genres_anime
const POPULAR_GENRES: { id: number; name: string }[] = [
  { id: 1, name: "Action" },
  { id: 2, name: "Adventure" },
  { id: 4, name: "Comedy" },
  { id: 8, name: "Drama" },
  { id: 10, name: "Fantasy" },
  { id: 7, name: "Mystery" },
  { id: 22, name: "Romance" },
  { id: 24, name: "Sci-Fi" },
  { id: 36, name: "Slice of Life" },
  { id: 30, name: "Sports" },
  { id: 37, name: "Supernatural" },
  { id: 14, name: "Horror" },
  { id: 18, name: "Mecha" },
  { id: 19, name: "Music" },
]

function useTrending(category: CategoryKey, genresCsv?: string, page = 1) {
  const url = useMemo(() => {
    const params = new URLSearchParams()
    if (genresCsv) params.set("genres", genresCsv)
    params.set("page", page.toString())
    return `/api/trending/${category}?${params.toString()}`
  }, [category, genresCsv, page])

  // API returns { data: [...] }
  const { data, isLoading } = useSWR<{
    data: any[]
    pagination?: { current_page: number; last_visible_page: number; has_next_page: boolean }
  }>(url, fetcher)
  const items: GlassAnime[] =
    data?.data?.map((a) => ({
      id: typeof a.id === "string" ? a.id : Number(a.id || a.mal_id || 0),
      title: a.title,
      genres: Array.isArray(a.genres) ? a.genres : [],
      synopsis: a.synopsis || "",
      score: typeof a.score === "number" ? a.score : undefined,
      image: a.image,
      url: a.url,
    })) ?? []
  return { items, isLoading, pagination: data?.pagination }
}

export default function TrendsPage() {
  const [activeTab, setActiveTab] = useState<CategoryKey>("airing")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [showMobileFilter, setShowMobileFilter] = useState(false)
  const [paginationState, setPaginationState] = useState<Record<CategoryKey, number>>({
    airing: 1,
    movie: 1,
    upcoming: 1,
    popular: 1,
  })

  const genresCsv = useMemo(() => (selectedIds.length ? selectedIds.join(",") : undefined), [selectedIds])
  const currentPage = paginationState[activeTab]
  const { items, isLoading, pagination } = useTrending(activeTab, genresCsv, currentPage)

  const handleTabChange = (newTab: CategoryKey) => {
    setActiveTab(newTab)
  }

  const handlePageChange = (page: number) => {
    setPaginationState((prev) => ({
      ...prev,
      [activeTab]: page,
    }))
  }

  const generatePageNumbers = (currentPage: number, totalPages: number) => {
    const pages = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push("ellipsis")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push("ellipsis")
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push("ellipsis")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push("ellipsis")
        pages.push(totalPages)
      }
    }

    return pages
  }

  const totalPages = pagination?.last_visible_page || 1
  const hasNextPage = pagination?.has_next_page || false
  const hasPrevPage = currentPage > 1

  return (
    <main className="relative">
      {/* subtle animated neon background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grid-neon animate-grid-spark opacity-30"
      />

      <Navbar />

      <section className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-balance text-neumorphic">
          What's Hot Right Now — Senpai Recommends
        </h1>
        <p className="text-muted-neumorphic text-base mt-2 leading-7">
          Explore trending anime by category and refine with genre filters.
        </p>

        <div className="md:hidden mt-4 mb-6">
          <Button
            onClick={() => setShowMobileFilter(!showMobileFilter)}
            className="btn-neumorphic px-4 py-2 text-sm font-medium"
            variant="ghost"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter ({selectedIds.length})
          </Button>
        </div>

        {showMobileFilter && (
          <div className="md:hidden mb-6 card-neumorphic p-4">
            <h3 className="text-sm font-semibold text-neumorphic mb-3">Filter by Genre</h3>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-auto">
              {POPULAR_GENRES.map((g) => {
                const checked = selectedIds.includes(g.id)
                return (
                  <label
                    key={g.id}
                    className="flex items-center gap-2 text-sm text-neumorphic hover:text-gray-200 transition"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded"
                      checked={checked}
                      onChange={() => {
                        setSelectedIds((prev) => (checked ? prev.filter((id) => id !== g.id) : [...prev, g.id]))
                      }}
                    />
                    <span className="pill-neumorphic text-xs">{g.name}</span>
                  </label>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-6 relative">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="bg-transparent p-0 gap-2">
              {(Object.keys(TAB_LABELS) as CategoryKey[]).map((k) => (
                <TabsTrigger
                  key={k}
                  value={k}
                  className="btn-neumorphic px-4 py-2 text-sm font-medium transition-all duration-300 rounded-lg data-[state=active]:neumorphic-pressed"
                >
                  {TAB_LABELS[k]}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <div className="spinner-neumorphic"></div>
                    <span className="text-muted-neumorphic font-medium">Loading anime...</span>
                  </div>
                </div>
              )}

              {/* Mobile: horizontal scroll cards */}
              {!isLoading && (
                <div className="md:hidden flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
                  {items.length === 0 && <p className="text-white/70">No results found.</p>}
                  {items.map((anime) => (
                    <div key={anime.id} className="snap-start min-w-[74%]">
                      <AnimeCardGlass anime={anime} />
                    </div>
                  ))}
                </div>
              )}

              {/* Desktop: grid layout */}
              {!isLoading && (
                <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pr-0 xl:pr-72">
                  {items.length === 0 && <div className="col-span-full text-white/70">No results found.</div>}
                  {items.map((anime) => (
                    <AnimeCardGlass key={anime.id} anime={anime} />
                  ))}
                </div>
              )}

              {!isLoading && items.length > 0 && (
                <div className="mt-8 flex justify-center">
                  <div className="pagination-neumorphic">
                    <button onClick={() => hasPrevPage && handlePageChange(currentPage - 1)} disabled={!hasPrevPage}>
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </button>

                    {generatePageNumbers(currentPage, totalPages).map((page, index) => (
                      <div key={index}>
                        {page === "ellipsis" ? (
                          <span className="text-muted-neumorphic">...</span>
                        ) : (
                          <button
                            onClick={() => handlePageChange(page as number)}
                            className={page === currentPage ? "neumorphic-pressed" : ""}
                          >
                            {page}
                          </button>
                        )}
                      </div>
                    ))}

                    <button onClick={() => hasNextPage && handlePageChange(currentPage + 1)} disabled={!hasNextPage}>
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <aside className="hidden xl:block fixed right-6 top-32 z-10">
            <div className="card-neumorphic px-4 py-3 w-64">
              <h3 className="text-sm font-semibold text-neumorphic">Filter by Genre</h3>
              <div className="mt-2 grid grid-cols-1 gap-2 max-h-[60vh] overflow-auto pr-1">
                {POPULAR_GENRES.map((g) => {
                  const checked = selectedIds.includes(g.id)
                  return (
                    <label
                      key={g.id}
                      className="flex items-center gap-2 text-sm text-neumorphic hover:text-gray-200 transition"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded"
                        checked={checked}
                        onChange={() => {
                          setSelectedIds((prev) => (checked ? prev.filter((id) => id !== g.id) : [...prev, g.id]))
                        }}
                      />
                      <span className="pill-neumorphic">{g.name}</span>
                    </label>
                  )
                })}
              </div>
              <p className="mt-2 text-[11px] text-muted-neumorphic">
                Tip: Combine categories with genres for better results.
              </p>
            </div>
          </aside>
        </div>

        <div className="mt-10">
          <div className="card-neumorphic p-6">
            <h3 className="text-xl font-semibold mb-2 section-neumorphic">Similar to Your Favorites</h3>
            <p className="text-muted-neumorphic text-sm mb-4 leading-6">
              Connect your profile later for personalized categories powered by AI.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="pill-neumorphic p-3 text-center">
                <span className="font-medium">"Hidden Gems"</span>
              </div>
              <div className="pill-neumorphic p-3 text-center">
                <span className="font-medium">"Because you liked Action/Adventure"</span>
              </div>
              <div className="pill-neumorphic p-3 text-center">
                <span className="font-medium">"Cozy Slice-of-Life Tonight"</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

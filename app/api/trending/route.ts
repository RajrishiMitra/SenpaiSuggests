export const revalidate = 3600 // cache for 1 hour

type JikanAnime = {
  mal_id: number
  title: string
  synopsis?: string
  images?: { jpg?: { image_url?: string } }
  score?: number
  url?: string
  genres?: { name: string }[]
}

export async function GET() {
  const res = await fetch("https://api.jikan.moe/v4/top/anime?limit=24", { next: { revalidate } })
  if (!res.ok) {
    return new Response(JSON.stringify({ items: [] }), { headers: { "content-type": "application/json" }, status: 200 })
  }
  const data = await res.json()
  const items = (data?.data || []).map((a: JikanAnime) => ({
    id: String(a.mal_id),
    title: a.title,
    synopsis: a.synopsis,
    rating: typeof a.score === "number" ? a.score : undefined,
    image: a.images?.jpg?.image_url,
    url: a.url,
    genres: (a.genres || []).map((g) => g.name),
  }))
  return new Response(JSON.stringify({ items }), { headers: { "content-type": "application/json" } })
}

import { NextResponse } from "next/server"

const JIKAN = "https://api.jikan.moe/v4"

function buildQuery(category: string, genres?: string, page = 1) {
  const common = new URLSearchParams({ page: page.toString(), limit: "24", sfw: "true" })
  if (genres) common.set("genres", genres) // accept CSV of numeric genre IDs
  switch (category) {
    case "airing":
      common.set("status", "airing")
      common.set("order_by", "score")
      common.set("sort", "desc")
      break
    case "movie":
      common.set("type", "movie")
      common.set("order_by", "score")
      common.set("sort", "desc")
      break
    case "upcoming":
      common.set("status", "upcoming")
      common.set("order_by", "members")
      common.set("sort", "desc")
      break
    case "popular":
      common.set("order_by", "members")
      common.set("sort", "desc")
      break
    default:
      common.set("order_by", "score")
      common.set("sort", "desc")
  }
  return `${JIKAN}/anime?${common.toString()}`
}

export async function GET(request: Request, { params }: { params: { category: string } }) {
  const { searchParams } = new URL(request.url)
  const genres = searchParams.get("genres") || undefined
  const page = Number.parseInt(searchParams.get("page") || "1", 10)
  const cat = (params.category || "").toLowerCase()
  const url = buildQuery(cat, genres, page)

  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return NextResponse.json({ error: "Failed to fetch trending" }, { status: 500 })
  const json = await res.json()

  // Normalize fields for the UI
  const data = (json?.data || []).map((a: any) => ({
    id: a.mal_id,
    title: a.title,
    synopsis: a.synopsis ?? null,
    score: typeof a.score === "number" ? Number.parseFloat(a.score.toFixed(2)) : null,
    year: a.year ?? a.aired?.from?.slice(0, 4),
    status: a.status,
    image: a.images?.webp?.large_image_url || a.images?.jpg?.large_image_url,
    genres: (a.genres || []).map((g: any) => g.name),
    url: a.url,
  }))

  return NextResponse.json({
    data,
    pagination: {
      current_page: json?.pagination?.current_page || page,
      last_visible_page: json?.pagination?.last_visible_page || 1,
      has_next_page: json?.pagination?.has_next_page || false,
    },
  })
}

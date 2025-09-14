export type JikanAnime = {
  title: string
  images?: {
    jpg?: { image_url?: string | null }
    webp?: { image_url?: string | null }
  }
}

export function getAnimeImage(a: JikanAnime) {
  return (
    a?.images?.jpg?.image_url ||
    a?.images?.webp?.image_url ||
    `/placeholder.svg?height=288&width=512&query=${encodeURIComponent(a?.title || "anime cover")}`
  )
}

import { NextResponse, type NextRequest } from "next/server"
import { fetchHuggingFaceWithRetries } from "@/lib/hf"

type JikanAnime = {
  mal_id: number
  title: string
  synopsis?: string
  score?: number
  url?: string
  images?: { jpg?: { image_url?: string }; webp?: { image_url?: string } }
  genres?: { name: string }[]
}

type JikanRecommendation = {
  entry: {
    mal_id: number
    title: string
    url: string
    images?: { jpg?: { image_url?: string }; webp?: { image_url?: string } }
  }
}

const HF_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY

function cosine(a: number[], b: number[]) {
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length && i < b.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  return denom ? dot / denom : 0
}

// extremely light token -> tf vector for fallback
function tfVector(text: string, vocab: Map<string, number>) {
  const tokens = (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
  const vec = Array.from({ length: vocab.size }, () => 0)
  for (const t of tokens) {
    const idx = vocab.get(t)
    if (idx !== undefined) vec[idx] += 1
  }
  // l2 normalize
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0))
  return norm ? vec.map((v) => v / norm) : vec
}

function buildVocab(texts: string[]) {
  const vocab = new Map<string, number>()
  texts.forEach((txt) => {
    ;(txt || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .forEach((t) => {
        if (!vocab.has(t)) vocab.set(t, vocab.size)
      })
  })
  return vocab
}

async function hfEmbeddings(texts: string[]): Promise<number[][] | null> {
  if (!HF_API_KEY) return null
  try {
    const res = await fetchHuggingFaceWithRetries(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: texts }),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (Array.isArray(data) && Array.isArray(data[0])) {
      return data as number[][]
    }
    return null
  } catch {
    return null
  }
}

async function jikan<T = any>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, { ...init })
    if (!res.ok) return null
    const json = await res.json()
    return (json?.data as T) ?? null
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("anime") || "").trim()
  if (!q) return NextResponse.json([], { status: 200 })

  // 1) find base anime by title
  const baseList = await jikan<JikanAnime[]>(
    `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&order_by=score&sort=desc&limit=1`,
  )
  const base = baseList?.[0]
  if (!base) return NextResponse.json([], { status: 200 })

  // 2) grab recommendation seeds from Jikan
  const recs = await jikan<JikanRecommendation[]>(`https://api.jikan.moe/v4/anime/${base.mal_id}/recommendations`)

  // If no recommendations, just bail out with empty
  if (!recs || recs.length === 0) return NextResponse.json([], { status: 200 })

  // 3) enrich each with details (synopsis, score, genres)
  const candidates = recs.slice(0, 10) // cap to 10 for performance
  const settled = await Promise.allSettled(
    candidates.map(async (r) => jikan<JikanAnime>(`https://api.jikan.moe/v4/anime/${r.entry.mal_id}`)),
  )
  const enriched = settled
    .filter((s): s is PromiseFulfilledResult<JikanAnime | null> => s.status === "fulfilled")
    .map((s) => s.value)
    .filter(Boolean) as JikanAnime[]

  // 4) compute similarity
  const baseSynopsis = base.synopsis || base.title
  const candTexts = enriched.map((c) => c.synopsis || c.title)
  let sims: number[] = []

  // Try HuggingFace embeddings first
  const embeddings = await hfEmbeddings([baseSynopsis, ...candTexts])
  if (embeddings) {
    const baseVec = embeddings[0]
    const candVecs = embeddings.slice(1)
    sims = candVecs.map((v) => cosine(baseVec, v))
  } else {
    // fallback: tf cosine over light vocab
    const vocab = buildVocab([baseSynopsis, ...candTexts])
    const baseVec = tfVector(baseSynopsis, vocab)
    sims = candTexts.map((txt) => cosine(baseVec, tfVector(txt, vocab)))
  }

  // genre overlap boost (Jaccard)
  const baseGenres = new Set((base.genres || []).map((g) => g.name))
  const boosted = enriched.map((c, i) => {
    const gset = new Set((c.genres || []).map((g) => g.name))
    const inter = [...gset].filter((g) => baseGenres.has(g)).length
    const union = new Set<string>([...gset, ...baseGenres]).size || 1
    const jaccard = inter / union
    const scoreNorm = typeof c.score === "number" ? Math.min(Math.max((c.score - 4) / 6, 0), 1) : 0 // normalize ~[4..10] to [0..1]
    const final = 0.7 * sims[i] + 0.2 * jaccard + 0.1 * scoreNorm
    return { anime: c, final }
  })

  boosted.sort((a, b) => b.final - a.final)

  // 5) map to UI shape
  const items = boosted.slice(0, 10).map(({ anime }) => ({
    id: String(anime.mal_id),
    title: anime.title,
    synopsis: anime.synopsis,
    genres: (anime.genres || []).map((g) => g.name),
    score:
      typeof anime.score === "number"
        ? parseFloat(anime.score.toFixed(2)) // force 2 decimals
        : undefined,
    image:
      anime.images?.jpg?.image_url ||
      anime.images?.webp?.image_url ||
      `/placeholder.svg?height=288&width=512&query=anime%20cover%20${encodeURIComponent(anime.title)}`,
    url: anime.url,
  }))

  return NextResponse.json(items, { headers: { "content-type": "application/json" } })
}

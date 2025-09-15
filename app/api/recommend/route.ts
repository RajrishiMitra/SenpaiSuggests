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
  let dot = 0, na = 0, nb = 0
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
  if (!HF_API_KEY) {
    console.log("[hf] No HuggingFace API key, using fallback")
    return null
  }
  try {
    console.log("[hf] Requesting embeddings for", texts.length, "texts")
    const validTexts = texts.filter((text) => text && text.trim().length > 0)
    if (validTexts.length === 0) return null

    const res = await fetchHuggingFaceWithRetries(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: validTexts }),
      }
    )

    if (!res.ok) {
      const errorText = await res.text()
      console.warn("[hf] API failed", res.status, errorText)
      return null
    }

    const data = await res.json()
    if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
      return data as number[][]
    }

    if (data?.error) {
      console.warn("[hf] Model error:", data.error)
      return null
    }

    console.warn("[hf] Unexpected response:", data)
    return null
  } catch (err) {
    console.error("[hf] Embedding fetch error:", err)
    return null
  }
}

// Retry wrapper for Jikan API
async function jikan<T = any>(
  url: string,
  init?: RequestInit,
  retries = 3
): Promise<T | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { ...init })
      if (res.ok) {
        const json = await res.json()
        return (json?.data as T) ?? null
      }
      console.warn(`[jikan] Request failed (${res.status}), try ${i + 1}/${retries}`)
    } catch (err) {
      console.warn(`[jikan] Network error on try ${i + 1}/${retries}`, err)
    }
    await new Promise((r) => setTimeout(r, 500 * (i + 1)))
  }
  return null
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("anime") || "").trim()
  console.log("[rec] Request for:", q)
  if (!q) return NextResponse.json([], { status: 200 })

  // 1) Search base anime
  const baseList = await jikan<JikanAnime[]>(
    `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=10`
  )

  let base: JikanAnime | undefined
  if (baseList && baseList.length > 0) {
    const queryLower = q.toLowerCase()
    base =
      baseList.find(
        (anime) =>
          anime.title.toLowerCase() === queryLower ||
          anime.title.toLowerCase().includes(queryLower) ||
          queryLower.includes(anime.title.toLowerCase().split(" ")[0])
      ) || baseList[0]
  }

  if (!base) {
    console.log("[rec] No base anime found for:", q)
    return NextResponse.json([], { status: 200 })
  }
  console.log("[rec] Base anime:", base.title, "ID:", base.mal_id)

  // 2) Recommendations
  const recs = await jikan<JikanRecommendation[]>(
    `https://api.jikan.moe/v4/anime/${base.mal_id}/recommendations`
  )
  if (!recs || recs.length === 0) {
    console.log("[rec] No rec seeds found for:", base.title)
    return NextResponse.json([], { status: 200 })
  }
  console.log("[rec] Found", recs.length, "seeds")

  // 3) Enrich details
  const candidates = recs.slice(0, 20)
  const settled = await Promise.allSettled(
    candidates.map((r) => jikan<JikanAnime>(`https://api.jikan.moe/v4/anime/${r.entry.mal_id}`))
  )
  let enriched = settled
    .filter((s): s is PromiseFulfilledResult<JikanAnime | null> => s.status === "fulfilled")
    .map((s) => s.value)
    .filter(Boolean) as JikanAnime[]

  console.log("[rec] Enriched", enriched.length, "from", candidates.length)

  // fallback: if too few enriched, use raw seeds
  if (enriched.length < 5) {
    console.warn("[rec] Low enrichment, padding with raw seeds")
    enriched = [
      ...enriched,
      ...candidates
        .map((c) => ({
          mal_id: c.entry.mal_id,
          title: c.entry.title,
          synopsis: "",
          score: undefined,
          url: c.entry.url,
          images: c.entry.images,
          genres: [],
        }))
        .slice(0, 5 - enriched.length),
    ]
  }

  // 4) Compute similarity
  const baseSynopsis = base.synopsis || base.title
  const candTexts = enriched.map((c) => c.synopsis || c.title)
  let sims: number[] = []

  const embeddings = await hfEmbeddings([baseSynopsis, ...candTexts])
  if (embeddings) {
    console.log("[rec] Using HuggingFace embeddings")
    const baseVec = embeddings[0]
    const candVecs = embeddings.slice(1)
    sims = candVecs.map((v) => cosine(baseVec, v))
  } else {
    console.log("[rec] Using TF-IDF fallback")
    const vocab = buildVocab([baseSynopsis, ...candTexts])
    const baseVec = tfVector(baseSynopsis, vocab)
    sims = candTexts.map((txt) => cosine(baseVec, tfVector(txt, vocab)))
  }

  // genre + score boost
  const baseGenres = new Set((base.genres || []).map((g) => g.name))
  const boosted = enriched.map((c, i) => {
    const gset = new Set((c.genres || []).map((g) => g.name))
    const inter = [...gset].filter((g) => baseGenres.has(g)).length
    const union = new Set<string>([...gset, ...baseGenres]).size || 1
    const jaccard = inter / union
    const scoreNorm =
      typeof c.score === "number"
        ? Math.min(Math.max((c.score - 4) / 6, 0), 1)
        : 0
    const final = 0.7 * sims[i] + 0.2 * jaccard + 0.1 * scoreNorm
    return { anime: c, final }
  })

  boosted.sort((a, b) => b.final - a.final)

  // 5) Map for UI
  const items = boosted.slice(0, 12).map(({ anime }) => ({
    id: String(anime.mal_id),
    title: anime.title,
    synopsis: anime.synopsis,
    genres: (anime.genres || []).map((g) => g.name),
    score:
      typeof anime.score === "number"
        ? Number.parseFloat(anime.score.toFixed(2))
        : undefined,
    image:
      anime.images?.jpg?.image_url ||
      anime.images?.webp?.image_url ||
      `/placeholder.svg?height=288&width=512&query=anime%20cover%20${encodeURIComponent(
        anime.title
      )}`,
    url: anime.url,
  }))

  console.log("[rec] Returning", items.length, "recommendations")
  return NextResponse.json(items, {
    headers: { "content-type": "application/json" },
  })
}

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
  let dot = 0,
    na = 0,
    nb = 0
  for (let i = 0; i < a.length && i < b.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  return denom ? dot / denom : 0
}

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

async function hfGetSimilarityScores(base: string, candidates: string[]): Promise<number[] | null> {
  if (!HF_API_KEY) {
    console.log("[v0] No HuggingFace API key, using TF-IDF fallback")
    return null
  }
  try {
    console.log(`[v0] Attempting HuggingFace similarity for ${candidates.length} candidates`)
    if (!base || candidates.length === 0) {
      console.log("[v0] No valid base or candidate texts for similarity")
      return null
    }

    const res = await fetchHuggingFaceWithRetries(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {
          source_sentence: base,
          sentences: candidates,
        },
        parameters: { wait_for_model: true },
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.log(`[v0] HuggingFace API failed with status: ${res.status}`)
      console.log(`[v0] HuggingFace error response: ${errorText}`)
      const payload = { inputs: { source_sentence: base, sentences: candidates } }
      console.log(`[v0] Request payload size: ${JSON.stringify(payload).length} chars`)
      return null
    }

    const data = await res.json()
    // The sentence similarity API returns a flat array of scores
    if (Array.isArray(data) && (data.length === 0 || typeof data[0] === "number")) {
      console.log(`[v0] HuggingFace similarity successful: ${data.length} scores`)
      return data as number[]
    }

    if (data?.error) {
      console.log(`[v0] HuggingFace model error: ${data.error}`)
      return null
    }

    console.log(`[v0] HuggingFace unexpected response format:`, typeof data)
    return null
  } catch (err) {
    console.log(`[v0] HuggingFace similarity fetch error: ${err}`)
    return null
  }
}

// Retry wrapper for Jikan API
async function jikan<T = any>(url: string, init?: RequestInit, retries = 3): Promise<T | null> {
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
  console.log(`[v0] Recommendation request for: ${q}`)
  if (!q) return NextResponse.json([], { status: 200 })

  // 1) Search base anime
  const baseList = await jikan<JikanAnime[]>(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=10`)

  let base: JikanAnime | undefined
  if (baseList && baseList.length > 0) {
    const queryLower = q.toLowerCase()
    base =
      baseList.find(
        (anime) =>
          anime.title.toLowerCase() === queryLower ||
          anime.title.toLowerCase().includes(queryLower) ||
          queryLower.includes(anime.title.toLowerCase().split(" ")[0]),
      ) || baseList[0]
  }

  if (!base) {
    console.log(`[v0] No base anime found for: ${q}`)
    return NextResponse.json([], { status: 200 })
  }
  console.log(`[v0] Found base anime: ${base.title} ID: ${base.mal_id}`)

  // 2) Recommendations
  const recs = await jikan<JikanRecommendation[]>(`https://api.jikan.moe/v4/anime/${base.mal_id}/recommendations`)
  if (!recs || recs.length === 0) {
    console.log(`[v0] No recommendation seeds found for: ${base.title}`)
    return NextResponse.json([], { status: 200 })
  }
  console.log(`[v0] Found ${recs.length} recommendation seeds`)

  // 3) Enrich details
  const candidates = recs.slice(0, 20)
  const settled = await Promise.allSettled(
    candidates.map((r) => jikan<JikanAnime>(`https://api.jikan.moe/v4/anime/${r.entry.mal_id}`)),
  )
  let enriched = settled
    .filter((s): s is PromiseFulfilledResult<JikanAnime | null> => s.status === "fulfilled")
    .map((s) => s.value)
    .filter(Boolean) as JikanAnime[]

  console.log(`[v0] Enriched ${enriched.length} candidates from ${candidates.length} seeds`)

  // fallback: if too few enriched, use raw seeds
  if (enriched.length < 5) {
    console.warn("[v0] Low enrichment, padding with raw seeds")
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

  // 🔹 Deduplicate by mal_id
  const uniqueMap = new Map<number, JikanAnime>()
  for (const anime of enriched) {
    if (!uniqueMap.has(anime.mal_id)) {
      uniqueMap.set(anime.mal_id, anime)
    }
  }
  const uniqueEnriched = Array.from(uniqueMap.values())
  console.log(`[v0] After deduplication: ${uniqueEnriched.length} unique anime`)

  // 4) Compute similarity
  const baseSynopsis = base.synopsis || base.title
  const candTexts = uniqueEnriched.map((c) => c.synopsis || c.title)
  let sims: number[] | null = await hfGetSimilarityScores(baseSynopsis, candTexts)

  let usingHf = true
  if (!sims) {
    usingHf = false
    console.log(`[v0] Using TF-IDF fallback`)
    const vocab = buildVocab([baseSynopsis, ...candTexts])
    const baseVec = tfVector(baseSynopsis, vocab)
    sims = candTexts.map((txt) => cosine(baseVec, tfVector(txt, vocab)))
    console.log(`[v0] TF-IDF similarities: ${sims.map((s) => s.toFixed(3)).join(", ")}`)
  } else {
    console.log(`[v0] Using HuggingFace similarity scores`)
  }

  // genre + score boost
  const baseGenres = new Set((base.genres || []).map((g) => g.name))
  const boosted = uniqueEnriched.map((c, i) => {
    const gset = new Set((c.genres || []).map((g) => g.name))
    const inter = [...gset].filter((g) => baseGenres.has(g)).length
    const union = new Set<string>([...gset, ...baseGenres]).size || 1
    const jaccard = inter / union
    const scoreNorm = typeof c.score === "number" ? Math.min(Math.max((c.score - 4) / 6, 0), 1) : 0
    // sims array is guaranteed to be non-null here
    const final = 0.7 * (sims as number[])[i] + 0.2 * jaccard + 0.1 * scoreNorm
    return { anime: c, final }
  })

  boosted.sort((a, b) => b.final - a.final)

  const minSimilarity = usingHf ? 0.1 : 0.05 // Lower threshold for TF-IDF
  const qualityFiltered = boosted.filter(({ final }) => final > minSimilarity)

  // Take up to 12 results, but ensure minimum quality
  const finalResults = qualityFiltered.length >= 3 ? qualityFiltered : boosted

  // 5) Map for UI
  const items = finalResults.slice(0, 12).map(({ anime, final }) => ({
    id: String(anime.mal_id),
    title: anime.title,
    synopsis: anime.synopsis,
    genres: (anime.genres || []).map((g) => g.name),
    score: typeof anime.score === "number" ? Number.parseFloat(anime.score.toFixed(2)) : undefined,
    image:
      anime.images?.jpg?.image_url ||
      anime.images?.webp?.image_url ||
      `/placeholder.svg?height=288&width=512&query=anime%20cover%20${encodeURIComponent(anime.title)}`,
    url: anime.url,
    similarity: Number.parseFloat(final.toFixed(3)), // Added similarity score for debugging
  }))

  console.log(`[v0] Returning ${items.length} recommendations`)
  return NextResponse.json(items, {
    headers: { "content-type": "application/json" },
  })
}

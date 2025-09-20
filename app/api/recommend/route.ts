import { NextResponse, type NextRequest } from "next/server"

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

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_MODEL = "gpt-4o-mini"

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

async function rankWithOpenAI(
  baseAnime: JikanAnime,
  candidates: JikanAnime[],
): Promise<{ anime: JikanAnime; score: number }[] | null> {
  if (!OPENAI_API_KEY) {
    console.log("[v0] No OpenAI API key, using TF-IDF fallback")
    return null
  }

  try {
    console.log(`[v0] Attempting OpenAI ranking for ${candidates.length} candidates`)

    // Prepare base anime description
    const baseDescription = {
      title: baseAnime.title,
      synopsis: baseAnime.synopsis || "No synopsis available",
      genres: (baseAnime.genres || []).map((g) => g.name).join(", ") || "Unknown",
      score: baseAnime.score || "Not rated",
    }

    // Prepare candidate descriptions
    const candidateDescriptions = candidates.map((anime, index) => ({
      index,
      title: anime.title,
      synopsis: anime.synopsis || "No synopsis available",
      genres: (anime.genres || []).map((g) => g.name).join(", ") || "Unknown",
      score: anime.score || "Not rated",
    }))

    const prompt = `You are an anime recommendation expert. Given a base anime and a list of candidate anime, rank the candidates by similarity to the base anime. Consider plot themes, genres, character types, setting, and overall tone.

Base Anime:
Title: ${baseDescription.title}
Synopsis: ${baseDescription.synopsis}
Genres: ${baseDescription.genres}
MAL Score: ${baseDescription.score}

Candidate Anime to Rank:
${candidateDescriptions
  .map(
    (c) => `${c.index}: ${c.title}
Synopsis: ${c.synopsis}
Genres: ${c.genres}
Score: ${c.score}`,
  )
  .join("\n\n")}

Return ONLY a JSON array with objects containing "index" (the candidate index) and "similarity" (a score from 0.0 to 1.0). Order by similarity descending. Example format:
[{"index": 2, "similarity": 0.95}, {"index": 0, "similarity": 0.87}, {"index": 1, "similarity": 0.72}]`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.log(`[v0] OpenAI API failed with status: ${response.status}`)
      console.log(`[v0] OpenAI error response: ${errorText}`)
      return null
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      console.log("[v0] OpenAI returned no content")
      return null
    }

    // Parse the JSON response
    const rankings = JSON.parse(content.trim())

    if (!Array.isArray(rankings)) {
      console.log("[v0] OpenAI response is not an array")
      return null
    }

    // Map rankings back to anime objects
    const rankedResults = rankings
      .filter((r) => typeof r.index === "number" && typeof r.similarity === "number")
      .map((r) => ({
        anime: candidates[r.index],
        score: r.similarity,
      }))
      .filter((r) => r.anime) // Remove any invalid indices

    console.log(`[v0] OpenAI ranking successful: ${rankedResults.length} ranked anime`)
    return rankedResults
  } catch (err) {
    console.log(`[v0] OpenAI ranking error: ${err}`)
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

  let rankedResults = await rankWithOpenAI(base, uniqueEnriched)

  if (rankedResults) {
    console.log(`[v0] Using OpenAI ranking for recommendations`)
  } else {
    console.log(`[v0] Using TF-IDF fallback`)
    // Fallback to TF-IDF when OpenAI fails
    const baseSynopsis = base.synopsis || base.title
    const candTexts = uniqueEnriched.map((c) => c.synopsis || c.title)

    const vocab = buildVocab([baseSynopsis, ...candTexts])
    const baseVec = tfVector(baseSynopsis, vocab)
    const sims = candTexts.map((txt) => cosine(baseVec, tfVector(txt, vocab)))

    // Apply genre + score boost for TF-IDF
    const baseGenres = new Set((base.genres || []).map((g) => g.name))
    rankedResults = uniqueEnriched.map((c, i) => {
      const gset = new Set((c.genres || []).map((g) => g.name))
      const inter = [...gset].filter((g) => baseGenres.has(g)).length
      const union = new Set<string>([...gset, ...baseGenres]).size || 1
      const jaccard = inter / union
      const scoreNorm = typeof c.score === "number" ? Math.min(Math.max((c.score - 4) / 6, 0), 1) : 0
      const final = 0.7 * sims[i] + 0.2 * jaccard + 0.1 * scoreNorm
      return { anime: c, score: final }
    })

    rankedResults.sort((a, b) => b.score - a.score)
    console.log(`[v0] TF-IDF similarities: ${rankedResults.map((r) => r.score.toFixed(3)).join(", ")}`)
  }

  // Apply quality filtering
  const minSimilarity = rankedResults && rankedResults.length > 0 && rankedResults[0].score > 0.5 ? 0.1 : 0.05
  const qualityFiltered = rankedResults.filter(({ score }) => score > minSimilarity)

  // Take up to 12 results, but ensure minimum quality
  const finalResults = qualityFiltered.length >= 3 ? qualityFiltered : rankedResults

  // 5) Map for UI
  const items = finalResults.slice(0, 12).map(({ anime, score }) => ({
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
    similarity: Number.parseFloat(score.toFixed(3)), // Added similarity score for debugging
  }))

  console.log(`[v0] Returning ${items.length} recommendations`)
  return NextResponse.json(items, {
    headers: { "content-type": "application/json" },
  })
}

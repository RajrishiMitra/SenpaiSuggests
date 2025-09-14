import type { Metadata } from "next"
import AnimeDetailsClientPage from "./AnimeDetailsClientPage"

const JIKAN = "https://api.jikan.moe/v4"

async function getDetails(id: string) {
  const [detailRes] = await Promise.all([fetch(`${JIKAN}/anime/${id}/full`, { next: { revalidate: 3600 } })])
  if (!detailRes.ok) throw new Error("Failed to load details")
  const detailJson = await detailRes.json()
  const anime = detailJson?.data
  return { anime }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const { anime } = await getDetails(params.id)
    return {
      title: `${anime?.title} – SenpAISuggests`,
      description: anime?.synopsis?.slice(0, 160),
    }
  } catch {
    return { title: "Anime Details – SenpAISuggests" }
  }
}

export default async function AnimeDetailsPage({ params }: { params: { id: string } }) {
  return <AnimeDetailsClientPage params={params} />
}

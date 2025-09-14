import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function AboutPage() {
  return (
    <main>
      <Navbar />
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="card-neumorphic">
            <h1 className="text-3xl font-bold text-balance text-neumorphic">
              How <span className="section-neumorphic">SenpAISuggests</span> Works
            </h1>
            <p className="text-muted-neumorphic mt-3 text-pretty">
              Discover your next anime with a content-based engine powered by public datasets and free APIs. We blend
              synopsis semantics, genres, and popularity to deliver high-quality recommendations—with optional semantic
              embeddings for extra accuracy.
            </p>

            <div className="mt-8 grid md:grid-cols-3 gap-4">
              <div className="card-neumorphic">
                <div aria-hidden className="mb-3 h-8 w-8 rounded-md pill-neumorphic" />
                <h3 className="font-semibold text-neumorphic">1) Data</h3>
                <p className="text-sm text-muted-neumorphic mt-1">
                  We fetch anime metadata from the Jikan API (MyAnimeList unofficial) and can ingest offline datasets
                  like Kaggle's Anime Recommendation Database.
                </p>
              </div>
              <div className="card-neumorphic">
                <div aria-hidden className="mb-3 h-8 w-8 rounded-md pill-neumorphic" />
                <h3 className="font-semibold text-neumorphic">2) AI</h3>
                <p className="text-sm text-muted-neumorphic mt-1">
                  Content-based similarity via TF cosine over synopsis with a genre overlap boost. If available, we
                  upgrade to semantic embeddings using HuggingFace's{" "}
                  <span className="whitespace-nowrap">all-MiniLM-L6-v2</span>.
                </p>
              </div>
              <div className="card-neumorphic">
                <div aria-hidden className="mb-3 h-8 w-8 rounded-md pill-neumorphic" />
                <h3 className="font-semibold text-neumorphic">3) Recommendations</h3>
                <p className="text-sm text-muted-neumorphic mt-1">
                  We re-rank recommended titles by semantic similarity, genre Jaccard, and normalized score to suggest
                  5–10 titles you'll likely enjoy.
                </p>
              </div>
            </div>

            <div className="mt-8 grid md:grid-cols-2 gap-4">
              <div className="card-neumorphic">
                <h4 className="font-semibold text-neumorphic">Free APIs we use</h4>
                <ul className="mt-2 text-sm text-muted-neumorphic list-disc list-inside">
                  <li>Jikan API (MyAnimeList)</li>
                  <li>HuggingFace Inference API (optional embeddings)</li>
                </ul>
              </div>
              <div className="card-neumorphic">
                <h4 className="font-semibold text-neumorphic">What's next</h4>
                <ul className="mt-2 text-sm text-muted-neumorphic list-disc list-inside">
                  <li>Collaborative filtering (ALS) for user-based signals</li>
                  <li>Profile-aware re-ranking</li>
                  <li>Caching and rate-limit smoothing</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <Link href="/recommend" className="btn-neumorphic">
                Try Recommendations
              </Link>
              <Link href="/trends" className="btn-neumorphic">
                Explore Trends
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}

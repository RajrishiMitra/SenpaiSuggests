import Link from "next/link"
import { SearchBar } from "@/components/search-bar"

export function Hero() {
  return (
    <section className="relative overflow-hidden mt-2">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28 relative z-10">
        <div className="card-neumorphic p-8 md:p-12">
          <p className="text-sm text-muted-neumorphic mb-2">AI-Powered Discovery</p>
          <h1 className="text-3xl md:text-5xl font-bold text-balance text-neumorphic">
            <span className="section-neumorphic">SenpAISuggests</span> – Let AI be your Senpai in discovering your next
            anime.
          </h1>
          <p className="mt-4 text-muted-neumorphic max-w-2xl text-pretty">
            Explore personalized recommendations, trending shows, and hidden gems—styled with a sleek, modern UI.
          </p>
          <div className="mt-6 frame-neumorphic p-4">
            <SearchBar />
          </div>
          <div className="mt-8 flex items-center gap-4">
            <Link href="/recommend" className="btn-neumorphic px-5 py-3 rounded-md text-sm font-medium">
              Get Started
            </Link>
            <Link href="/trends" className="btn-neumorphic px-5 py-3 rounded-md text-sm font-medium">
              Explore Trends
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

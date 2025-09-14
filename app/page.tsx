import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { Footer } from "@/components/footer"
import { FloatingActionButton } from "@/components/floating-action-button"

export default function Page() {
  return (
    <main>
      <Navbar />
      <Hero />
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-4">
          <div
            className="neon-border-solid rounded-xl p-5 glass-hover-solid smooth"
            style={{ backgroundColor: "#0A0C14" }}
          >
            <h3 className="font-semibold text-white/95">Smart Recommendations</h3>
            <p className="neon-body text-sm mt-1">
              Enter any anime to get curated, AI-powered suggestions you'll actually enjoy.
            </p>
          </div>
          <div
            className="neon-border-solid rounded-xl p-5 glass-hover-solid smooth"
            style={{ backgroundColor: "#0A0C14" }}
          >
            <h3 className="font-semibold text-white/95">Trending & Hidden Gems</h3>
            <p className="neon-body text-sm mt-1">
              See what's hot globally and discover niche series you haven't heard of.
            </p>
          </div>
          <div
            className="neon-border-solid rounded-xl p-5 glass-hover-solid smooth"
            style={{ backgroundColor: "#0A0C14" }}
          >
            <h3 className="font-semibold text-white/95">Anime x Futurism</h3>
            <p className="neon-body text-sm mt-1">Neon aesthetics, smooth animations, and a fast, modern experience.</p>
          </div>
        </div>
      </section>
      <Footer />
      <FloatingActionButton />
    </main>
  )
}

"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

const SAMPLE_TITLES = [
  "Naruto",
  "Naruto Shippuden",
  "Bleach",
  "One Piece",
  "Attack on Titan",
  "Jujutsu Kaisen",
  "Demon Slayer",
  "My Hero Academia",
  "Fullmetal Alchemist: Brotherhood",
  "Death Note",
  "Spy x Family",
  "Chainsaw Man",
  "Vinland Saga",
  "Steins;Gate",
  "Code Geass",
  "Tokyo Ghoul",
  "Hunter x Hunter",
  "Haikyu!!",
  "Mob Psycho 100",
  "Sword Art Online",
  "Your Name",
  "A Silent Voice",
  "Toradora!",
]

export function SearchBar({ autoSubmit = true }: { autoSubmit?: boolean }) {
  const router = useRouter()
  const params = useSearchParams()
  const preset = params.get("q") || ""
  const [q, setQ] = useState(preset)
  const [open, setOpen] = useState(false)

  const suggestions = useMemo(() => {
    const v = q.trim().toLowerCase()
    if (!v) return []
    return SAMPLE_TITLES.filter((t) => t.toLowerCase().includes(v)).slice(0, 8)
  }, [q])

  function saveRecent(value: string) {
    try {
      const key = "animo_recent"
      const prev: string[] = JSON.parse(localStorage.getItem(key) || "[]")
      const next = [value, ...prev.filter((p) => p.toLowerCase() !== value.toLowerCase())].slice(0, 10)
      localStorage.setItem(key, JSON.stringify(next))
    } catch {}
  }

  function submit(value: string) {
    const v = value.trim()
    if (!v) return
    saveRecent(v)
    router.push(`/recommend?q=${encodeURIComponent(v)}`)
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <input
          type="text"
          className="w-full rounded-full bg-neumorphic-surface text-neumorphic-text px-4 py-3 outline-none focus:ring-2 focus:ring-neumorphic-accent/50 shadow-neumorphic-inset border-0 placeholder:text-neumorphic-muted"
          placeholder="Search an anime title..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 100)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit(q)
          }}
          aria-label="Anime search"
        />
        <button className="btn-neumorphic px-6 py-3 rounded-full text-sm font-medium" onClick={() => submit(q)}>
          Search
        </button>
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-2 w-full bg-neumorphic-surface rounded-2xl shadow-neumorphic border-0 max-h-64 overflow-auto">
          {suggestions.map((s) => (
            <li key={s}>
              <button
                className="w-full text-left px-4 py-3 text-neumorphic-text hover:bg-neumorphic-hover rounded-2xl transition-colors"
                onMouseDown={() => submit(s)}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

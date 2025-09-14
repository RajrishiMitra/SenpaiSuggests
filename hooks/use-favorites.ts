"use client"
import { useEffect, useState } from "react"

export type Favorite = { id: number; title: string; image?: string; url?: string }

const KEY = "senpai:favorites"

export function useFavorites() {
  const [favs, setFavs] = useState<Favorite[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setFavs(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(favs))
    } catch {}
  }, [favs])

  function add(f: Favorite) {
    setFavs((prev) => (prev.find((x) => x.id === f.id) ? prev : [...prev, f]))
  }
  function remove(id: number) {
    setFavs((prev) => prev.filter((x) => x.id !== id))
  }
  function toggle(f: Favorite) {
    setFavs((prev) => (prev.find((x) => x.id === f.id) ? prev.filter((x) => x.id !== f.id) : [...prev, f]))
  }
  function has(id: number) {
    return favs.some((x) => x.id === id)
  }
  return { favs, add, remove, toggle, has }
}

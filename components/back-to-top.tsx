"use client"

import { useEffect, useState } from "react"

export default function BackToTop() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
  if (!visible) return null
  return (
    <div className="backtotop">
      <button aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        <svg width="18" height="18" viewBox="0 0 24 24" className="text-gray-200" aria-hidden>
          <path fill="currentColor" d="M12 5l7 7-1.4 1.4L13 9.8V20h-2V9.8L6.4 13.4 5 12z" />
        </svg>
      </button>
    </div>
  )
}

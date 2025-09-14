"use client"

import { useRef } from "react"

export function FloatingActionButton({
  label = "Back to top",
  onClick,
}: {
  label?: string
  onClick?: () => void
}) {
  const ref = useRef<HTMLButtonElement>(null)

  return (
    <button
      ref={ref}
      className="btn-neumorphic fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center p-0 z-50"
      aria-label={label}
      onClick={() => {
        if (onClick) onClick()
        else window.scrollTo({ top: 0, behavior: "smooth" })
      }}
    >
      <span className="text-lg font-bold text-gray-200">↑</span>
    </button>
  )
}

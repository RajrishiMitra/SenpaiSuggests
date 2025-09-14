"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export function BackButton() {
  const router = useRouter()

  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      router.back()
    } else {
      // Fallback to trending page if no history
      router.push("/trends")
    }
  }

  return (
    <button
      onClick={handleBack}
      className="w-12 h-12 rounded-full flex items-center justify-center p-0 transition-all duration-300"
      style={{
        background: "#0A0C14",
        boxShadow: "6px 6px 12px #05060a, -6px -6px 12px #14161c",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "8px 8px 16px #05060a, -8px -8px 16px #14161c"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "6px 6px 12px #05060a, -6px -6px 12px #14161c"
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.boxShadow = "inset 4px 4px 8px #05060a, inset -4px -4px 8px #14161c"
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.boxShadow = "8px 8px 16px #05060a, -8px -8px 16px #14161c"
      }}
    >
      <ArrowLeft className="w-5 h-5 text-[#E0E0E0]" />
    </button>
  )
}

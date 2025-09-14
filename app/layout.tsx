import type React from "react"
import type { Metadata } from "next"
import { Inter, Geist_Mono } from "next/font/google"
import "./globals.css"
import BackToTop from "@/components/back-to-top"

export const metadata: Metadata = {
  title: "SenpAISuggests | AI Anime Recommendation System",
  description:
    "Discover your next anime with SenpAISuggests — powered by AI, anime datasets, and free APIs, styled with futuristic liquid-glass UI.",
  generator: "SenpAISuggests",
  icons: {
    icon: "/icon.png",
  },
}

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})
const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground relative">
        {/* subtle global neon grid background */}
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-grid-neon opacity-10" />
        {children}
        <BackToTop />
      </body>
    </html>
  )
}

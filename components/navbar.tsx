"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogIn, Sparkles } from "lucide-react"

const links = [
  { href: "/", label: "Home" },
  { href: "/recommend", label: "Recommend" },
  { href: "/trends", label: "Trends" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

export function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        checkUser()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        setProfile(profileData)
      } else {
        setProfile(null)
      }
    } catch (error) {
      console.error("Error checking user:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <header className="sticky top-0 z-[100]">
      <div className="card-neumorphic mx-4 mt-4">
        <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link href="/" className="group inline-flex items-center gap-3" aria-label="SenpAISuggests home">
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300"
              style={{
                background: "#0A0C14",
                boxShadow: "4px 4px 8px #05060a, -4px -4px 8px #14161c",
              }}
            >
              <Sparkles className="h-5 w-5 text-[#E0E0E0]" />
            </div>
            <span className="text-lg font-medium tracking-wide text-neumorphic">SenpAISuggests</span>
          </Link>
          <ul className="hidden md:flex items-center gap-2">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm transition-all duration-200 font-medium",
                    pathname === l.href
                      ? "text-gray-200 neumorphic-pressed"
                      : "text-gray-300 hover:text-gray-200 btn-neumorphic",
                  )}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="w-8 h-8 rounded-full neumorphic-inset animate-pulse" />
            ) : user ? (
              <Link href="/profile" className="flex items-center gap-2 btn-neumorphic px-3 py-2 rounded-lg">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} alt={profile?.full_name || user.email} />
                  <AvatarFallback className="bg-gray-600 text-white text-xs">
                    {profile?.full_name?.charAt(0) || user.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium text-gray-200">
                  {profile?.full_name || "Profile"}
                </span>
              </Link>
            ) : (
              <Link href="/auth/login" className="btn-neumorphic flex items-center gap-2 px-4 py-2 rounded-lg text-sm">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:block">Sign In</span>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}

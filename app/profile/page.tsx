"use client"

import type React from "react"

import { Navbar } from "@/components/navbar"
import { useEffect, useState } from "react"
import type { Anime } from "@/components/anime-card"
import { AnimeGrid } from "@/components/anime-grid"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, LogOut, Save, User } from "lucide-react"

interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url: string
  bio: string
}

interface WatchedAnime {
  id: string
  anime_id: number
  anime_title: string
  anime_image: string
  rating: number
  notes: string
  watched_at: string
}

export default function ProfilePage() {
  const [recent, setRecent] = useState<string[]>([])
  const [favorites, setFavorites] = useState<Anime[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [watchedAnime, setWatchedAnime] = useState<WatchedAnime[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
    loadLocalData()
  }, [])

  const loadProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Load profile
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (profileData) {
        setProfile(profileData)
        setFormData({
          full_name: profileData.full_name || "",
          bio: profileData.bio || "",
        })
      }

      // Load watched anime
      const { data: watchedData } = await supabase
        .from("watched_anime")
        .select("*")
        .eq("user_id", user.id)
        .order("watched_at", { ascending: false })

      if (watchedData) {
        setWatchedAnime(watchedData)
      }
    } catch (error) {
      console.error("Error loading profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadLocalData = () => {
    try {
      const rs = JSON.parse(localStorage.getItem("animo_recent") || "[]")
      const favs = JSON.parse(localStorage.getItem("animo_favorites") || "[]")
      setRecent(rs)
      setFavorites(favs)
    } catch {}
  }

  const handleUpdateProfile = async () => {
    if (!profile) return

    setUpdating(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          bio: formData.bio,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (!error) {
        setProfile({ ...profile, ...formData })
        setEditMode(false)
      }
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setUpdating(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !profile) return

    setUploadingAvatar(true)
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${profile.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", profile.id)

      if (!updateError) {
        setProfile({ ...profile, avatar_url: data.publicUrl })
      }
    } catch (error) {
      console.error("Error uploading avatar:", error)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  if (loading) {
    return (
      <main>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="card-neumorphic p-8">
            <div className="spinner-neumorphic mx-auto"></div>
            <p className="text-muted-neumorphic mt-4">Loading profile...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!profile) {
    return (
      <main>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="card-neumorphic p-8 text-center">
            <h1 className="text-2xl font-bold mb-4 text-neumorphic">Profile Not Found</h1>
            <p className="text-muted-neumorphic mb-6">Please sign in to view your profile.</p>
            <Button onClick={() => router.push("/auth/login")} className="btn-neumorphic">
              Sign In
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="card-neumorphic p-6 mb-8">
          <div className="flex items-start gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.full_name} />
                <AvatarFallback className="bg-gray-600 text-white text-xl">
                  {profile.full_name?.charAt(0) || profile.email.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4 cursor-pointer hover:scale-105 transition-transform z-20">
                <div
                  className="p-2 rounded-full transition-all duration-300"
                  style={{
                    background: "#0A0C14",
                    boxShadow: "4px 4px 8px #05060a, -4px -4px 8px #14161c",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "6px 6px 12px #05060a, -6px -6px 12px #14161c"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "4px 4px 8px #05060a, -4px -4px 8px #14161c"
                  }}
                >
                  <Camera className="h-4 w-4 text-[#E0E0E0]" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  className="hidden"
                />
              </label>
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <div className="spinner-neumorphic"></div>
                </div>
              )}
            </div>

            <div className="flex-1">
              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="full_name" className="text-neumorphic">
                      Full Name
                    </Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="input-neumorphic"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio" className="text-neumorphic">
                      Bio
                    </Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="input-neumorphic resize-none"
                      rows={3}
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleUpdateProfile} disabled={updating} className="btn-neumorphic">
                      <Save className="h-4 w-4 mr-2" />
                      {updating ? "Saving..." : "Save"}
                    </Button>
                    <Button onClick={() => setEditMode(false)} className="btn-neumorphic">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-bold text-neumorphic">{profile.full_name || "Anonymous User"}</h1>
                    <div className="flex gap-2">
                      <Button onClick={() => setEditMode(true)} size="sm" className="btn-neumorphic">
                        <User className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button
                        onClick={handleSignOut}
                        size="sm"
                        className="btn-neumorphic text-red-400 hover:text-red-300"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                  <p className="text-muted-neumorphic mb-2">{profile.email}</p>
                  {profile.bio && <p className="text-sm text-muted-neumorphic">{profile.bio}</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        {watchedAnime.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 section-neumorphic">Watched Anime ({watchedAnime.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {watchedAnime.slice(0, 6).map((anime) => (
                <div key={anime.id} className="card-neumorphic p-4">
                  <div className="flex gap-3">
                    <img
                      src={anime.anime_image || "/placeholder.svg"}
                      alt={anime.anime_title}
                      className="w-16 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate text-neumorphic">{anime.anime_title}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-yellow-400">★</span>
                        <span className="text-xs text-muted-neumorphic">{anime.rating}/10</span>
                      </div>
                      {anime.notes && <p className="text-xs text-muted-neumorphic mt-1 line-clamp-2">{anime.notes}</p>}
                      <p className="text-xs text-muted-neumorphic mt-1">
                        {new Date(anime.watched_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {watchedAnime.length > 6 && (
              <p className="text-center text-muted-neumorphic mt-4">
                And {watchedAnime.length - 6} more watched anime...
              </p>
            )}
          </div>
        )}

        <div className="card-neumorphic p-4 mb-8">
          <h2 className="font-semibold text-neumorphic">Recently Searched</h2>
          {recent.length === 0 && <p className="text-muted-neumorphic text-sm mt-1">No searches yet.</p>}
          {recent.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {recent.map((r: string) => (
                <span key={r} className="pill-neumorphic">
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-semibold mb-3 section-neumorphic">Saved Favorites</h2>
          {favorites.length > 0 ? (
            <AnimeGrid items={favorites} />
          ) : (
            <div className="card-neumorphic p-4">
              <p className="text-muted-neumorphic text-sm">No favorites saved yet.</p>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  )
}

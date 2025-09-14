"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#0A0C14" }}>
        <div className="w-full max-w-md">
          <div className="card-neumorphic p-8 space-y-6 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-neumorphic">Check Your Email</h1>
              <p className="text-muted-neumorphic">
                We've sent you a confirmation link at <strong>{email}</strong>
              </p>
            </div>
            <div className="neumorphic-inset p-4 rounded-lg">
              <p className="text-sm text-muted-neumorphic">
                Click the link in your email to activate your account, then you can sign in.
              </p>
            </div>
            <Link href="/auth/login" className="btn-neumorphic inline-block w-full py-3 px-4 text-center">
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#0A0C14" }}>
      <div className="w-full max-w-md">
        <div className="card-neumorphic p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-neumorphic">Join SenpAI</h1>
            <p className="text-muted-neumorphic">Create your anime tracking account</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium text-neumorphic">
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="input-neumorphic"
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-neumorphic">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-neumorphic"
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-neumorphic">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="input-neumorphic"
                placeholder="Create a password (min. 6 characters)"
              />
            </div>

            {error && (
              <div className="neumorphic-inset p-3 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={loading} className="btn-neumorphic w-full py-3">
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-neumorphic">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-gray-300 hover:text-gray-200 font-medium transition-colors">
                Sign in
              </Link>
            </p>
            <Link href="/" className="text-sm text-muted-neumorphic hover:text-neumorphic transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

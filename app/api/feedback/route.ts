import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create Supabase client with service role (server-side only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ do not expose this in client
)

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const email = formData.get("email") as string
    const message = formData.get("message") as string

    if (!email || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const { error } = await supabase.from("feedback").insert([{ email, message }])

    if (error) {
      console.error("Supabase insert error:", error.message)
      return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Unexpected error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

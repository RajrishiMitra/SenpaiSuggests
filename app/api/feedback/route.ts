import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const email = String(form.get("email") || "")
  const message = String(form.get("message") || "")
  if (!email || !message) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}

"use client"

import { Navbar } from "@/components/navbar"
import { useState } from "react"

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")

  async function submit(formData: FormData) {
    setStatus("sending")
    const res = await fetch("/api/feedback", { method: "POST", body: formData })
    if (res.ok) setStatus("sent")
    else setStatus("error")
  }

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold text-neumorphic">Contact & Feedback</h1>
        <p className="text-muted-neumorphic text-sm mt-1">Share ideas, report issues, or suggest features.</p>

        <form
          className="mt-6 card-neumorphic space-y-4"
          onSubmit={async (e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget as HTMLFormElement)
            await submit(fd)
          }}
        >
          <div>
            <label className="block text-sm mb-1 text-neumorphic" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="input-neumorphic w-full rounded-xl placeholder:text-muted-neumorphic"
              placeholder="your.email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-neumorphic" htmlFor="message">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              required
              className="input-neumorphic w-full rounded-xl placeholder:text-muted-neumorphic resize-none"
              placeholder="Tell us what's on your mind..."
            />
          </div>
          <button disabled={status === "sending"} className="btn-neumorphic disabled:opacity-70">
            {status === "sending" ? "Sending..." : "Send Feedback"}
          </button>
          {status === "sent" && <p className="text-green-400 text-sm">Thanks! We received your message.</p>}
          {status === "error" && <p className="text-red-400 text-sm">Something went wrong. Please try again.</p>}
        </form>
      </section>
    </main>
  )
}

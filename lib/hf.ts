const HF_MAX_RETRIES = 3
const HF_RETRY_DELAY_MS = 2500

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

export async function fetchHuggingFaceWithRetries(
  url: string,
  init: RequestInit = {},
  maxRetries = HF_MAX_RETRIES,
): Promise<Response> {
  let attempt = 0
  let lastErr: any = null

  while (attempt <= maxRetries) {
    const resp = await fetch(url, init)
    try {
      // Clone to read body without consuming original
      const clone = resp.clone()
      const text = await clone.text()
      // Try JSON parse; if fails, it's not the loading error
      let json: any = null
      try {
        json = JSON.parse(text)
      } catch {}
      if (
        json?.error &&
        typeof json.error === "string" &&
        json.error.toLowerCase().includes("model is currently loading")
      ) {
        if (attempt === maxRetries) return resp // give up but return last response
        await sleep(HF_RETRY_DELAY_MS)
        attempt++
        continue
      }
    } catch (e) {
      lastErr = e
    }
    return resp
  }
  throw lastErr ?? new Error("Hugging Face request failed after retries")
}

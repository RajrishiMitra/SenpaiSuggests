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
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const resp = await fetch(url, init)

      // If the response is OK (200-299), return it immediately.
      if (resp.ok) {
        return resp
      }

      // For server-side errors (5xx), we should retry.
      if (resp.status >= 500 && resp.status <= 599) {
        console.warn(`[hf-fetch] Received server error: ${resp.status}. Retrying...`)
        if (attempt < maxRetries) {
          await sleep(HF_RETRY_DELAY_MS * (attempt + 1))
          continue
        } else {
          // Return the last failed response if all retries are exhausted.
          return resp
        }
      }

      // For client-side errors (4xx), we check for the specific "model loading" case.
      if (resp.status >= 400 && resp.status <= 499) {
        // Clone to read body without consuming original response stream
        const respClone = resp.clone()
        const body = await respClone.json().catch(() => ({}))

        if (body?.error?.toLowerCase().includes("model is currently loading")) {
          console.warn(`[hf-fetch] Model is loading. Retrying...`)
          if (attempt < maxRetries) {
            await sleep(HF_RETRY_DELAY_MS * (attempt + 1))
            continue
          } else {
            return resp
          }
        }
      }

      // For any other non-ok response, don't retry, just return it.
      return resp
    } catch (error) {
      console.error(`[hf-fetch] Request failed with network error: ${error}. Retrying...`)
      if (attempt < maxRetries) {
        await sleep(HF_RETRY_DELAY_MS * (attempt + 1))
        continue
      } else {
        // If all retries fail due to network errors, throw the last error.
        throw new Error(`Hugging Face request failed after ${maxRetries} retries: ${error}`)
      }
    }
  }

  // This part should be unreachable, but as a fallback, throw an error.
  throw new Error("Hugging Face request failed unexpectedly after all retries.")
}

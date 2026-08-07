/**
 * Shared AI router.
 *
 * Single entry point (`callAI`) used by Workflows today and by Documents /
 * Resumes / Chat later. Providers are tried in order:
 *   1. Gemini  (GEMINI_API_KEY)
 *   2. Hugging Face Inference API (HUGGINGFACE_API_KEY) — fallback only
 *
 * Callers MUST send short, already-summarised prompts. Never pass raw file
 * dumps or full email bodies here — trim to the minimum context the model
 * needs to answer, otherwise the free-tier token budget is burnt in a few runs.
 */

const GEMINI_MODEL = 'gemini-3.5-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

/**
 * HF retired `api-inference.huggingface.co` (the host no longer resolves at
 * all — DNS ENOTFOUND, which surfaces as an opaque "fetch failed"). Inference
 * now goes through the Inference Providers router, whose `/v1/chat/completions`
 * surface is OpenAI-compatible.
 *
 * Model choice is constrained to what the router actually serves — it dropped
 * `google/flan-t5-small` (no `text2text-generation` models remain) and later
 * `Qwen/Qwen2.5-1.5B-Instruct`, which began returning
 * `400 model_not_supported`. Verify against `GET /v1/models` before changing
 * this, since an unserved id fails at call time, not at build time.
 *
 * Qwen3-4B-Instruct-2507 is served, and measured against the alternatives it
 * answered a resume-scoring prompt in ~1.2s versus ~13.5s for
 * Llama-3.1-8B-Instruct, with unfenced JSON that needs no repair. Speed
 * matters here: this path only runs after Gemini has already failed, so the
 * request has burnt most of its budget. Use the `-Instruct-2507` build, not
 * plain Qwen3 — the latter emits `<think>` blocks ahead of the answer.
 */
const HF_MODEL = 'Qwen/Qwen3-4B-Instruct-2507'
const HF_URL = 'https://router.huggingface.co/v1/chat/completions'

/**
 * Gemini 3.x models think before answering, and a 5-candidate resume batch was
 * measured at ~17-25s end to end. The old 20s ceiling aborted those calls.
 */
const REQUEST_TIMEOUT_MS = 60_000

/**
 * `maxOutputTokens` is a budget for thinking *and* visible output. At 1024 a
 * measured resume batch spent 981 tokens thinking and emitted 39 — the JSON
 * array was cut off mid-object with `finishReason: MAX_TOKENS`.
 */
const MAX_OUTPUT_TOKENS = 4096

/**
 * In-memory response cache. Keyed by a hash of the prompt so repeated
 * identical prompts during local testing don't spend quota. Lives for the
 * lifetime of the server process only — deliberately not persisted.
 */
const globalForAiCache = globalThis as unknown as {
  aiResponseCache: Map<string, string> | undefined
}

const cache = globalForAiCache.aiResponseCache ?? new Map<string, string>()
globalForAiCache.aiResponseCache = cache

const MAX_CACHE_ENTRIES = 200

/** Small, fast, non-cryptographic hash (FNV-1a) — cache keys only. */
function hashPrompt(prompt: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < prompt.length; i += 1) {
    hash ^= prompt.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36) + ':' + prompt.length
}

/**
 * Turn an opaque `TypeError: fetch failed` into something diagnosable. Node's
 * fetch hides the real reason on `error.cause` (DNS ENOTFOUND, ECONNREFUSED,
 * TLS errors, …), which is why transport failures used to read as a bare
 * "fetch failed" with no indication of what actually went wrong.
 */
function describeNetworkError(error: unknown): string {
  if (error instanceof Error && error.name === 'AbortError') {
    return `request timed out after ${REQUEST_TIMEOUT_MS}ms`
  }

  const cause = (error as { cause?: { code?: string; message?: string } })?.cause
  if (cause?.code) {
    return cause.message ? `${cause.code} — ${cause.message}` : cause.code
  }
  if (cause?.message) return cause.message

  return error instanceof Error ? error.message : String(error)
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  provider: string,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch (error) {
    // Log the real error object so the cause chain survives into the console.
    console.error(`[ai-router] ${provider} transport failure calling ${url}:`, error)
    throw new Error(
      `${provider} unreachable at ${url}: ${describeNetworkError(error)}`,
      { cause: error },
    )
  } finally {
    clearTimeout(timer)
  }
}

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const response = await fetchWithTimeout(
    GEMINI_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          // Every caller here wants a short structured answer, not reasoning.
          // Disabling thinking keeps the whole budget for visible output and
          // cut a measured batch from 25s to 17s.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    },
    'gemini',
  )

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Gemini request failed (${response.status}): ${detail.slice(0, 300)}`)
  }

  const payload = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }

  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? '')
    .join('')
    .trim()

  if (!text) {
    throw new Error('Gemini returned an empty response')
  }

  return text
}

async function callHuggingFace(prompt: string, apiKey: string): Promise<string> {
  const response = await fetchWithTimeout(
    HF_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: HF_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: MAX_OUTPUT_TOKENS,
      }),
    },
    'huggingface',
  )

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    // 403 here almost always means the token lacks the "Make calls to
    // Inference Providers" permission rather than the model being wrong.
    const hint =
      response.status === 403
        ? ' — check HUGGINGFACE_API_KEY has the "Make calls to Inference Providers" scope'
        : ''
    throw new Error(
      `Hugging Face request failed (${response.status} ${response.statusText}): ${detail.slice(0, 300)}${hint}`,
    )
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
    error?: string | { message?: string }
  }

  const text = payload.choices?.[0]?.message?.content?.trim()
  if (text) return text

  const apiError =
    typeof payload.error === 'string' ? payload.error : payload.error?.message
  throw new Error(
    apiError
      ? `Hugging Face returned an error: ${apiError}`
      : 'Hugging Face returned an empty response',
  )
}

/**
 * Send a prompt to the configured AI provider and return raw text.
 *
 * Keep `prompt` concise — the caller is responsible for trimming context.
 *
 * @throws if no API key is configured, or if every provider fails.
 */
export async function callAI(prompt: string): Promise<string> {
  const trimmed = prompt.trim()
  if (!trimmed) {
    throw new Error('callAI requires a non-empty prompt')
  }

  const key = hashPrompt(trimmed)
  const cached = cache.get(key)
  if (cached !== undefined) {
    return cached
  }

  const geminiKey = process.env.GEMINI_API_KEY?.trim()
  const hfKey = process.env.HUGGINGFACE_API_KEY?.trim()

  if (!geminiKey && !hfKey) {
    throw new Error(
      'API key not configured: set GEMINI_API_KEY (or HUGGINGFACE_API_KEY) in .env',
    )
  }

  const failures: string[] = []

  if (geminiKey) {
    try {
      const text = await callGemini(trimmed, geminiKey)
      rememberResponse(key, text)
      return text
    } catch (error) {
      console.error('[ai-router] gemini failed, falling back to huggingface:', error)
      failures.push(`gemini: ${(error as Error).message}`)
    }
  } else {
    failures.push('gemini: GEMINI_API_KEY not configured')
  }

  if (hfKey) {
    try {
      const text = await callHuggingFace(trimmed, hfKey)
      rememberResponse(key, text)
      return text
    } catch (error) {
      console.error('[ai-router] huggingface fallback failed:', error)
      failures.push(`huggingface: ${(error as Error).message}`)
    }
  } else {
    failures.push('huggingface: HUGGINGFACE_API_KEY not configured')
  }

  throw new Error(`AI service unavailable — ${failures.join(' | ')}`)
}

function rememberResponse(key: string, text: string) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(key, text)
}

/** Test helper — clears the in-memory prompt cache. */
export function clearAICache() {
  cache.clear()
}

import { createHash } from 'crypto'

const GEMINI_MODEL = 'gemini-3.5-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const HF_MODEL = 'Qwen/Qwen3-4B-Instruct-2507'
const HF_URL = 'https://router.huggingface.co/v1/chat/completions'

const REQUEST_TIMEOUT_MS = 60_000

const MAX_OUTPUT_TOKENS = 4096

const globalForAiCache = globalThis as unknown as {
  aiResponseCache: Map<string, string> | undefined
}

const cache = globalForAiCache.aiResponseCache ?? new Map<string, string>()
globalForAiCache.aiResponseCache = cache

const MAX_CACHE_ENTRIES = 200

function hashPrompt(prompt: string, userId: string): string {
  return createHash('sha256').update(`${userId}:${prompt}`).digest('hex')
}

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

export async function callAI(prompt: string, userId = ''): Promise<string> {
  const trimmed = prompt.trim()
  if (!trimmed) {
    throw new Error('callAI requires a non-empty prompt')
  }

  const key = hashPrompt(trimmed, userId)
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

export function clearAICache() {
  cache.clear()
}

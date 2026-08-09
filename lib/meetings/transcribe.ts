/**
 * Speech-to-text for the Meetings module.
 *
 * Endpoint choice is measured, not guessed — probed against the live router on
 * 2026-08-10:
 *
 *   POST router.huggingface.co/hf-inference/models/openai/whisper-large-v3
 *     → 200, {"text":" And so my fellow Americans, ask not what your country
 *       can do for you…"} in ~2.3s for a 352 KB / 11s WAV.  ✅ works
 *   whisper-small / whisper-tiny / distil-whisper/distil-large-v3
 *     → 400 {"error":"Model not supported by provider hf-inference"}
 *   POST router.huggingface.co/v1/audio/transcriptions  → 404 Not Found
 *   fal-ai and fireworks-ai ASR routes → 400 model_not_supported
 *
 * Two consequences encoded below:
 *
 * 1. `whisper-large-v3` on the `hf-inference` proxy is the ONLY served option,
 *    so there is no model fallback list to try — a different id is a 400, not
 *    a slower success.
 * 2. The body must be the RAW audio bytes. The `{"inputs": "<base64>"}` shape
 *    that the chat surface uses fails here with
 *    `[Errno 36] File name too long: 'UklGRk…'` — the provider treats the
 *    string as a path rather than decoding it.
 *
 * Note that `GET /v1/models` does NOT enumerate this model: that listing covers
 * the OpenAI-compatible chat router only (131 models, all text/image input),
 * which is why a modality scan there finds no STT and is misleading.
 */

const WHISPER_MODEL = 'openai/whisper-large-v3'
const WHISPER_URL = `https://router.huggingface.co/hf-inference/models/${WHISPER_MODEL}`

/** Whisper is ~2-3s for short clips, but a long meeting is minutes of audio. */
const TRANSCRIBE_TIMEOUT_MS = 240_000

/**
 * The router rejects very large bodies outright. Anything past this is better
 * refused with a clear message than sent and failed opaquely.
 */
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024

/** Thrown for every failure path so callers can mark the row FAILED cleanly. */
export class TranscriptionError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'TranscriptionError'
  }
}

/** Surfaced when the provider is reachable but serves no STT model. */
export const STT_UNAVAILABLE_NOTE =
  'Audio transcription requires a hosted STT model — none currently available on free tier. Paste the transcript manually to continue.'

function describeCause(error: unknown): string {
  if (error instanceof Error && error.name === 'AbortError') {
    return `transcription timed out after ${TRANSCRIBE_TIMEOUT_MS / 1000}s`
  }
  const cause = (error as { cause?: { code?: string; message?: string } })?.cause
  if (cause?.code) return cause.message ? `${cause.code} — ${cause.message}` : cause.code
  return error instanceof Error ? error.message : String(error)
}

/**
 * Download the stored audio. Kept separate from the POST so a storage failure
 * reads differently from a model failure in the status message.
 */
async function fetchAudio(fileUrl: string): Promise<Buffer> {
  let response: Response
  try {
    response = await fetch(fileUrl)
  } catch (error) {
    throw new TranscriptionError(
      `Could not download the audio file: ${describeCause(error)}`,
      { cause: error },
    )
  }

  if (!response.ok) {
    throw new TranscriptionError(
      `Could not download the audio file (HTTP ${response.status})`,
    )
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.length === 0) {
    throw new TranscriptionError('The stored audio file is empty')
  }
  if (buffer.length > MAX_AUDIO_BYTES) {
    throw new TranscriptionError(
      `Audio is ${(buffer.length / 1024 / 1024).toFixed(1)} MB — the transcription provider caps uploads at ${MAX_AUDIO_BYTES / 1024 / 1024} MB`,
    )
  }
  return buffer
}

/**
 * Transcribe an audio file to plain text.
 *
 * @param fileUrl a URL the server can fetch (a signed storage URL).
 * @throws {TranscriptionError} on download, transport, provider or empty-result
 *   failures. A 400 `model_not_supported` is reported as
 *   {@link STT_UNAVAILABLE_NOTE} so the caller can steer the user to the
 *   manual-transcript path.
 */
export async function transcribeAudio(fileUrl: string): Promise<string> {
  const apiKey = process.env.HUGGINGFACE_API_KEY?.trim()
  if (!apiKey) {
    throw new TranscriptionError(
      'Transcription is not configured: set HUGGINGFACE_API_KEY in .env',
    )
  }

  const audio = await fetchAudio(fileUrl)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TRANSCRIBE_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(WHISPER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        // Whisper sniffs the real container, so a generic type is safe for
        // mp3/wav/m4a alike — verified by sending WAV bytes as audio/mpeg.
        'Content-Type': 'application/octet-stream',
      },
      body: new Uint8Array(audio),
      signal: controller.signal,
    })
  } catch (error) {
    console.error('[meetings/transcribe] transport failure:', error)
    throw new TranscriptionError(
      `Transcription provider unreachable: ${describeCause(error)}`,
      { cause: error },
    )
  } finally {
    clearTimeout(timer)
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '')

    // The provider dropped this model — exactly the free-tier gap the manual
    // transcript path exists for.
    if (response.status === 400 && /not supported by provider/i.test(detail)) {
      throw new TranscriptionError(STT_UNAVAILABLE_NOTE)
    }
    if (response.status === 403) {
      throw new TranscriptionError(
        'Transcription rejected (403) — check HUGGINGFACE_API_KEY has the "Make calls to Inference Providers" scope',
      )
    }
    // A cold model returns 503 with an estimated load time.
    if (response.status === 503) {
      throw new TranscriptionError(
        'The transcription model is loading on the provider. Try again in a minute.',
      )
    }

    throw new TranscriptionError(
      `Transcription failed (${response.status} ${response.statusText}): ${detail.slice(0, 300)}`,
    )
  }

  const payload = (await response.json().catch(() => null)) as
    | { text?: string; error?: string }
    | null

  if (payload?.error) {
    throw new TranscriptionError(`Transcription failed: ${payload.error}`)
  }

  const text = payload?.text?.trim()
  if (!text) {
    throw new TranscriptionError(
      'The audio produced no speech — check the recording actually contains audible dialogue.',
    )
  }

  return text
}

const WHISPER_MODEL = 'openai/whisper-large-v3'
const WHISPER_URL = `https://router.huggingface.co/hf-inference/models/${WHISPER_MODEL}`

const TRANSCRIBE_TIMEOUT_MS = 240_000

export const MAX_AUDIO_BYTES = 25 * 1024 * 1024

export class TranscriptionError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'TranscriptionError'
  }
}

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

    if (response.status === 400 && /not supported by provider/i.test(detail)) {
      throw new TranscriptionError(STT_UNAVAILABLE_NOTE)
    }
    if (response.status === 403) {
      throw new TranscriptionError(
        'Transcription rejected (403) — check HUGGINGFACE_API_KEY has the "Make calls to Inference Providers" scope',
      )
    }
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

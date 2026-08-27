import { generateText } from '@/lib/ai/llm-gateway'
import { parseJsonObject } from '@/lib/ai/json'

const GROQ_WHISPER_MODEL = 'whisper-large-v3'
const GROQ_TRANSCRIPTIONS_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'

export interface TranscribeAudioOptions {
  buffer: Buffer
  fileName: string
  mimeType: string
  language?: string
}

export interface TranscribeAudioResult {
  transcript: string
  language?: string
}

export async function transcribeAudio(options: TranscribeAudioOptions): Promise<TranscribeAudioResult> {
  const apiKey = process.env.GROQ_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured — required for speech-to-text transcription')
  }

  const form = new FormData()
  form.append('file', new Blob([options.buffer as BlobPart], { type: options.mimeType }), options.fileName)
  form.append('model', GROQ_WHISPER_MODEL)
  if (options.language) form.append('language', options.language)

  const response = await fetch(GROQ_TRANSCRIPTIONS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Groq transcription request failed (${response.status}): ${detail.slice(0, 300)}`)
  }

  const payload = (await response.json()) as { text?: string }
  const transcript = payload.text?.trim()
  if (!transcript) {
    throw new Error('Transcription returned no text')
  }

  return { transcript, language: options.language }
}

export interface VoiceCommand {
  intent: string
  action: string
  target: string | null
  parameters: Record<string, unknown>
  confidence: number
}

const VOICE_COMMAND_SCHEMA_PROMPT = [
  'You convert a transcribed voice command into a structured workflow/agent trigger.',
  'Respond with ONLY a JSON object matching this shape:',
  '{"intent": string, "action": string, "target": string | null, "parameters": object, "confidence": number between 0 and 1}',
  'Known actions include: create_workflow, run_workflow, screen_resume, generate_report, search_documents, schedule_meeting, send_notification, unknown.',
  'If the command does not clearly map to a known action, use action "unknown" and a low confidence.',
].join('\n')

export async function parseVoiceCommand(transcript: string): Promise<VoiceCommand> {
  const trimmed = transcript.trim()
  if (!trimmed) {
    throw new Error('parseVoiceCommand requires a non-empty transcript')
  }

  const { text } = await generateText({
    messages: [
      { role: 'system', content: VOICE_COMMAND_SCHEMA_PROMPT },
      { role: 'user', content: trimmed },
    ],
    task: 'voice-command',
    maxTokens: 512,
    temperature: 0,
  })

  const parsed = parseJsonObject(text)
  if (!parsed) {
    throw new Error('Could not parse voice command into structured output')
  }

  return {
    intent: typeof parsed.intent === 'string' ? parsed.intent : 'unknown',
    action: typeof parsed.action === 'string' ? parsed.action : 'unknown',
    target: typeof parsed.target === 'string' ? parsed.target : null,
    parameters:
      parsed.parameters && typeof parsed.parameters === 'object'
        ? (parsed.parameters as Record<string, unknown>)
        : {},
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
  }
}

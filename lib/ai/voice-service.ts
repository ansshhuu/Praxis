import OpenAI from 'openai'
import { toFile } from 'openai/uploads'

import { generateText } from '@/lib/ai/llm-gateway'
import { parseJsonObject } from '@/lib/ai/json'

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
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured — required for speech-to-text transcription')
  }

  const client = new OpenAI({ apiKey })
  const file = await toFile(options.buffer, options.fileName, { type: options.mimeType })

  const response = await client.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: options.language,
  })

  const transcript = response.text?.trim()
  if (!transcript) {
    throw new Error('Transcription returned no text')
  }

  return { transcript, language: options.language }
}

export interface SynthesizeSpeechOptions {
  text: string
  voiceId?: string
  modelId?: string
}

export interface SynthesizeSpeechResult {
  audio: ArrayBuffer
  contentType: string
}

export async function synthesizeSpeech(options: SynthesizeSpeechOptions): Promise<SynthesizeSpeechResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not configured — required for text-to-speech synthesis')
  }

  const trimmed = options.text.trim()
  if (!trimmed) {
    throw new Error('synthesizeSpeech requires non-empty text')
  }

  const voiceId = options.voiceId?.trim() || process.env.ELEVENLABS_VOICE_ID?.trim()
  if (!voiceId) {
    throw new Error('No ElevenLabs voiceId provided and ELEVENLABS_VOICE_ID is not configured')
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text: trimmed,
      model_id: options.modelId ?? 'eleven_multilingual_v2',
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`ElevenLabs request failed (${response.status}): ${detail.slice(0, 300)}`)
  }

  const audio = await response.arrayBuffer()
  return { audio, contentType: response.headers.get('content-type') ?? 'audio/mpeg' }
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

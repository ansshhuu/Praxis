import { NextResponse } from 'next/server'

import { transcribeAudio } from '@/lib/ai/voice-service'
import { getCurrentUserId } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 120

const MAX_FILE_BYTES = 25 * 1024 * 1024

export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json(
      { error: 'Expected multipart/form-data with an "audio" field' },
      { status: 400 },
    )
  }

  const file = form.get('audio')
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: `Audio must be ${MAX_FILE_BYTES / (1024 * 1024)} MB or smaller` },
      { status: 413 },
    )
  }

  const language = form.get('language')
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    const result = await transcribeAudio({
      buffer,
      fileName: file.name || 'audio.webm',
      mimeType: file.type || 'audio/webm',
      language: typeof language === 'string' && language.trim() ? language.trim() : undefined,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('[voice/transcribe] failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to transcribe audio' },
      { status: 502 },
    )
  }
}

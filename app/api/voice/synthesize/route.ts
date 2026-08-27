import { NextResponse } from 'next/server'

import { enforceRateLimit } from '@/lib/security/rate-limit'
import { getCurrentUserId } from '@/lib/auth/session'
import { synthesizeSpeech } from '@/lib/ai/voice-service'
import { toSafeErrorMessage } from '@/lib/security/error-handler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_TEXT_LENGTH = 5000
const VOICE_RATE_LIMIT = 20
const VOICE_RATE_WINDOW_SECONDS = 60

export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const denied = await enforceRateLimit('voice-synthesize', userId, VOICE_RATE_LIMIT, VOICE_RATE_WINDOW_SECONDS)
  if (denied) {
    return NextResponse.json(denied.body, { status: denied.status })
  }

  let body: { text?: unknown; voiceId?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `text must be ${MAX_TEXT_LENGTH} characters or fewer` },
      { status: 413 },
    )
  }

  const voiceId = typeof body.voiceId === 'string' && body.voiceId.trim() ? body.voiceId.trim() : undefined

  try {
    const { audio, contentType } = await synthesizeSpeech({ text, voiceId })
    return new NextResponse(audio, {
      status: 200,
      headers: { 'Content-Type': contentType, 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    return NextResponse.json(
      { error: toSafeErrorMessage(error, 'Failed to synthesize speech') },
      { status: 502 },
    )
  }
}

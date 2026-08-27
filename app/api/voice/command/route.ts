import { NextResponse } from 'next/server'

import { enforceRateLimit } from '@/lib/security/rate-limit'
import { getCurrentUserId } from '@/lib/auth/session'
import { parseVoiceCommand } from '@/lib/ai/voice-service'
import { toSafeErrorMessage } from '@/lib/security/error-handler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_TRANSCRIPT_LENGTH = 2000
const VOICE_RATE_LIMIT = 20
const VOICE_RATE_WINDOW_SECONDS = 60

export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const denied = await enforceRateLimit('voice-command', userId, VOICE_RATE_LIMIT, VOICE_RATE_WINDOW_SECONDS)
  if (denied) {
    return NextResponse.json(denied.body, { status: denied.status })
  }

  let body: { transcript?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const transcript = typeof body.transcript === 'string' ? body.transcript.trim() : ''
  if (!transcript) {
    return NextResponse.json({ error: 'transcript is required' }, { status: 400 })
  }
  if (transcript.length > MAX_TRANSCRIPT_LENGTH) {
    return NextResponse.json(
      { error: `transcript must be ${MAX_TRANSCRIPT_LENGTH} characters or fewer` },
      { status: 413 },
    )
  }

  try {
    const command = await parseVoiceCommand(transcript)
    return NextResponse.json(command)
  } catch (error) {
    return NextResponse.json(
      { error: toSafeErrorMessage(error, 'Failed to parse voice command') },
      { status: 502 },
    )
  }
}

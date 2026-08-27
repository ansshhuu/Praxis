import { NextResponse } from 'next/server'

import { generatePost } from '@/lib/automation/marketing-service'
import { getCurrentUserId } from '@/lib/auth/session'
import { toSafeErrorMessage } from '@/lib/security/error-handler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ALLOWED_PLATFORMS = new Set(['linkedin', 'twitter'])

export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { platform?: unknown; topic?: unknown; tone?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const platform = typeof body.platform === 'string' ? body.platform.trim().toLowerCase() : ''
  if (!ALLOWED_PLATFORMS.has(platform)) {
    return NextResponse.json({ error: 'platform must be "linkedin" or "twitter"' }, { status: 400 })
  }

  const topic = typeof body.topic === 'string' ? body.topic.trim() : ''
  if (!topic) {
    return NextResponse.json({ error: 'topic is required' }, { status: 400 })
  }

  const tone = typeof body.tone === 'string' && body.tone.trim() ? body.tone.trim() : 'professional'

  try {
    const post = await generatePost({ userId, platform: platform as 'linkedin' | 'twitter', topic, tone })
    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: toSafeErrorMessage(error, 'Failed to generate post') },
      { status: 502 },
    )
  }
}

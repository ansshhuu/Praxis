import { NextResponse } from 'next/server'

import { generateResolutionReply } from '@/lib/automation/support-service'
import { getCurrentUserId } from '@/lib/auth/session'
import { toSafeErrorMessage } from '@/lib/security/error-handler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { subject?: unknown; message?: unknown; category?: unknown; escalate?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!subject || !message) {
    return NextResponse.json({ error: 'subject and message are required' }, { status: 400 })
  }

  const category =
    typeof body.category === 'string' && body.category.trim() ? body.category.trim() : 'general'
  const escalate = body.escalate === true

  try {
    const result = await generateResolutionReply({ subject, message, category, escalate })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: toSafeErrorMessage(error, 'Failed to generate reply') },
      { status: 502 },
    )
  }
}

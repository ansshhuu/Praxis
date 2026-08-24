import { NextResponse } from 'next/server'

import { ingestTicket } from '@/lib/automation/support-service'
import { getCurrentUserId } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

const MAX_MESSAGE_LENGTH = 5000

export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { subject?: unknown; message?: unknown }
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
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `message must be ${MAX_MESSAGE_LENGTH} characters or fewer` },
      { status: 413 },
    )
  }

  try {
    const ticket = await ingestTicket({ subject, message })
    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error) {
    console.error('[automation/support/ticket] failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to ingest ticket' },
      { status: 502 },
    )
  }
}

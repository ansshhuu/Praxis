import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { ingestTicket, TicketIngestError } from '@/lib/automation/support-service'
import { toClassifiedErrorMessage } from '@/lib/security/error-handler'

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
    const ticket = await ingestTicket({ userId, subject, message })
    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error) {
    const message = toClassifiedErrorMessage(error, 'Failed to ingest ticket', (err) => {
      if (err instanceof TicketIngestError) {
        switch (err.code) {
          case 'classification_failed':
            return 'Failed to ingest ticket: classification service timeout'
          case 'db_insert_failed':
            return 'Failed to ingest ticket: could not save to database'
        }
      }
      return null
    })
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

import { NextResponse } from 'next/server'

import { sendTicketReply, TicketNotFoundError } from '@/lib/automation/support-service'
import { getCurrentUserId } from '@/lib/auth/session'
import { toSafeErrorMessage } from '@/lib/security/error-handler'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { ticketId?: unknown; reply?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const ticketId = typeof body.ticketId === 'string' ? body.ticketId.trim() : ''
  const reply = typeof body.reply === 'string' ? body.reply.trim() : ''
  if (!ticketId || !reply) {
    return NextResponse.json({ error: 'ticketId and reply are required' }, { status: 400 })
  }

  try {
    const ticket = await sendTicketReply(userId, ticketId, reply)
    return NextResponse.json({ ticket })
  } catch (error) {
    if (error instanceof TicketNotFoundError) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: toSafeErrorMessage(error, 'Failed to send reply') },
      { status: 502 },
    )
  }
}

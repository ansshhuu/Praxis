import { NextResponse } from 'next/server'

import { listTickets } from '@/lib/automation/support-service'
import { getCurrentUserId } from '@/lib/auth/session'
import { toSafeErrorMessage } from '@/lib/security/error-handler'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const tickets = await listTickets(userId)
    return NextResponse.json({ tickets })
  } catch (error) {
    return NextResponse.json(
      { error: toSafeErrorMessage(error, 'Failed to load tickets') },
      { status: 502 },
    )
  }
}

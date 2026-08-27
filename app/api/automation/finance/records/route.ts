import { NextResponse } from 'next/server'

import { listFinanceRecords } from '@/lib/automation/finance-service'
import { getCurrentUserId } from '@/lib/auth/session'
import { toSafeErrorMessage } from '@/lib/security/error-handler'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const sinceParam = searchParams.get('since')
  const since =
    sinceParam && !Number.isNaN(Date.parse(sinceParam))
      ? new Date(sinceParam)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  try {
    const records = await listFinanceRecords(userId, since)
    return NextResponse.json({ records })
  } catch (error) {
    return NextResponse.json(
      { error: toSafeErrorMessage(error, 'Failed to load finance records') },
      { status: 502 },
    )
  }
}

import { NextResponse } from 'next/server'

import { buildBudgetReport } from '@/lib/automation/finance-service'
import { getCurrentUserId } from '@/lib/auth/session'

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
    const report = await buildBudgetReport(since)
    return NextResponse.json({ report })
  } catch (error) {
    console.error('[automation/finance/budget-report] failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to build budget report' },
      { status: 502 },
    )
  }
}

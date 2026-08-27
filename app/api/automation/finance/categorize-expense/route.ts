import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { recordFinanceEntry } from '@/lib/automation/finance-service'
import { toSafeErrorMessage } from '@/lib/security/error-handler'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    vendor?: unknown
    description?: unknown
    amount?: unknown
    tax?: unknown
    dueDate?: unknown
    budgetThreshold?: unknown
    historicalAverage?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const vendor = typeof body.vendor === 'string' ? body.vendor.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const amount = typeof body.amount === 'number' ? body.amount : NaN
  if (!description || !Number.isFinite(amount)) {
    return NextResponse.json({ error: 'description and a numeric amount are required' }, { status: 400 })
  }

  const tax = typeof body.tax === 'number' ? body.tax : 0
  const dueDate = typeof body.dueDate === 'string' && body.dueDate.trim() ? new Date(body.dueDate) : null
  const budgetThreshold = typeof body.budgetThreshold === 'number' ? body.budgetThreshold : Infinity
  const historicalAverage = typeof body.historicalAverage === 'number' ? body.historicalAverage : 0

  try {
    const record = await recordFinanceEntry({
      userId,
      vendor,
      description,
      amount,
      tax,
      dueDate,
      budgetThreshold,
      historicalAverage,
      type: 'expense',
    })
    return NextResponse.json({ record }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: toSafeErrorMessage(error, 'Failed to categorize expense') },
      { status: 502 },
    )
  }
}

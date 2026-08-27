import { NextResponse } from 'next/server'

import { generateOfferLetter } from '@/lib/automation/hr-service'
import { requireResumeAccess } from '@/lib/auth/session'
import { toSafeErrorMessage } from '@/lib/security/error-handler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const auth = await requireResumeAccess()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let body: {
    candidateName?: unknown
    role?: unknown
    salary?: unknown
    currency?: unknown
    salaryPeriod?: unknown
    startDate?: unknown
    company?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const candidateName = typeof body.candidateName === 'string' ? body.candidateName.trim() : ''
  const role = typeof body.role === 'string' ? body.role.trim() : ''
  const company = typeof body.company === 'string' ? body.company.trim() : ''
  const startDate = typeof body.startDate === 'string' ? body.startDate.trim() : ''
  const salary = typeof body.salary === 'number' ? body.salary : 0
  const currency = typeof body.currency === 'string' && body.currency.trim() ? body.currency.trim() : '$'
  const salaryPeriod = typeof body.salaryPeriod === 'string' && body.salaryPeriod.trim() ? body.salaryPeriod.trim() : 'per year'

  if (!candidateName || !role || !company || !startDate) {
    return NextResponse.json(
      { error: 'candidateName, role, company, and startDate are required' },
      { status: 400 },
    )
  }

  try {
    const letter = await generateOfferLetter({ candidateName, role, salary, currency, salaryPeriod, startDate, company })
    return NextResponse.json({ letter })
  } catch (error) {
    return NextResponse.json(
      { error: toSafeErrorMessage(error, 'Failed to generate offer letter') },
      { status: 502 },
    )
  }
}

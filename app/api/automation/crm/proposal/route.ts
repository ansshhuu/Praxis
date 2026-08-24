import { NextResponse } from 'next/server'

import { generateProposal } from '@/lib/automation/crm-service'
import { getCurrentUserId } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_REQUIREMENTS_LENGTH = 4000

export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { leadName?: unknown; company?: unknown; requirements?: unknown; budget?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const leadName = typeof body.leadName === 'string' ? body.leadName.trim() : ''
  const company = typeof body.company === 'string' ? body.company.trim() : ''
  const requirements = typeof body.requirements === 'string' ? body.requirements.trim() : ''
  if (!leadName || !company || !requirements) {
    return NextResponse.json(
      { error: 'leadName, company, and requirements are required' },
      { status: 400 },
    )
  }
  if (requirements.length > MAX_REQUIREMENTS_LENGTH) {
    return NextResponse.json(
      { error: `requirements must be ${MAX_REQUIREMENTS_LENGTH} characters or fewer` },
      { status: 413 },
    )
  }

  const budget = typeof body.budget === 'number' ? body.budget : 0

  try {
    const proposal = await generateProposal({ leadName, company, requirements, budget })
    return NextResponse.json({ proposal })
  } catch (error) {
    console.error('[automation/crm/proposal] failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to generate proposal' },
      { status: 502 },
    )
  }
}

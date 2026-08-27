import { NextResponse } from 'next/server'

import { generateProposal } from '@/lib/automation/crm-service'
import { getCurrentUserId } from '@/lib/auth/session'
import { toClassifiedErrorMessage } from '@/lib/security/error-handler'
import { PROPOSAL_BUDGET_MAX, PROPOSAL_REQUIREMENTS_MAX_LENGTH } from '@/lib/validation/proposal'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function classifyProposalError(error: unknown): string | null {
  if (error instanceof Error) {
    if (/No LLM provider is configured/i.test(error.message)) {
      return 'Failed to generate proposal: no AI provider is configured. Contact support.'
    }
    if (/All configured LLM providers failed/i.test(error.message)) {
      return 'Failed to generate proposal: the AI provider is temporarily unavailable. Please try again shortly.'
    }
  }
  return null
}

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
  if (!leadName) {
    return NextResponse.json({ error: "Failed to generate proposal: missing required field 'leadName'" }, { status: 400 })
  }
  if (!company) {
    return NextResponse.json({ error: "Failed to generate proposal: missing required field 'company'" }, { status: 400 })
  }
  if (!requirements) {
    return NextResponse.json({ error: "Failed to generate proposal: missing required field 'requirements'" }, { status: 400 })
  }
  if (requirements.length > PROPOSAL_REQUIREMENTS_MAX_LENGTH) {
    return NextResponse.json(
      { error: `Failed to generate proposal: requirements must be ${PROPOSAL_REQUIREMENTS_MAX_LENGTH} characters or fewer` },
      { status: 413 },
    )
  }

  const budgetRaw = typeof body.budget === 'number' ? body.budget : Number(body.budget)
  if (!Number.isFinite(budgetRaw)) {
    return NextResponse.json({ error: 'Failed to generate proposal: budget must be a number' }, { status: 400 })
  }
  if (budgetRaw < 0) {
    return NextResponse.json({ error: "Failed to generate proposal: budget can't be negative" }, { status: 400 })
  }
  if (budgetRaw > PROPOSAL_BUDGET_MAX) {
    return NextResponse.json(
      {
        error: `Failed to generate proposal: budget seems unrealistically high — enter a value under $${PROPOSAL_BUDGET_MAX.toLocaleString('en-US')}`,
      },
      { status: 400 },
    )
  }

  try {
    const proposal = await generateProposal({ leadName, company, requirements, budget: budgetRaw })
    return NextResponse.json({ proposal })
  } catch (error) {
    return NextResponse.json(
      { error: toClassifiedErrorMessage(error, 'Failed to generate proposal', classifyProposalError) },
      { status: 502 },
    )
  }
}

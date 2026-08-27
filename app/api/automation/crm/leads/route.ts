import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { ingestLead } from '@/lib/automation/crm-service'
import { toClassifiedErrorMessage } from '@/lib/security/error-handler'
import {
  FIT_NOTES_MAX_LENGTH,
  TIMELINE_MAX_DAYS,
  TIMELINE_MIN_DAYS,
  isValidLeadEmail,
} from '@/lib/validation/lead'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function classifyIngestError(error: unknown): string | null {
  if (error instanceof Error) {
    if (/Invalid scheme|Invalid connection string|MongoParseError/i.test(error.message)) {
      return 'Failed to ingest lead: database is misconfigured. Contact support.'
    }
    if (/ETIMEDOUT|ECONNREFUSED|ServerSelectionError|MongoNetworkError|topology was destroyed/i.test(error.message)) {
      return 'Failed to ingest lead: database is unreachable. Please try again shortly.'
    }
  }
  return null
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    name?: unknown
    email?: unknown
    company?: unknown
    budget?: unknown
    timelineDays?: unknown
    fitNotes?: unknown
    source?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const company = typeof body.company === 'string' ? body.company.trim() : ''
  if (!name) {
    return NextResponse.json({ error: "Failed to ingest lead: missing required field 'name'" }, { status: 400 })
  }
  if (!email) {
    return NextResponse.json({ error: "Failed to ingest lead: missing required field 'email'" }, { status: 400 })
  }
  if (!isValidLeadEmail(email)) {
    return NextResponse.json({ error: 'Failed to ingest lead: invalid email address' }, { status: 400 })
  }
  if (!company) {
    return NextResponse.json({ error: "Failed to ingest lead: missing required field 'company'" }, { status: 400 })
  }

  const budgetRaw = typeof body.budget === 'number' ? body.budget : Number(body.budget)
  if (!Number.isFinite(budgetRaw)) {
    return NextResponse.json({ error: 'Failed to ingest lead: budget must be a number' }, { status: 400 })
  }
  if (budgetRaw <= 0) {
    return NextResponse.json({ error: 'Failed to ingest lead: budget must be greater than 0' }, { status: 400 })
  }

  const timelineRaw = typeof body.timelineDays === 'number' ? body.timelineDays : Number(body.timelineDays)
  if (!Number.isFinite(timelineRaw)) {
    return NextResponse.json({ error: 'Failed to ingest lead: urgency must be a number' }, { status: 400 })
  }
  if (timelineRaw < TIMELINE_MIN_DAYS || timelineRaw > TIMELINE_MAX_DAYS) {
    return NextResponse.json(
      { error: `Failed to ingest lead: urgency must be between ${TIMELINE_MIN_DAYS} and ${TIMELINE_MAX_DAYS} days` },
      { status: 400 },
    )
  }

  const fitNotes = typeof body.fitNotes === 'string' ? body.fitNotes : ''
  if (!fitNotes.trim()) {
    return NextResponse.json({ error: "Failed to ingest lead: missing required field 'fitNotes'" }, { status: 400 })
  }
  if (fitNotes.length > FIT_NOTES_MAX_LENGTH) {
    return NextResponse.json(
      { error: `Failed to ingest lead: fit notes must be ${FIT_NOTES_MAX_LENGTH} characters or fewer` },
      { status: 400 },
    )
  }

  const source = typeof body.source === 'string' && body.source.trim() ? body.source.trim() : 'manual'

  try {
    const lead = await ingestLead({
      userId,
      name,
      email,
      company,
      budget: budgetRaw,
      timelineDays: timelineRaw,
      fitNotes,
      source,
    })
    return NextResponse.json({ lead }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: toClassifiedErrorMessage(error, 'Failed to ingest lead', classifyIngestError) },
      { status: 502 },
    )
  }
}

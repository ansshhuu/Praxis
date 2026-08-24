import { NextResponse } from 'next/server'

import { ingestLead } from '@/lib/automation/crm-service'
import { getCurrentUserId } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
  if (!name || !email || !company) {
    return NextResponse.json({ error: 'name, email, and company are required' }, { status: 400 })
  }

  const budget = typeof body.budget === 'number' ? body.budget : 0
  const timelineDays = typeof body.timelineDays === 'number' ? body.timelineDays : 30
  const fitNotes = typeof body.fitNotes === 'string' ? body.fitNotes : ''
  const source = typeof body.source === 'string' && body.source.trim() ? body.source.trim() : 'manual'

  try {
    const lead = await ingestLead({ name, email, company, budget, timelineDays, fitNotes, source })
    return NextResponse.json({ lead }, { status: 201 })
  } catch (error) {
    console.error('[automation/crm/leads] failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to ingest lead' },
      { status: 502 },
    )
  }
}

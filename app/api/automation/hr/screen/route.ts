import { NextResponse } from 'next/server'

import { generateInterviewQuestions, screenResumes } from '@/lib/automation/hr-service'
import { requireResumeAccess } from '@/lib/auth/session'
import { toSafeErrorMessage } from '@/lib/security/error-handler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 120

const MAX_CANDIDATES = 25

export async function POST(request: Request) {
  const auth = await requireResumeAccess()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let body: { jobId?: unknown; jobDescription?: unknown; candidates?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const jobId = typeof body.jobId === 'string' ? body.jobId.trim() : ''
  const jobDescription = typeof body.jobDescription === 'string' ? body.jobDescription.trim() : ''
  if (!jobId || !jobDescription) {
    return NextResponse.json({ error: 'jobId and jobDescription are required' }, { status: 400 })
  }

  if (!Array.isArray(body.candidates) || body.candidates.length === 0) {
    return NextResponse.json({ error: 'candidates must be a non-empty array' }, { status: 400 })
  }
  if (body.candidates.length > MAX_CANDIDATES) {
    return NextResponse.json(
      { error: `Please screen at most ${MAX_CANDIDATES} candidates at a time` },
      { status: 413 },
    )
  }

  const candidates = (body.candidates as unknown[])
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
    .map((entry) => ({
      candidateId: typeof entry.candidateId === 'string' ? entry.candidateId : crypto.randomUUID(),
      name: typeof entry.name === 'string' ? entry.name : 'Unknown',
      email: typeof entry.email === 'string' ? entry.email : '',
      resumeText: typeof entry.resumeText === 'string' ? entry.resumeText : '',
    }))
    .filter((candidate) => candidate.resumeText.trim().length > 0)

  if (candidates.length === 0) {
    return NextResponse.json({ error: 'No candidates had readable resume text' }, { status: 422 })
  }

  try {
    const results = await screenResumes({ userId: auth.user.id, jobId, jobDescription, candidates })

    let topCandidateQuestions: string[] = []
    const top = results.find((candidate) => candidate.rank === 1)
    if (top) {
      try {
        topCandidateQuestions = await generateInterviewQuestions({
          jobDescription,
          resumeExcerpt: top.resumeExcerpt,
        })
      } catch (error) {
        console.error('[automation/hr/screen] interview question generation failed:', error)
      }
    }

    return NextResponse.json({ candidates: results, topCandidateQuestions }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: toSafeErrorMessage(error, 'Failed to screen resumes') },
      { status: 502 },
    )
  }
}

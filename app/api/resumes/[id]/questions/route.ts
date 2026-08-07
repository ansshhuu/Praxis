import { NextResponse } from 'next/server'

import { callAI } from '@/lib/ai/ai-router'
import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { parseJsonArray } from '@/lib/resumes/scoring'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const QUESTION_COUNT = 5
const MAX_RESUME_CHARS = 3_000
const MAX_JD_CHARS = 1_500

type RouteContext = { params: Promise<{ id: string }> }

function excerpt(text: string, limit: number): string {
  const trimmed = text.trim()
  return trimmed.length > limit ? `${trimmed.slice(0, limit)}…[truncated]` : trimmed
}

/**
 * Salvage a list from a model that answered in prose instead of JSON — strips
 * "1." / "-" / quotes from each line and keeps the substantial ones.
 */
function parseLooseList(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').replace(/^["']|["',]$/g, '').trim())
    .filter((line) => line.length > 15)
}

/**
 * POST /api/resumes/[id]/questions — generates interview questions on demand.
 *
 * One `callAI` per request, and only when the user asks: the screening pass
 * deliberately does not pre-generate these for every candidate. Results are
 * cached on the row, so re-opening a candidate costs nothing. Body accepts
 * `{ jobDescription?, regenerate? }`; the JD stored at screening time is used
 * when none is supplied.
 */
export async function POST(request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    jobDescription?: unknown
    regenerate?: unknown
  }

  const { id } = await params
  const resume = await prisma.resume.findFirst({
    where: { id, document: { userId } },
    include: { document: { select: { fileName: true, extractedText: true } } },
  })

  if (!resume) {
    return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
  }

  // Cached answer — no AI call at all.
  if (resume.interviewQuestions.length > 0 && body.regenerate !== true) {
    return NextResponse.json({ questions: resume.interviewQuestions, cached: true })
  }

  const resumeText = resume.document.extractedText?.trim()
  if (!resumeText) {
    return NextResponse.json(
      { error: 'This candidate has no extracted resume text to work from.' },
      { status: 409 },
    )
  }

  const jobDescription =
    typeof body.jobDescription === 'string' && body.jobDescription.trim()
      ? body.jobDescription.trim()
      : resume.jobDescription

  const prompt = [
    `Write ${QUESTION_COUNT} interview questions for this candidate, tailored to the gaps and strengths in their resume relative to the job description.`,
    `Reply with ONE JSON array of ${QUESTION_COUNT} strings only — no prose, no numbering, no markdown fences.`,
    '',
    `JOB DESCRIPTION:`,
    excerpt(jobDescription, MAX_JD_CHARS),
    '',
    `CANDIDATE RESUME (${resume.candidateName}):`,
    excerpt(resumeText, MAX_RESUME_CHARS),
  ].join('\n')

  let raw: string
  try {
    raw = await callAI(prompt)
  } catch (error) {
    console.error(`[resumes/${id}/questions] AI call failed:`, error)
    return NextResponse.json({ error: (error as Error).message }, { status: 502 })
  }

  const parsed = parseJsonArray(raw)
  const questions = (
    parsed
      ? parsed.filter((item): item is string => typeof item === 'string').map((q) => q.trim())
      : parseLooseList(raw)
  )
    .filter(Boolean)
    .slice(0, QUESTION_COUNT)

  if (questions.length === 0) {
    return NextResponse.json(
      { error: 'The AI response could not be read as interview questions. Please try again.' },
      { status: 502 },
    )
  }

  await prisma.resume.update({ where: { id }, data: { interviewQuestions: questions } })

  return NextResponse.json({ questions, cached: false })
}

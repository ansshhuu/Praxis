import { NextResponse } from 'next/server'

import { ACTIVITY_ACTIONS } from '@/lib/activity/actions'
import { logActivity } from '@/lib/activity/log'
import { requireResumeAccess } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { extractText } from '@/lib/documents/extract'
import { ScoringError, scoreResumes, type ResumeInput } from '@/lib/resumes/scoring'
import { toCandidateSummary } from '@/lib/resumes/serialize'
import { toSafeErrorMessage } from '@/lib/security/error-handler'
import { createReadUrl, uploadDocument } from '@/lib/storage/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300

const MAX_FILE_BYTES = 25 * 1024 * 1024
const MAX_RESUMES = 20
const MIN_JD_CHARS = 20

const ALLOWED_EXTENSIONS = new Set(['pdf', 'docx', 'doc', 'txt'])

const MIN_TEXT_CHARS = 40

function extensionOf(name: string): string {
  const parts = name.toLowerCase().split('.')
  return parts.length > 1 ? parts[parts.length - 1] : ''
}

type Skipped = { fileName: string; reason: string }

export async function POST(request: Request) {
  const auth = await requireResumeAccess()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const userId = auth.user.id

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json(
      { error: 'Expected multipart/form-data with "resumes" files and a "jobDescription" field' },
      { status: 400 },
    )
  }

  const jobDescription = String(form.get('jobDescription') ?? '').trim()
  if (jobDescription.length < MIN_JD_CHARS) {
    return NextResponse.json(
      { error: 'Please provide a job description of at least 20 characters' },
      { status: 400 },
    )
  }

  const files = form
    .getAll('resumes')
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)

  if (files.length === 0) {
    return NextResponse.json({ error: 'No resume files provided' }, { status: 400 })
  }
  if (files.length > MAX_RESUMES) {
    return NextResponse.json(
      { error: `Please screen at most ${MAX_RESUMES} resumes at a time` },
      { status: 413 },
    )
  }

  const inputs: ResumeInput[] = []
  const skipped: Skipped[] = []
  const documentIds: string[] = []

  for (const file of files) {
    const extension = extensionOf(file.name)

    if (file.size > MAX_FILE_BYTES) {
      skipped.push({ fileName: file.name, reason: 'Larger than the 25 MB limit' })
      continue
    }
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      skipped.push({ fileName: file.name, reason: `Unsupported file type ".${extension || 'unknown'}"` })
      continue
    }

    let documentId: string | null = null
    try {
      const stored = await uploadDocument(userId, file, 'resumes')
      const document = await prisma.document.create({
        data: {
          userId,
          fileName: file.name,
          fileUrl: stored.publicUrl,
          storagePath: stored.path,
          fileType: extension,
          fileSize: file.size,
          status: 'PROCESSING',
          tags: ['resume'],
        },
      })
      documentId = document.id
      documentIds.push(document.id)

      const text = await extractText(await createReadUrl(stored.path), extension)

      if (text.trim().length < MIN_TEXT_CHARS) {
        await prisma.document.update({
          where: { id: document.id },
          data: {
            status: 'FAILED',
            statusMessage: 'No readable text found in this resume.',
          },
        })
        skipped.push({ fileName: file.name, reason: 'No readable text could be extracted' })
        continue
      }

      await prisma.document.update({
        where: { id: document.id },
        data: { extractedText: text, status: 'PROCESSED', statusMessage: null },
      })

      inputs.push({ key: document.id, fileName: file.name, text })
    } catch (error) {
      const safeMessage = toSafeErrorMessage(error, `Failed to prepare "${file.name}"`)
      if (documentId) {
        await prisma.document
          .update({
            where: { id: documentId },
            data: { status: 'FAILED', statusMessage: safeMessage },
          })
          .catch(() => {})
      }
      skipped.push({ fileName: file.name, reason: safeMessage })
    }
  }

  if (inputs.length === 0) {
    return NextResponse.json(
      {
        error: 'None of the uploaded files could be read. Screening was not run.',
        skipped,
      },
      { status: 422 },
    )
  }

  let scored
  try {
    scored = await scoreResumes(jobDescription, inputs)
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof ScoringError
            ? error.message
            : toSafeErrorMessage(error, 'Screening failed'),
        documentIds,
        skipped,
      },
      { status: 502 },
    )
  }

  const screeningId = crypto.randomUUID()

  await prisma.resume.createMany({
    data: scored.map((candidate, index) => ({
      documentId: candidate.key,
      screeningId,
      jobDescription,
      candidateName: candidate.candidateName,
      email: candidate.email,
      skills: candidate.skills,
      skillsMissing: candidate.skillsMissing,
      jdMatchScore: candidate.jdMatchScore,
      ranking: index + 1,
      yearsExperience: candidate.yearsExperience,
      currentRole: candidate.currentRole,
      education: candidate.education,
      summary: candidate.summary,
      interviewQuestions: [],
    })),
  })

  const candidates = await prisma.resume.findMany({
    where: { screeningId },
    orderBy: { ranking: 'asc' },
    include: { document: { select: { fileName: true, fileUrl: true, extractedText: true } } },
  })

  await logActivity(userId, ACTIVITY_ACTIONS.resumeScreeningCompleted, {
    screeningId,
    candidates: candidates.length,
    skipped: skipped.length,
    topCandidate: candidates[0]?.candidateName ?? null,
  })

  return NextResponse.json(
    {
      screeningId,
      candidates: candidates.map(toCandidateSummary),
      skipped,
    },
    { status: 201 },
  )
}

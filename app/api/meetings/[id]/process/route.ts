import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { analyzeAndSave } from '@/lib/meetings/process'
import { toDetail } from '@/lib/meetings/serialize'
import { transcribeAudio } from '@/lib/meetings/transcribe'
import { MEETINGS_BUCKET, createReadUrl } from '@/lib/storage/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
/** Whisper on a full-length meeting runs well past the default budget. */
export const maxDuration = 300

type RouteContext = { params: Promise<{ id: string }> }

/**
 * POST /api/meetings/[id]/process — transcribe the audio, then analyse it.
 *
 * Exactly one `callAI` invocation per request (inside `analyzeAndSave`);
 * transcription goes to Whisper, which is not routed through ai-router.
 */
export async function POST(_request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.meeting.findFirst({
    where: { id, userId },
    select: { id: true, fileUrl: true, storagePath: true },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
  }

  if (!existing.storagePath && !existing.fileUrl) {
    return NextResponse.json(
      { error: 'This meeting has no audio — paste a transcript instead' },
      { status: 400 },
    )
  }

  // Claim the row so a double-fired request (React strict mode, an impatient
  // retry) cannot run transcription — and a second AI call — twice.
  const claimed = await prisma.meeting.updateMany({
    where: { id, userId, status: { not: 'TRANSCRIBING' } },
    data: { status: 'TRANSCRIBING', statusMessage: null },
  })

  if (claimed.count === 0) {
    return NextResponse.json(
      { error: 'This meeting is already being processed' },
      { status: 409 },
    )
  }

  // ── Transcribe ─────────────────────────────────────────────────────────────
  let transcript: string
  try {
    const readUrl = existing.storagePath
      ? await createReadUrl(existing.storagePath, MEETINGS_BUCKET)
      : existing.fileUrl
    transcript = await transcribeAudio(readUrl)
  } catch (error) {
    console.error(`[meetings/process] transcription failed for ${id}:`, error)
    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        status: 'FAILED',
        statusMessage: (error as Error).message.slice(0, 500),
      },
    })
    // 200 with a FAILED status: the client renders the failure state (and the
    // "paste a transcript instead" affordance) rather than treating this as a
    // broken request.
    return NextResponse.json({ meeting: toDetail(meeting) })
  }

  // Persist the transcript before analysing, so a later AI failure can never
  // lose the expensive part of the pipeline.
  await prisma.meeting.update({ where: { id }, data: { transcript } })

  // ── Analyse (one AI call) ──────────────────────────────────────────────────
  const meeting = await analyzeAndSave(id, transcript)
  return NextResponse.json({ meeting: toDetail(meeting) })
}

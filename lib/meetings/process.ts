import { Prisma, type Meeting } from '@prisma/client'

import { prisma } from '@/lib/db/prisma'
import { AnalysisError, analyzeTranscript } from '@/lib/meetings/analyze'

/**
 * Shared tail of both processing paths — the audio pipeline
 * (`/api/meetings/[id]/process`) and the pasted-transcript pipeline
 * (`/api/meetings/[id]/manual-transcript`) converge here so they cannot drift
 * apart on how results are persisted.
 *
 * Runs exactly one AI call (inside `analyzeTranscript`) and always leaves the
 * row in a terminal state.
 */
export async function analyzeAndSave(
  meetingId: string,
  transcript: string,
): Promise<Meeting> {
  try {
    const analysis = await analyzeTranscript(transcript)

    // Transcription/paste already succeeded, so a truncated analysis is still
    // a PROCESSED meeting — the note explains what the model actually saw.
    const note = analysis.truncated
      ? 'This meeting is long, so the summary and action items were generated from the first part of the transcript.'
      : null

    return await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        transcript,
        summary: analysis.summary,
        actionItems: analysis.actionItems as unknown as Prisma.InputJsonValue,
        attendees: analysis.attendees,
        status: 'PROCESSED',
        statusMessage: note,
      },
    })
  } catch (error) {
    const message =
      error instanceof AnalysisError
        ? error.message
        : `Analysis failed: ${(error as Error).message}`

    console.error(`[meetings/process] analysis failed for ${meetingId}:`, error)

    // The transcript is the expensive part and is still worth keeping, so the
    // row stays PROCESSED with an explanatory note rather than going FAILED —
    // the user can read the transcript and retry the analysis.
    return prisma.meeting.update({
      where: { id: meetingId },
      data: {
        transcript,
        summary: null,
        actionItems: Prisma.DbNull,
        attendees: [],
        status: 'PROCESSED',
        statusMessage: message.slice(0, 500),
      },
    })
  }
}

import { Prisma, type Meeting } from '@prisma/client'

import { prisma } from '@/lib/db/prisma'
import { AnalysisError, analyzeTranscript } from '@/lib/meetings/analyze'

export async function analyzeAndSave(
  meetingId: string,
  transcript: string,
): Promise<Meeting> {
  try {
    const analysis = await analyzeTranscript(transcript)

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

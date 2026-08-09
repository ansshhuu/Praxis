import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { toSummary } from '@/lib/meetings/serialize'
import { MAX_AUDIO_BYTES } from '@/lib/meetings/transcribe'
import { MEETINGS_BUCKET, uploadDocument } from '@/lib/storage/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ALLOWED_EXTENSIONS = new Set(['mp3', 'wav', 'm4a'])

function extensionOf(name: string): string {
  const parts = name.toLowerCase().split('.')
  return parts.length > 1 ? parts[parts.length - 1] : ''
}

/**
 * POST /api/meetings/upload — stores the audio and creates its PENDING row.
 *
 * Deliberately does NOT transcribe: Whisper on a full meeting runs for minutes,
 * so the client gets the record back immediately and then calls
 * POST /api/meetings/[id]/process (same split as the Documents module).
 */
export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json(
      { error: 'Expected multipart/form-data with a "file" field' },
      { status: 400 },
    )
  }

  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
  }

  // Matched to the transcription provider's own ceiling, so an upload that
  // would inevitably fail at transcription time is refused up front.
  if (file.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { error: `Audio is larger than the ${MAX_AUDIO_BYTES / 1024 / 1024} MB limit` },
      { status: 413 },
    )
  }

  const extension = extensionOf(file.name)
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return NextResponse.json(
      {
        error: `Unsupported audio type ".${extension || 'unknown'}" — upload MP3, WAV or M4A`,
      },
      { status: 415 },
    )
  }

  // Optional: the browser can measure playback length, which the server
  // cannot without decoding the container.
  const rawDuration = form.get('duration_seconds')
  const parsedDuration = typeof rawDuration === 'string' ? Number(rawDuration) : NaN
  const durationSeconds =
    Number.isFinite(parsedDuration) && parsedDuration > 0
      ? Math.round(parsedDuration)
      : null

  let stored
  try {
    stored = await uploadDocument(userId, file, undefined, MEETINGS_BUCKET)
  } catch (error) {
    console.error('[meetings/upload] storage failed:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 502 })
  }

  try {
    const meeting = await prisma.meeting.create({
      data: {
        userId,
        fileName: file.name,
        fileUrl: stored.publicUrl,
        storagePath: stored.path,
        durationSeconds,
        status: 'PENDING',
        attendees: [],
      },
    })

    return NextResponse.json({ meeting: toSummary(meeting) }, { status: 201 })
  } catch (error) {
    console.error('[meetings/upload] db insert failed:', error)
    // Don't leave the object orphaned in the bucket when the row never landed.
    const { removeDocument } = await import('@/lib/storage/supabase')
    await removeDocument(stored.path, MEETINGS_BUCKET).catch(() => {})
    return NextResponse.json({ error: 'Could not save the meeting record' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'

import { analyzeImage } from '@/lib/ai/vision-service'
import { enforceRateLimit } from '@/lib/security/rate-limit'
import { getCurrentUserId } from '@/lib/auth/session'
import { toSafeErrorMessage } from '@/lib/security/error-handler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_FILE_BYTES = 20 * 1024 * 1024
const VISION_RATE_LIMIT = 20
const VISION_RATE_WINDOW_SECONDS = 60

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/bmp',
  'image/tiff',
])

export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const denied = await enforceRateLimit('vision-analyze', userId, VISION_RATE_LIMIT, VISION_RATE_WINDOW_SECONDS)
  if (denied) {
    return NextResponse.json(denied.body, { status: denied.status })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json(
      { error: 'Expected multipart/form-data with an "image" field' },
      { status: 400 },
    )
  }

  const file = form.get('image')
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: `Image must be ${MAX_FILE_BYTES / (1024 * 1024)} MB or smaller` },
      { status: 413 },
    )
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported image type "${file.type || 'unknown'}"` },
      { status: 415 },
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    const result = await analyzeImage({ buffer, mimeType: file.type || 'image/png' })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: toSafeErrorMessage(error, 'Failed to analyze image') },
      { status: 502 },
    )
  }
}

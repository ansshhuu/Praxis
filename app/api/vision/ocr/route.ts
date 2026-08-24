import { NextResponse } from 'next/server'

import { ocrImage } from '@/lib/ai/vision-service'
import { getCurrentUserId } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 120

const MAX_FILE_BYTES = 20 * 1024 * 1024

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

  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    const result = await ocrImage({ buffer, mimeType: file.type || 'image/png' })
    return NextResponse.json(result)
  } catch (error) {
    console.error('[vision/ocr] failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to extract text from image' },
      { status: 502 },
    )
  }
}

import { NextResponse } from 'next/server'

import { translateMessage } from '@/lib/automation/support-service'
import { getCurrentUserId } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_TEXT_LENGTH = 5000

export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { text?: unknown; targetLanguage?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const text = typeof body.text === 'string' ? body.text.trim() : ''
  const targetLanguage = typeof body.targetLanguage === 'string' ? body.targetLanguage.trim() : ''
  if (!text || !targetLanguage) {
    return NextResponse.json({ error: 'text and targetLanguage are required' }, { status: 400 })
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `text must be ${MAX_TEXT_LENGTH} characters or fewer` },
      { status: 413 },
    )
  }

  try {
    const translated = await translateMessage(text, targetLanguage)
    return NextResponse.json({ translated })
  } catch (error) {
    console.error('[automation/support/translate] failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to translate message' },
      { status: 502 },
    )
  }
}

import { NextResponse } from 'next/server'

import { enforceRateLimit } from '@/lib/security/rate-limit'
import { getCurrentUserId } from '@/lib/auth/session'
import { ingestDocument } from '@/lib/ai/rag-engine'
import { toSafeErrorMessage } from '@/lib/security/error-handler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_TEXT_LENGTH = 200_000
const DEFAULT_COLLECTION = 'agent_knowledge_base'
const RAG_INGEST_RATE_LIMIT = 20
const RAG_INGEST_RATE_WINDOW_SECONDS = 60

export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const denied = await enforceRateLimit('rag-ingest', userId, RAG_INGEST_RATE_LIMIT, RAG_INGEST_RATE_WINDOW_SECONDS)
  if (denied) {
    return NextResponse.json(denied.body, { status: denied.status })
  }

  let body: { text?: unknown; documentId?: unknown; collection?: unknown; metadata?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `text must be ${MAX_TEXT_LENGTH} characters or fewer` },
      { status: 413 },
    )
  }

  const documentId =
    typeof body.documentId === 'string' && body.documentId.trim()
      ? body.documentId.trim()
      : crypto.randomUUID()

  const collection =
    typeof body.collection === 'string' && body.collection.trim()
      ? body.collection.trim()
      : DEFAULT_COLLECTION

  const metadata =
    body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
      ? (body.metadata as Record<string, string | number | boolean>)
      : undefined

  try {
    const result = await ingestDocument({
      collectionName: collection,
      documentId,
      text,
      metadata: { ...metadata, userId },
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: toSafeErrorMessage(error, 'Failed to ingest document') },
      { status: 502 },
    )
  }
}

import { NextResponse } from 'next/server'

import { enforceRateLimit } from '@/lib/security/rate-limit'
import { getCurrentUserId } from '@/lib/auth/session'
import { ingestDocument } from '@/lib/ai/rag-engine'
import { toClassifiedErrorMessage } from '@/lib/security/error-handler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_TEXT_LENGTH = 200_000
const MIN_TEXT_LENGTH = 50
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

  let body: { text?: unknown; documentId?: unknown; collection?: unknown; metadata?: unknown; title?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text) {
    return NextResponse.json({ error: 'Paste or write content to ingest.' }, { status: 400 })
  }
  if (text.length < MIN_TEXT_LENGTH) {
    return NextResponse.json(
      { error: 'Document too short to ingest meaningfully.' },
      { status: 400 },
    )
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      {
        error: `Document too long — split into smaller sections (max ${MAX_TEXT_LENGTH.toLocaleString()} characters).`,
      },
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

  const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 200) : undefined

  try {
    const result = await ingestDocument({
      collectionName: collection,
      documentId,
      text,
      title,
      metadata: { ...metadata, userId },
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const message = toClassifiedErrorMessage(error, 'Failed to ingest document', (err) => {
      if (!(err instanceof Error)) return null
      if (/No embedding provider configured/i.test(err.message)) {
        return 'Failed to ingest: embedding service is not configured. Contact support.'
      }
      if (/(fetch failed|ECONNREFUSED|ENOTFOUND|network)/i.test(err.message)) {
        return 'Failed to ingest: vector database connection failed.'
      }
      if (/(quota|rate limit|429)/i.test(err.message)) {
        return 'Failed to ingest: embedding service rate limit exceeded. Try again shortly.'
      }
      if (/produced no chunks/i.test(err.message)) {
        return 'Failed to ingest: document could not be split into chunks — try different content.'
      }
      return `Failed to ingest: ${err.message}`
    })
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

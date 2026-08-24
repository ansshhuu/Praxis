import { NextResponse } from 'next/server'

import { queryKnowledgeBase } from '@/lib/ai/rag-engine'
import { getCurrentUserId } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_QUERY_LENGTH = 2000
const DEFAULT_COLLECTION = 'agent_knowledge_base'
const MAX_TOP_K = 20

export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    query?: unknown
    collection?: unknown
    topK?: unknown
    similarityThreshold?: unknown
    synthesize?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const query = typeof body.query === 'string' ? body.query.trim() : ''
  if (!query) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 })
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `query must be ${MAX_QUERY_LENGTH} characters or fewer` },
      { status: 413 },
    )
  }

  const collection =
    typeof body.collection === 'string' && body.collection.trim()
      ? body.collection.trim()
      : DEFAULT_COLLECTION

  const topK =
    typeof body.topK === 'number' && body.topK > 0 ? Math.min(body.topK, MAX_TOP_K) : undefined

  const similarityThreshold =
    typeof body.similarityThreshold === 'number' ? body.similarityThreshold : undefined

  const synthesize = body.synthesize !== false

  try {
    const result = await queryKnowledgeBase({
      collectionName: collection,
      query,
      topK,
      similarityThreshold,
      synthesize,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('[rag/query] failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to query knowledge base' },
      { status: 502 },
    )
  }
}

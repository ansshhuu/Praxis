import { NextResponse } from 'next/server'

import { enforceRateLimit } from '@/lib/security/rate-limit'
import { getCurrentUserId } from '@/lib/auth/session'
import { listDocuments } from '@/lib/ai/rag-engine'
import { toClassifiedErrorMessage } from '@/lib/security/error-handler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const DEFAULT_COLLECTION = 'agent_knowledge_base'
const RAG_LIST_RATE_LIMIT = 60
const RAG_LIST_RATE_WINDOW_SECONDS = 60

export async function GET(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const denied = await enforceRateLimit('rag-documents', userId, RAG_LIST_RATE_LIMIT, RAG_LIST_RATE_WINDOW_SECONDS)
  if (denied) {
    return NextResponse.json(denied.body, { status: denied.status })
  }

  const { searchParams } = new URL(request.url)
  const collection = searchParams.get('collection')?.trim() || DEFAULT_COLLECTION

  try {
    const documents = await listDocuments(collection, userId)
    return NextResponse.json({ documents })
  } catch (error) {
    const message = toClassifiedErrorMessage(error, 'Failed to load knowledge base documents', (err) => {
      if (!(err instanceof Error)) return null
      if (/(fetch failed|ECONNREFUSED|ENOTFOUND|network)/i.test(err.message)) {
        return 'Failed to load documents: vector database connection failed.'
      }
      return null
    })
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

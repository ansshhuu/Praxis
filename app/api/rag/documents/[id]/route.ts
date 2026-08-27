import { NextResponse } from 'next/server'

import { enforceRateLimit } from '@/lib/security/rate-limit'
import { getCurrentUserId } from '@/lib/auth/session'
import { deleteDocument } from '@/lib/ai/rag-engine'
import { toClassifiedErrorMessage } from '@/lib/security/error-handler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const DEFAULT_COLLECTION = 'agent_knowledge_base'
const RAG_DELETE_RATE_LIMIT = 30
const RAG_DELETE_RATE_WINDOW_SECONDS = 60

type RouteContext = { params: Promise<{ id: string }> }

export async function DELETE(request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const denied = await enforceRateLimit('rag-documents-delete', userId, RAG_DELETE_RATE_LIMIT, RAG_DELETE_RATE_WINDOW_SECONDS)
  if (denied) {
    return NextResponse.json(denied.body, { status: denied.status })
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const collection = searchParams.get('collection')?.trim() || DEFAULT_COLLECTION

  try {
    await deleteDocument(collection, userId, id)
    return NextResponse.json({ documentId: id, deleted: true })
  } catch (error) {
    const message = toClassifiedErrorMessage(error, 'Failed to delete document', (err) => {
      if (!(err instanceof Error)) return null
      if (/(fetch failed|ECONNREFUSED|ENOTFOUND|network)/i.test(err.message)) {
        return 'Failed to delete document: vector database connection failed.'
      }
      return null
    })
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

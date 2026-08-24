import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { getWorkflowRunTracesCollection } from '@/lib/models/mongodb/workflow-runs'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const workflowId = searchParams.get('workflowId')
  const page = Math.max(Number(searchParams.get('page') ?? '1') || 1, 1)
  const pageSize = Math.min(Math.max(Number(searchParams.get('pageSize') ?? '20') || 20, 1), 100)

  const collection = await getWorkflowRunTracesCollection()
  const filter = workflowId ? { workflowId } : {}

  const [traces, total] = await Promise.all([
    collection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray(),
    collection.countDocuments(filter),
  ])

  return NextResponse.json({ traces, page, pageSize, total })
}

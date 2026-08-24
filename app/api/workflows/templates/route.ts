import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { searchWorkflowTemplates } from '@/lib/workflow/templates'
import type { WorkflowTemplateCategory } from '@/lib/workflow/templates/builder'

export const dynamic = 'force-dynamic'

const VALID_CATEGORIES: WorkflowTemplateCategory[] = ['HR', 'Sales', 'IT', 'DevOps', 'Marketing', 'Support']

export async function GET(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') ?? undefined
  const categoryParam = searchParams.get('category')
  const category = VALID_CATEGORIES.find((value) => value === categoryParam)

  const templates = searchWorkflowTemplates({ query, category })

  return NextResponse.json({
    templates: templates.map((template) => ({
      id: template.id,
      name: template.name,
      category: template.category,
      description: template.description,
      tags: template.tags,
      nodeCount: template.definition.nodes.length,
    })),
    total: templates.length,
  })
}

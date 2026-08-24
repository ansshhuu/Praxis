import { DEVOPS_WORKFLOW_TEMPLATES } from '@/lib/workflow/templates/devops'
import { HR_WORKFLOW_TEMPLATES } from '@/lib/workflow/templates/hr'
import { IT_WORKFLOW_TEMPLATES } from '@/lib/workflow/templates/it'
import { MARKETING_WORKFLOW_TEMPLATES } from '@/lib/workflow/templates/marketing'
import { SALES_WORKFLOW_TEMPLATES } from '@/lib/workflow/templates/sales'
import { SUPPORT_WORKFLOW_TEMPLATES } from '@/lib/workflow/templates/support'
import type { WorkflowTemplate, WorkflowTemplateCategory } from '@/lib/workflow/templates/builder'

export type { WorkflowTemplate, WorkflowTemplateCategory } from '@/lib/workflow/templates/builder'

export const ALL_WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  ...HR_WORKFLOW_TEMPLATES,
  ...SALES_WORKFLOW_TEMPLATES,
  ...IT_WORKFLOW_TEMPLATES,
  ...DEVOPS_WORKFLOW_TEMPLATES,
  ...MARKETING_WORKFLOW_TEMPLATES,
  ...SUPPORT_WORKFLOW_TEMPLATES,
]

export function getWorkflowTemplateById(id: string): WorkflowTemplate | undefined {
  return ALL_WORKFLOW_TEMPLATES.find((template) => template.id === id)
}

export interface SearchTemplatesOptions {
  query?: string
  category?: WorkflowTemplateCategory
}

export function searchWorkflowTemplates(options: SearchTemplatesOptions = {}): WorkflowTemplate[] {
  const query = options.query?.trim().toLowerCase() ?? ''

  return ALL_WORKFLOW_TEMPLATES.filter((template) => {
    if (options.category && template.category !== options.category) return false
    if (!query) return true

    const haystack = [template.name, template.description, ...template.tags].join(' ').toLowerCase()
    return haystack.includes(query)
  })
}

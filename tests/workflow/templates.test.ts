import { describe, expect, it } from 'vitest'

import { ALL_WORKFLOW_TEMPLATES, searchWorkflowTemplates } from '@/lib/workflow/templates'

describe('ALL_WORKFLOW_TEMPLATES', () => {
  it('contains at least 100 templates', () => {
    expect(ALL_WORKFLOW_TEMPLATES.length).toBeGreaterThanOrEqual(100)
  })

  it('has unique ids', () => {
    const ids = ALL_WORKFLOW_TEMPLATES.map((template) => template.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('spans all six expected categories', () => {
    const categories = new Set(ALL_WORKFLOW_TEMPLATES.map((template) => template.category))
    expect(categories).toEqual(new Set(['HR', 'Sales', 'IT', 'DevOps', 'Marketing', 'Support']))
  })

  it('gives every template a structurally valid graph', () => {
    for (const template of ALL_WORKFLOW_TEMPLATES) {
      const nodeIds = new Set(template.definition.nodes.map((node) => node.id))
      expect(nodeIds.has(template.definition.startNodeId)).toBe(true)

      for (const node of template.definition.nodes) {
        if (node.next) expect(nodeIds.has(node.next)).toBe(true)
        if (node.trueNext) expect(nodeIds.has(node.trueNext)).toBe(true)
        if (node.falseNext) expect(nodeIds.has(node.falseNext)).toBe(true)
        for (const id of node.body ?? []) expect(nodeIds.has(id)).toBe(true)
        for (const branch of node.branches ?? []) {
          for (const id of branch) expect(nodeIds.has(id)).toBe(true)
        }
      }
    }
  })
})

describe('searchWorkflowTemplates', () => {
  it('filters by category', () => {
    const results = searchWorkflowTemplates({ category: 'HR' })
    expect(results.length).toBeGreaterThan(0)
    expect(results.every((template) => template.category === 'HR')).toBe(true)
  })

  it('filters by a case-insensitive text query across name, description and tags', () => {
    const results = searchWorkflowTemplates({ query: 'onboarding' })
    expect(results.length).toBeGreaterThan(0)
    for (const template of results) {
      const haystack = [template.name, template.description, ...template.tags].join(' ').toLowerCase()
      expect(haystack).toContain('onboarding')
    }
  })

  it('returns everything when no filters are given', () => {
    expect(searchWorkflowTemplates()).toHaveLength(ALL_WORKFLOW_TEMPLATES.length)
  })

  it('combines category and query filters', () => {
    const results = searchWorkflowTemplates({ category: 'Support', query: 'escalation' })
    expect(results.every((template) => template.category === 'Support')).toBe(true)
    expect(results.length).toBeGreaterThan(0)
  })
})

import type { ScaledNode, ScaledWorkflowDefinition } from '@/lib/workflow/engine'

export type WorkflowTemplateCategory = 'HR' | 'Sales' | 'IT' | 'DevOps' | 'Marketing' | 'Support'

export interface WorkflowTemplate {
  id: string
  name: string
  category: WorkflowTemplateCategory
  description: string
  tags: string[]
  definition: ScaledWorkflowDefinition
}

export interface ScenarioMeta {
  slug: string
  name: string
  description: string
  tags: string[]
}

function trigger(next: string, label: string): ScaledNode {
  return { id: 'trigger', type: 'trigger', label, next }
}

function llm(id: string, next: string, label: string, prompt: string): ScaledNode {
  return { id, type: 'llm', label, config: { prompt }, next, retryPolicy: { maxAttempts: 2, backoffMs: 500 } }
}

function action(id: string, next: string | undefined, label: string): ScaledNode {
  return { id, type: 'action', label, next }
}

function endNode(): ScaledNode {
  return { id: 'end', type: 'end', label: 'Complete' }
}

function buildLinear(scenario: ScenarioMeta): ScaledNode[] {
  return [
    trigger('analyze', `${scenario.name} triggered`),
    llm('analyze', 'record', `Analyze ${scenario.name.toLowerCase()}`, scenario.description),
    action('record', 'end', `Record ${scenario.name.toLowerCase()} outcome`),
    endNode(),
  ]
}

function buildConditional(scenario: ScenarioMeta): ScaledNode[] {
  return [
    trigger('analyze', `${scenario.name} triggered`),
    llm('analyze', 'route', `Evaluate ${scenario.name.toLowerCase()}`, scenario.description),
    {
      id: 'route',
      type: 'condition',
      label: `Check ${scenario.name.toLowerCase()} outcome`,
      condition: { field: 'input.approved', operator: 'equals', value: 'true' },
      trueNext: 'approve',
      falseNext: 'notify',
    },
    action('approve', 'end', `Approve ${scenario.name.toLowerCase()}`),
    action('notify', 'end', `Notify reviewer for ${scenario.name.toLowerCase()}`),
    endNode(),
  ]
}

function buildWebhookDelay(scenario: ScenarioMeta): ScaledNode[] {
  return [
    trigger('fetch', `${scenario.name} triggered`),
    {
      id: 'fetch',
      type: 'webhook',
      label: `Fetch data for ${scenario.name.toLowerCase()}`,
      config: { url: `https://hooks.example.com/${scenario.slug}`, method: 'POST' },
      next: 'analyze',
      retryPolicy: { maxAttempts: 3, backoffMs: 1000 },
    },
    llm('analyze', 'wait', `Summarize ${scenario.name.toLowerCase()}`, scenario.description),
    { id: 'wait', type: 'delay', label: 'Wait before finalizing', config: { durationMs: 1000 }, next: 'record' },
    action('record', 'end', `Finalize ${scenario.name.toLowerCase()}`),
    endNode(),
  ]
}

function buildParallel(scenario: ScenarioMeta): ScaledNode[] {
  return [
    trigger('analyze', `${scenario.name} triggered`),
    llm('analyze', 'fanout', `Plan ${scenario.name.toLowerCase()}`, scenario.description),
    {
      id: 'fanout',
      type: 'parallel',
      label: `Run ${scenario.name.toLowerCase()} in parallel`,
      branches: [['branch-a'], ['branch-b']],
      next: 'join',
    },
    action('branch-a', undefined, `${scenario.name} branch A`),
    action('branch-b', undefined, `${scenario.name} branch B`),
    action('join', 'end', `Join ${scenario.name.toLowerCase()} results`),
    endNode(),
  ]
}

function buildLoop(scenario: ScenarioMeta): ScaledNode[] {
  return [
    trigger('analyze', `${scenario.name} triggered`),
    llm('analyze', 'iterate', `Prepare ${scenario.name.toLowerCase()} items`, scenario.description),
    {
      id: 'iterate',
      type: 'loop',
      label: `Process ${scenario.name.toLowerCase()} items`,
      body: ['iterate-item'],
      maxIterations: 3,
      next: 'record',
    },
    action('iterate-item', undefined, `Handle one ${scenario.name.toLowerCase()} item`),
    action('record', 'end', `Record ${scenario.name.toLowerCase()} summary`),
    endNode(),
  ]
}

const PATTERNS = [buildLinear, buildConditional, buildWebhookDelay, buildParallel, buildLoop]

export function buildWorkflowTemplate(
  category: WorkflowTemplateCategory,
  scenario: ScenarioMeta,
  index: number,
): WorkflowTemplate {
  const pattern = PATTERNS[index % PATTERNS.length]
  const nodes = pattern(scenario)
  const id = `${category.toLowerCase()}-${scenario.slug}`

  return {
    id,
    name: scenario.name,
    category,
    description: scenario.description,
    tags: [...scenario.tags, category.toLowerCase()],
    definition: { id, name: scenario.name, nodes, startNodeId: 'trigger' },
  }
}

export function buildCategoryTemplates(
  category: WorkflowTemplateCategory,
  scenarios: ScenarioMeta[],
): WorkflowTemplate[] {
  return scenarios.map((scenario, index) => buildWorkflowTemplate(category, scenario, index))
}

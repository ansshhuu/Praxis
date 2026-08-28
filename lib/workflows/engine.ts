import { ACTIVITY_ACTIONS } from '@/lib/activity/actions'
import { logActivity } from '@/lib/activity/log'
import { callAI } from '@/lib/ai/ai-router'
import { prisma } from '@/lib/db/prisma'
import { isValidEmail, sendEmail } from '@/lib/email/send'

export type FlowNode = {
  id: string
  type?: string
  position?: { x: number; y: number }
  data?: {
    typeKey?: string
    label?: string
    config?: Record<string, unknown>
    [key: string]: unknown
  }
  [key: string]: unknown
}

export type FlowEdge = {
  id: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
  label?: string
  [key: string]: unknown
}

export type NodeKind =
  | 'TRIGGER'
  | 'AI_CLASSIFY'
  | 'EXTRACT_DATA'
  | 'SAVE_DB'
  | 'GENERATE_REPORT'
  | 'NOTIFY'
  | 'CONDITION'
  | 'LOOP'
  | 'DELAY'
  | 'API_CALL'
  | 'EMAIL_ACTION'
  | 'UNKNOWN'

const KIND_BY_TYPE_KEY: Record<string, NodeKind> = {
  'email-trigger': 'TRIGGER',
  'schedule-trigger': 'TRIGGER',
  'webhook-trigger': 'TRIGGER',
  'ai-classify': 'AI_CLASSIFY',
  'extract-data': 'EXTRACT_DATA',
  'save-db': 'SAVE_DB',
  'generate-report': 'GENERATE_REPORT',
  notify: 'NOTIFY',
  'api-call': 'API_CALL',
  'email-action': 'EMAIL_ACTION',
  condition: 'CONDITION',
  loop: 'LOOP',
  delay: 'DELAY',
}

export function kindOf(node: FlowNode): NodeKind {
  const key = typeof node.data?.typeKey === 'string' ? node.data.typeKey : ''
  return KIND_BY_TYPE_KEY[key] ?? 'UNKNOWN'
}

export type StepLog = {
  nodeId: string
  label: string
  kind: NodeKind
  status: 'ok' | 'skipped' | 'error'
  message: string
  output?: unknown
}

export type RunResult = {
  steps: StepLog[]
  aiCalls: number
  ai: AiResult | null
  finalOutput: Record<string, unknown>
}

type AiResult = {
  classification: string | null
  confidence: number | null
  extracted: Record<string, unknown> | null
  raw: string
  source: 'ai' | 'skipped'
}

function configOf(node: FlowNode): Record<string, unknown> {
  const config = node.data?.config
  return config && typeof config === 'object' ? (config as Record<string, unknown>) : {}
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function labelOf(node: FlowNode): string {
  return str(node.data?.label, node.id)
}

async function resolveAiResult(
  nodes: FlowNode[],
  input: Record<string, unknown>,
): Promise<AiResult | null> {
  const classifyNodes = nodes.filter((n) => kindOf(n) === 'AI_CLASSIFY')
  const extractNodes = nodes.filter((n) => kindOf(n) === 'EXTRACT_DATA')

  if (classifyNodes.length === 0 && extractNodes.length === 0) {
    return null
  }

  const sample = str(input.text, 'Customer email: invoice #4471 was charged twice, please refund.')

  const tasks: string[] = []
  if (classifyNodes.length > 0) {
    const categories = str(
      configOf(classifyNodes[0]).categories,
      'Billing, Support, Sales, Other',
    )
    tasks.push(`- "classification": one of [${categories}], plus "confidence" 0-1.`)
  }
  if (extractNodes.length > 0) {
    const schema = str(configOf(extractNodes[0]).schema, '{"name":"string","amount":"number"}')
    tasks.push(`- "extracted": object matching this schema: ${schema}`)
  }

  const prompt = [
    'Analyse the text and reply with ONE minified JSON object only, no prose, no markdown fences.',
    'Required keys:',
    ...tasks,
    `Text: """${sample.slice(0, 800)}"""`,
  ].join('\n')

  const raw = await callAI(prompt)
  const parsed = parseJsonResponse(raw)

  return {
    classification:
      typeof parsed?.classification === 'string' ? parsed.classification : null,
    confidence: typeof parsed?.confidence === 'number' ? parsed.confidence : null,
    extracted:
      parsed?.extracted && typeof parsed.extracted === 'object'
        ? (parsed.extracted as Record<string, unknown>)
        : null,
    raw,
    source: 'ai',
  }
}

function parseJsonResponse(raw: string): Record<string, unknown> | null {
  const cleaned = raw.replace(/```(?:json)?/gi, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    const value = JSON.parse(cleaned.slice(start, end + 1))
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
  } catch {
    return null
  }
}

function resolveTemplate(raw: string, context: Record<string, unknown>): unknown {
  const match = raw.match(/^\{\{\s*([\w.]+)\s*\}\}$/)
  if (!match) return raw

  let current: unknown = context
  for (const segment of match[1].split('.')) {
    if (current && typeof current === 'object' && segment in (current as object)) {
      current = (current as Record<string, unknown>)[segment]
    } else {
      return undefined
    }
  }
  return current
}

function renderTemplate(raw: string, context: Record<string, unknown>): string {
  const filled = raw.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_whole, path: string) => {
    const value = resolveTemplate(`{{${path}}}`, context)
    return value === undefined || value === null ? '' : String(value)
  })

  return filled
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+([,.!?;:])/g, '$1')
    .replace(/[ \t]+$/gm, '')
    .trim()
}

type EmailTarget = { workflowName: string; ownerEmail: string | null }

async function loadEmailTarget(workflowId: string, userId: string): Promise<EmailTarget> {
  const [workflow, owner] = await Promise.all([
    prisma.workflow.findUnique({ where: { id: workflowId }, select: { name: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
  ])
  return {
    workflowName: workflow?.name ?? 'Untitled workflow',
    ownerEmail: isValidEmail(owner?.email) ? owner!.email : null,
  }
}

function resolveRecipient(
  configured: string,
  context: Record<string, unknown>,
  ownerEmail: string | null,
): { to: string | null; usedFallback: boolean } {
  const rendered = renderTemplate(configured, context).trim()
  if (isValidEmail(rendered)) return { to: rendered, usedFallback: false }
  if (ownerEmail) return { to: ownerEmail, usedFallback: true }
  return { to: null, usedFallback: false }
}

function evaluateCondition(
  node: FlowNode,
  context: Record<string, unknown>,
): { passed: boolean; detail: string } {
  const config = configOf(node)
  const field = str(config.field)
  const operator = str(config.operator, 'equals').toLowerCase()
  const expected = str(config.value)

  const actual = field ? resolveTemplate(field, context) : undefined
  const actualText = actual === undefined || actual === null ? '' : String(actual)

  let passed: boolean
  switch (operator) {
    case 'not equals':
      passed = actualText.toLowerCase() !== expected.toLowerCase()
      break
    case 'contains':
      passed = actualText.toLowerCase().includes(expected.toLowerCase())
      break
    case 'greater than':
      passed = Number(actualText) > Number(expected)
      break
    case 'less than':
      passed = Number(actualText) < Number(expected)
      break
    default:
      passed = actualText.toLowerCase() === expected.toLowerCase()
  }

  return {
    passed,
    detail: `${field || '(no field)'} (${actualText || 'empty'}) ${operator} "${expected}" → ${passed}`,
  }
}

function findStartNodes(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
  const triggers = nodes.filter((n) => kindOf(n) === 'TRIGGER')
  if (triggers.length > 0) return triggers

  const hasIncoming = new Set(edges.map((e) => e.target))
  return nodes.filter((n) => !hasIncoming.has(n.id))
}

export async function executeWorkflow(
  workflowId: string,
  userId: string,
  nodes: FlowNode[],
  edges: FlowEdge[],
  input: Record<string, unknown> = {},
): Promise<RunResult> {
  const steps: StepLog[] = []
  const context: Record<string, unknown> = { ...input }
  const nodeById = new Map(nodes.map((n) => [n.id, n]))

  if (nodes.length === 0) {
    throw new Error('Workflow has no nodes to execute')
  }

  const aiResult = await resolveAiResult(nodes, input)
  let aiConsumed = false

  const needsEmail = nodes.some((n) => {
    const kind = kindOf(n)
    return kind === 'NOTIFY' || kind === 'EMAIL_ACTION'
  })
  const emailTarget: EmailTarget = needsEmail
    ? await loadEmailTarget(workflowId, userId)
    : { workflowName: 'Untitled workflow', ownerEmail: null }

  if (aiResult) {
    context.classification = aiResult.classification
    context.confidence = aiResult.confidence
    context.extracted = aiResult.extracted
  }

  const outgoing = new Map<string, FlowEdge[]>()
  for (const edge of edges) {
    const list = outgoing.get(edge.source) ?? []
    list.push(edge)
    outgoing.set(edge.source, list)
  }

  const queue = findStartNodes(nodes, edges)
  if (queue.length === 0) {
    throw new Error('Workflow has no trigger or entry node')
  }

  const visited = new Set<string>()
  const MAX_STEPS = 200
  let executed = 0

  while (queue.length > 0) {
    const node = queue.shift()!
    if (visited.has(node.id)) continue
    visited.add(node.id)

    executed += 1
    if (executed > MAX_STEPS) {
      throw new Error('Workflow exceeded the maximum step count (possible cycle)')
    }

    const kind = kindOf(node)
    const label = labelOf(node)
    const config = configOf(node)
    let followHandles: (string | null | undefined)[] | null = null

    switch (kind) {
      case 'TRIGGER': {
        steps.push({
          nodeId: node.id,
          label,
          kind,
          status: 'ok',
          message: `Trigger fired: ${label}`,
        })
        break
      }

      case 'AI_CLASSIFY': {
        if (!aiResult) {
          steps.push({ nodeId: node.id, label, kind, status: 'skipped', message: 'No AI result available' })
          break
        }
        steps.push({
          nodeId: node.id,
          label,
          kind,
          status: 'ok',
          message: aiConsumed
            ? 'Reused the run\'s single AI response (no additional AI call)'
            : 'Classified using the run\'s single combined AI call',
          output: {
            classification: aiResult.classification,
            confidence: aiResult.confidence,
          },
        })
        aiConsumed = true
        break
      }

      case 'EXTRACT_DATA': {
        if (!aiResult) {
          steps.push({ nodeId: node.id, label, kind, status: 'skipped', message: 'No AI result available' })
          break
        }
        steps.push({
          nodeId: node.id,
          label,
          kind,
          status: 'ok',
          message: 'Extracted fields from the run\'s single AI response (no additional AI call)',
          output: { extracted: aiResult.extracted },
        })
        aiConsumed = true
        break
      }

      case 'SAVE_DB': {
        const table = str(config.table, 'records')
        const record = {
          classification: context.classification ?? null,
          extracted: context.extracted ?? null,
        }
        steps.push({
          nodeId: node.id,
          label,
          kind,
          status: 'ok',
          message: `Saved record to "${table}" (logged, demo mode)`,
          output: { table, record },
        })
        break
      }

      case 'GENERATE_REPORT': {
        const template = str(config.template, 'Weekly Summary')
        const format = str(config.format, 'PDF').toLowerCase()
        const fileUrl = `/reports/mock-${workflowId.slice(0, 8)}-${Date.now()}.${format}`
        steps.push({
          nodeId: node.id,
          label,
          kind,
          status: 'ok',
          message: 'report generated',
          output: { template, format, file_url: fileUrl },
        })
        break
      }

      case 'NOTIFY': {
        const channel = str(config.channel, 'In-app')
        const message = renderTemplate(
          str(config.message, `Workflow "${emailTarget.workflowName}" completed step "${label}".`),
          context,
        )
        const { to, usedFallback } = resolveRecipient(
          str(config.recipientEmail),
          context,
          emailTarget.ownerEmail,
        )

        const notification = await prisma.notification.create({
          data: {
            userId,
            type: to ? 'EMAIL' : channel.startsWith('#') ? 'SLACK' : 'PUSH',
            message,
            recipient: to,
            status: 'PENDING',
          },
        })

        const subject = `Notification from workflow: ${emailTarget.workflowName}`
        const emailResult = to
          ? await sendEmail({ to, subject, body: message })
          : {
              success: false,
              error: 'No recipient email configured and the workflow owner has no valid email',
            }

        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: emailResult.success ? 'SENT' : 'FAILED',
            message: emailResult.success ? message : `${message}\n\n[email failed: ${emailResult.error}]`,
          },
        })

        await logActivity(userId, ACTIVITY_ACTIONS.notificationSent, {
          notificationId: notification.id,
          workflowId,
          name: emailTarget.workflowName,
          channel,
          to,
          status: emailResult.success ? 'SENT' : 'FAILED',
          error: emailResult.error ?? null,
        })

        steps.push({
          nodeId: node.id,
          label,
          kind,
          status: 'ok',
          message: emailResult.success
            ? `Notification created (${channel}); email sent to ${to}${usedFallback ? ' (workflow owner)' : ''}`
            : `Notification created (${channel}); email not sent - ${emailResult.error}`,
          output: {
            notificationId: notification.id,
            message,
            emailTo: to,
            emailSent: emailResult.success,
            emailError: emailResult.error ?? null,
          },
        })
        break
      }

      case 'CONDITION': {
        const { passed, detail } = evaluateCondition(node, context)
        followHandles = passed ? ['true', null, undefined] : ['false']
        steps.push({
          nodeId: node.id,
          label,
          kind,
          status: 'ok',
          message: `Condition ${passed ? 'passed' : 'failed'}: ${detail}`,
          output: { passed },
        })
        break
      }

      case 'LOOP': {
        const max = Number(str(config.maxIterations, '3')) || 3
        const iterations = Math.min(Math.max(max, 1), 50)
        steps.push({
          nodeId: node.id,
          label,
          kind,
          status: 'ok',
          message: `Loop body logged for ${iterations} iteration(s); AI calls not repeated`,
          output: {
            iterations,
            collection: str(config.collection, '{{items}}'),
          },
        })
        break
      }

      case 'DELAY': {
        steps.push({
          nodeId: node.id,
          label,
          kind,
          status: 'skipped',
          message: 'delay skipped in demo mode',
          output: {
            duration: str(config.duration, '5'),
            unit: str(config.unit, 'Seconds'),
          },
        })
        break
      }

      case 'API_CALL': {
        steps.push({
          nodeId: node.id,
          label,
          kind,
          status: 'ok',
          message: 'Simulated external API call (no real request sent)',
          output: {
            method: str(config.method, 'POST'),
            url: str(config.url, 'https://api.example.com/v1/records'),
            simulatedStatus: 200,
          },
        })
        break
      }

      case 'EMAIL_ACTION': {
        const { to, usedFallback } = resolveRecipient(
          str(config.to),
          context,
          emailTarget.ownerEmail,
        )
        const subject = renderTemplate(
          str(config.subject, `Update from workflow: ${emailTarget.workflowName}`),
          context,
        )
        const body = renderTemplate(
          str(config.body, `Your workflow "${emailTarget.workflowName}" reached step "${label}".`),
          context,
        )

        const notification = await prisma.notification.create({
          data: {
            userId,
            type: 'EMAIL',
            message: `${subject} - ${body}`,
            recipient: to,
            status: 'PENDING',
          },
        })

        const emailResult = to
          ? await sendEmail({ to, subject, body })
          : {
              success: false,
              error: 'No recipient email configured and the workflow owner has no valid email',
            }

        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: emailResult.success ? 'SENT' : 'FAILED',
            message: emailResult.success
              ? `${subject} - ${body}`
              : `${subject} - ${body}\n\n[email failed: ${emailResult.error}]`,
          },
        })

        await logActivity(userId, ACTIVITY_ACTIONS.notificationSent, {
          notificationId: notification.id,
          workflowId,
          name: emailTarget.workflowName,
          channel: 'Email',
          to,
          status: emailResult.success ? 'SENT' : 'FAILED',
          error: emailResult.error ?? null,
        })

        steps.push({
          nodeId: node.id,
          label,
          kind,
          status: emailResult.success ? 'ok' : 'error',
          message: emailResult.success
            ? `Email sent to ${to}${usedFallback ? ' (workflow owner)' : ''}`
            : `Email not sent - ${emailResult.error}`,
          output: {
            notificationId: notification.id,
            to,
            subject,
            sent: emailResult.success,
            error: emailResult.error ?? null,
          },
        })
        break
      }

      default: {
        steps.push({
          nodeId: node.id,
          label,
          kind,
          status: 'skipped',
          message: `Unknown node type "${str(node.data?.typeKey, 'unset')}" - skipped`,
        })
      }
    }

    for (const edge of outgoing.get(node.id) ?? []) {
      if (followHandles && !followHandles.includes(edge.sourceHandle ?? null)) {
        continue
      }
      const next = nodeById.get(edge.target)
      if (next && !visited.has(next.id)) queue.push(next)
    }
  }

  return {
    steps,
    aiCalls: aiResult ? 1 : 0,
    ai: aiResult,
    finalOutput: {
      classification: context.classification ?? null,
      confidence: context.confidence ?? null,
      extracted: context.extracted ?? null,
      nodesExecuted: steps.length,
    },
  }
}

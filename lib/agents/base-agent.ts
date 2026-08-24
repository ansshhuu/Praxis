import { generateText, type GenerateTextResult } from '@/lib/ai/llm-gateway'

export type AgentStatus = 'active' | 'idle' | 'error' | 'paused'

export type AgentCategory = 'development' | 'operations' | 'business' | 'marketing' | 'content'

export interface AgentContext {
  userId: string
  runId: string
  pipelineId?: string
  sharedState?: Record<string, unknown>
}

export interface AgentInput {
  prompt: string
  data?: Record<string, unknown>
}

export interface AgentHealth {
  status: AgentStatus
  lastRunAt: Date | null
  lastLatencyMs: number | null
  lastError: string | null
}

export interface AgentMetadata {
  id: string
  name: string
  category: AgentCategory
  description: string
}

export interface AgentExecutionResult {
  agentId: string
  runId: string
  output: string
  data: Record<string, unknown>
  latencyMs: number
  provider: string
  model: string
  status: 'success' | 'error'
  error?: string
}

export interface IAgent {
  execute(input: AgentInput, context: AgentContext): Promise<AgentExecutionResult>
  getHealth(): AgentHealth
  getCapabilities(): string[]
  getMetadata(): AgentMetadata
}

export interface AgentDefinition {
  id: string
  name: string
  category: AgentCategory
  description: string
  capabilities: string[]
  systemPrompt: string
}

export type GenerateTextFn = typeof generateText

export function buildUserPrompt(input: AgentInput): string {
  if (!input.data || Object.keys(input.data).length === 0) return input.prompt
  return `${input.prompt}\n\nContext data: ${JSON.stringify(input.data)}`
}

export class BaseAgent implements IAgent {
  private health: AgentHealth = {
    status: 'idle',
    lastRunAt: null,
    lastLatencyMs: null,
    lastError: null,
  }

  constructor(
    private readonly definition: AgentDefinition,
    private readonly generate: GenerateTextFn = generateText,
  ) {}

  getMetadata(): AgentMetadata {
    const { id, name, category, description } = this.definition
    return { id, name, category, description }
  }

  getCapabilities(): string[] {
    return [...this.definition.capabilities]
  }

  getHealth(): AgentHealth {
    return { ...this.health }
  }

  pause(): void {
    this.health = { ...this.health, status: 'paused' }
  }

  resume(): void {
    this.health = { ...this.health, status: 'idle' }
  }

  async execute(input: AgentInput, context: AgentContext): Promise<AgentExecutionResult> {
    this.health = { ...this.health, status: 'active' }
    const startedAt = Date.now()

    let result: GenerateTextResult
    try {
      result = await this.generate({
        messages: [
          { role: 'system', content: this.definition.systemPrompt },
          { role: 'user', content: buildUserPrompt(input) },
        ],
        maxTokens: 700,
      })
    } catch (error) {
      const latencyMs = Date.now() - startedAt
      const message = error instanceof Error ? error.message : 'Agent execution failed'
      this.health = { status: 'error', lastRunAt: new Date(), lastLatencyMs: latencyMs, lastError: message }
      return {
        agentId: this.definition.id,
        runId: context.runId,
        output: '',
        data: {},
        latencyMs,
        provider: 'none',
        model: 'none',
        status: 'error',
        error: message,
      }
    }

    const latencyMs = Date.now() - startedAt
    this.health = { status: 'idle', lastRunAt: new Date(), lastLatencyMs: latencyMs, lastError: null }

    return {
      agentId: this.definition.id,
      runId: context.runId,
      output: result.text,
      data: { ...input.data },
      latencyMs,
      provider: result.provider,
      model: result.model,
      status: 'success',
    }
  }
}

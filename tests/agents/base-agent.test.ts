import { describe, expect, it } from 'vitest'

import { BaseAgent, buildUserPrompt, type AgentDefinition, type GenerateTextFn } from '@/lib/agents/base-agent'

const DEFINITION: AgentDefinition = {
  id: 'test-agent',
  name: 'Test Agent',
  category: 'development',
  description: 'A test agent',
  capabilities: ['testing'],
  systemPrompt: 'You are a test agent.',
}

describe('buildUserPrompt', () => {
  it('returns the plain prompt when there is no data', () => {
    expect(buildUserPrompt({ prompt: 'hello' })).toBe('hello')
  })

  it('appends context data when present', () => {
    const result = buildUserPrompt({ prompt: 'hello', data: { a: 1 } })
    expect(result).toContain('hello')
    expect(result).toContain('"a":1')
  })
})

describe('BaseAgent', () => {
  it('exposes metadata and capabilities from its definition', () => {
    const agent = new BaseAgent(DEFINITION)
    expect(agent.getMetadata()).toEqual({
      id: 'test-agent',
      name: 'Test Agent',
      category: 'development',
      description: 'A test agent',
    })
    expect(agent.getCapabilities()).toEqual(['testing'])
  })

  it('starts idle and turns active then idle again on a successful run', async () => {
    const generate: GenerateTextFn = (async () => ({
      text: 'response text',
      provider: 'openai',
      model: 'gpt-4o-mini',
    })) as GenerateTextFn

    const agent = new BaseAgent(DEFINITION, generate)
    expect(agent.getHealth().status).toBe('idle')

    const result = await agent.execute({ prompt: 'do the thing' }, { userId: 'u1', runId: 'r1' })

    expect(result.status).toBe('success')
    expect(result.output).toBe('response text')
    expect(result.agentId).toBe('test-agent')
    expect(result.runId).toBe('r1')
    expect(result.latencyMs).toBeGreaterThanOrEqual(0)

    const health = agent.getHealth()
    expect(health.status).toBe('idle')
    expect(health.lastError).toBeNull()
    expect(health.lastRunAt).toBeInstanceOf(Date)
  })

  it('records an error status and message when generation fails', async () => {
    const generate: GenerateTextFn = (async () => {
      throw new Error('provider unavailable')
    }) as GenerateTextFn

    const agent = new BaseAgent(DEFINITION, generate)
    const result = await agent.execute({ prompt: 'do the thing' }, { userId: 'u1', runId: 'r1' })

    expect(result.status).toBe('error')
    expect(result.error).toBe('provider unavailable')

    const health = agent.getHealth()
    expect(health.status).toBe('error')
    expect(health.lastError).toBe('provider unavailable')
  })

  it('pause and resume update health status', () => {
    const agent = new BaseAgent(DEFINITION)
    agent.pause()
    expect(agent.getHealth().status).toBe('paused')
    agent.resume()
    expect(agent.getHealth().status).toBe('idle')
  })
})

import { describe, expect, it } from 'vitest'

import { AGENT_DEFINITIONS, AgentRegistry } from '@/lib/agents/agent-registry'

describe('AGENT_DEFINITIONS', () => {
  it('registers at least 25 agents', () => {
    expect(AGENT_DEFINITIONS.length).toBeGreaterThanOrEqual(25)
  })

  it('has unique ids', () => {
    const ids = AGENT_DEFINITIONS.map((definition) => definition.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every agent a name, description, capabilities and system prompt', () => {
    for (const definition of AGENT_DEFINITIONS) {
      expect(definition.name.length).toBeGreaterThan(0)
      expect(definition.description.length).toBeGreaterThan(0)
      expect(definition.capabilities.length).toBeGreaterThan(0)
      expect(definition.systemPrompt.length).toBeGreaterThan(0)
    }
  })

  it('covers the expected domain categories', () => {
    const categories = new Set(AGENT_DEFINITIONS.map((definition) => definition.category))
    expect(categories).toEqual(new Set(['development', 'business', 'operations', 'marketing', 'content']))
  })
})

describe('AgentRegistry', () => {
  it('returns a registered agent by id', () => {
    const registry = new AgentRegistry()
    const agent = registry.get('research-agent')
    expect(agent).toBeDefined()
    expect(agent?.getMetadata().name).toBe('Research Agent')
  })

  it('returns undefined for an unknown agent id', () => {
    const registry = new AgentRegistry()
    expect(registry.get('does-not-exist')).toBeUndefined()
  })

  it('lists agents filtered by category', () => {
    const registry = new AgentRegistry()
    const devAgents = registry.listByCategory('development')
    expect(devAgents.length).toBeGreaterThan(0)
    for (const agent of devAgents) {
      expect(agent.getMetadata().category).toBe('development')
    }
  })

  it('produces a snapshot with metadata, capabilities and health for every agent', () => {
    const registry = new AgentRegistry()
    const snapshot = registry.listSnapshot()
    expect(snapshot.length).toBe(AGENT_DEFINITIONS.length)
    for (const entry of snapshot) {
      expect(entry.health.status).toBe('idle')
      expect(Array.isArray(entry.capabilities)).toBe(true)
    }
  })
})

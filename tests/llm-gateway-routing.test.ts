import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { resolveProviderOrder } from '@/lib/ai/llm-gateway'

describe('resolveProviderOrder', () => {
  beforeEach(() => {
    vi.stubEnv('GEMINI_API_KEY', 'test-gemini-key')
    vi.stubEnv('GROQ_API_KEY', 'test-groq-key')
    vi.stubEnv('LLM_PROVIDER_ORDER', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('honors an explicit provider override regardless of task', () => {
    const order = resolveProviderOrder({ messages: [], task: 'hr-offer-letter', provider: 'groq' })
    expect(order).toEqual(['groq'])
  })

  it('honors an explicit providers list over the task default', () => {
    const order = resolveProviderOrder({ messages: [], task: 'crm-proposal', providers: ['ollama'] })
    expect(order).toEqual(['ollama'])
  })

  it('routes crm-proposal to groq first, gemini as fallback', () => {
    expect(resolveProviderOrder({ messages: [], task: 'crm-proposal' })).toEqual(['groq', 'gemini'])
  })

  it('routes hr-offer-letter to gemini first, groq as fallback', () => {
    expect(resolveProviderOrder({ messages: [], task: 'hr-offer-letter' })).toEqual(['gemini', 'groq'])
  })

  it('splits load across tasks instead of always preferring the same provider', () => {
    const groqFirst = resolveProviderOrder({ messages: [], task: 'support-reply' })[0]
    const geminiFirst = resolveProviderOrder({ messages: [], task: 'rag-answer' })[0]
    expect(groqFirst).toBe('groq')
    expect(geminiFirst).toBe('gemini')
  })

  it('drops an unconfigured primary provider but keeps the fallback', () => {
    vi.stubEnv('GROQ_API_KEY', '')
    const order = resolveProviderOrder({ messages: [], task: 'crm-proposal' })
    expect(order).toEqual(['gemini'])
  })

  it('falls back to the untasked default when no task is given', () => {
    expect(resolveProviderOrder({ messages: [] })).toEqual(['gemini', 'groq'])
  })

  it('lets LLM_PROVIDER_ORDER override task-based routing', () => {
    vi.stubEnv('LLM_PROVIDER_ORDER', 'ollama,groq')
    const order = resolveProviderOrder({ messages: [], task: 'crm-proposal' })
    expect(order).toEqual(['ollama', 'groq'])
  })
})

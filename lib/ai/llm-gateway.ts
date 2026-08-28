import { GoogleGenAI } from '@google/genai'

import { applyGuardrails } from '@/lib/ai/guardrails'

export type LLMProvider = 'gemini' | 'groq' | 'ollama'

export type LLMRole = 'system' | 'user' | 'assistant'

export interface LLMMessage {
  role: LLMRole
  content: string
}

export type LLMTask =
  | 'crm-proposal'
  | 'crm-follow-up'
  | 'hr-interview-questions'
  | 'hr-offer-letter'
  | 'support-reply'
  | 'support-translate'
  | 'marketing-post'
  | 'finance-invoice'
  | 'voice-command'
  | 'rag-answer'
  | 'workflow-step'

export interface GenerateTextOptions {
  messages: LLMMessage[]
  task?: LLMTask
  provider?: LLMProvider
  providers?: LLMProvider[]
  model?: string
  temperature?: number
  maxTokens?: number
  applyGuardrails?: boolean
}

export interface GenerateTextResult {
  text: string
  provider: LLMProvider
  model: string
}

export type GenerateStreamOptions = GenerateTextOptions

export interface StreamChunk {
  text: string
  provider: LLMProvider
  model: string
  done: boolean
}

const DEFAULT_MODELS: Record<LLMProvider, string> = {
  gemini: 'gemini-3.6-flash',
  groq: 'openai/gpt-oss-120b',
  ollama: 'llama3.1',
}

const DEFAULT_MAX_TOKENS = 2048
const DEFAULT_TEMPERATURE = 0.3

const TASK_PROVIDER_ORDER: Record<LLMTask, LLMProvider[]> = {
  'crm-proposal': ['groq', 'gemini'],
  'crm-follow-up': ['groq', 'gemini'],
  'hr-interview-questions': ['gemini', 'groq'],
  'hr-offer-letter': ['gemini', 'groq'],
  'support-reply': ['groq', 'gemini'],
  'support-translate': ['groq', 'gemini'],
  'marketing-post': ['gemini', 'groq'],
  'finance-invoice': ['gemini', 'groq'],
  'voice-command': ['groq', 'gemini'],
  'rag-answer': ['gemini', 'groq'],
  'workflow-step': ['groq', 'gemini'],
}

function defaultProviderOrder(task?: LLMTask): LLMProvider[] {
  const configured = process.env.LLM_PROVIDER_ORDER?.split(',')
    .map((entry) => entry.trim())
    .filter((entry): entry is LLMProvider => ['gemini', 'groq', 'ollama'].includes(entry))
  if (configured && configured.length > 0) return configured
  if (task) return TASK_PROVIDER_ORDER[task]
  return ['gemini', 'groq']
}

function isProviderConfigured(provider: LLMProvider): boolean {
  switch (provider) {
    case 'gemini':
      return Boolean(process.env.GEMINI_API_KEY?.trim())
    case 'groq':
      return Boolean(process.env.GROQ_API_KEY?.trim())
    case 'ollama':
      return true
  }
}

function sanitizeMessages(messages: LLMMessage[]): LLMMessage[] {
  return messages.map((message) => ({
    role: message.role,
    content: applyGuardrails(message.content).sanitizedText,
  }))
}

function splitSystem(messages: LLMMessage[]): { system: string | undefined; rest: LLMMessage[] } {
  const systemParts = messages.filter((m) => m.role === 'system').map((m) => m.content)
  const rest = messages.filter((m) => m.role !== 'system')
  return { system: systemParts.length ? systemParts.join('\n\n') : undefined, rest }
}

function getGeminiClient(): GoogleGenAI {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? '' })
}

async function callGemini(
  messages: LLMMessage[],
  model: string,
  temperature: number,
  maxTokens: number,
): Promise<string> {
  const ai = getGeminiClient()
  const { system, rest } = splitSystem(messages)
  const contents = rest.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
  const result = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: system,
      temperature,
      maxOutputTokens: maxTokens,
    },
  })
  const text = result.text?.trim()
  if (!text) throw new Error('Gemini returned an empty response')
  return text
}

async function* streamGemini(
  messages: LLMMessage[],
  model: string,
  temperature: number,
  maxTokens: number,
): AsyncGenerator<string> {
  const ai = getGeminiClient()
  const { system, rest } = splitSystem(messages)
  const contents = rest.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
  const stream = await ai.models.generateContentStream({
    model,
    contents,
    config: {
      systemInstruction: system,
      temperature,
      maxOutputTokens: maxTokens,
    },
  })
  for await (const chunk of stream) {
    const text = chunk.text
    if (text) yield text
  }
}

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1'

async function callGroq(
  messages: LLMMessage[],
  model: string,
  temperature: number,
  maxTokens: number,
): Promise<string> {
  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY ?? ''}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: maxTokens,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Groq request failed (${response.status}): ${detail.slice(0, 300)}`)
  }
  const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] }
  const text = payload.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('Groq returned an empty response')
  return text
}

async function* streamGroq(
  messages: LLMMessage[],
  model: string,
  temperature: number,
  maxTokens: number,
): AsyncGenerator<string> {
  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY ?? ''}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: maxTokens,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    }),
  })
  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Groq request failed (${response.status}): ${detail.slice(0, 300)}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') return
      if (!data) continue
      const parsed = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] }
      const delta = parsed.choices?.[0]?.delta?.content
      if (delta) yield delta
    }
  }
}

async function callOllama(
  messages: LLMMessage[],
  model: string,
  temperature: number,
): Promise<string> {
  const baseUrl = process.env.OLLAMA_BASE_URL?.trim() || 'http://localhost:11434'
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: false,
      options: { temperature },
    }),
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Ollama request failed (${response.status}): ${detail.slice(0, 300)}`)
  }
  const payload = (await response.json()) as { message?: { content?: string } }
  const text = payload.message?.content?.trim()
  if (!text) throw new Error('Ollama returned an empty response')
  return text
}

async function* streamOllama(
  messages: LLMMessage[],
  model: string,
  temperature: number,
): AsyncGenerator<string> {
  const baseUrl = process.env.OLLAMA_BASE_URL?.trim() || 'http://localhost:11434'
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
      options: { temperature },
    }),
  })
  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Ollama request failed (${response.status}): ${detail.slice(0, 300)}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.trim()) continue
      const parsed = JSON.parse(line) as { message?: { content?: string }; done?: boolean }
      if (parsed.message?.content) yield parsed.message.content
      if (parsed.done) return
    }
  }
}

async function dispatchCall(
  provider: LLMProvider,
  messages: LLMMessage[],
  model: string,
  temperature: number,
  maxTokens: number,
): Promise<string> {
  switch (provider) {
    case 'gemini':
      return callGemini(messages, model, temperature, maxTokens)
    case 'groq':
      return callGroq(messages, model, temperature, maxTokens)
    case 'ollama':
      return callOllama(messages, model, temperature)
  }
}

function dispatchStream(
  provider: LLMProvider,
  messages: LLMMessage[],
  model: string,
  temperature: number,
  maxTokens: number,
): AsyncGenerator<string> {
  switch (provider) {
    case 'gemini':
      return streamGemini(messages, model, temperature, maxTokens)
    case 'groq':
      return streamGroq(messages, model, temperature, maxTokens)
    case 'ollama':
      return streamOllama(messages, model, temperature)
  }
}

export function resolveProviderOrder(options: GenerateTextOptions): LLMProvider[] {
  const order = options.provider
    ? [options.provider]
    : options.providers && options.providers.length > 0
      ? options.providers
      : defaultProviderOrder(options.task)
  return order.filter(isProviderConfigured)
}

export async function generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
  const order = resolveProviderOrder(options)
  if (order.length === 0) {
    throw new Error(
      'No LLM provider is configured. Set GEMINI_API_KEY and/or GROQ_API_KEY, or configure OLLAMA_BASE_URL.',
    )
  }

  const messages = options.applyGuardrails === false ? options.messages : sanitizeMessages(options.messages)
  const temperature = options.temperature ?? DEFAULT_TEMPERATURE
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS

  const failures: string[] = []
  for (const provider of order) {
    const model = options.model ?? DEFAULT_MODELS[provider]
    try {
      const text = await dispatchCall(provider, messages, model, temperature, maxTokens)
      return { text, provider, model }
    } catch (error) {
      console.error(`[llm-gateway] ${provider} failed, trying next provider:`, error)
      failures.push(`${provider}: ${(error as Error).message}`)
    }
  }

  throw new Error(`All configured LLM providers failed - ${failures.join(' | ')}`)
}

export async function* generateStream(options: GenerateStreamOptions): AsyncGenerator<StreamChunk> {
  const order = resolveProviderOrder(options)
  if (order.length === 0) {
    throw new Error(
      'No LLM provider is configured. Set GEMINI_API_KEY and/or GROQ_API_KEY, or configure OLLAMA_BASE_URL.',
    )
  }

  const messages = options.applyGuardrails === false ? options.messages : sanitizeMessages(options.messages)
  const temperature = options.temperature ?? DEFAULT_TEMPERATURE
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS

  const failures: string[] = []
  for (const provider of order) {
    const model = options.model ?? DEFAULT_MODELS[provider]
    try {
      let emitted = false
      for await (const text of dispatchStream(provider, messages, model, temperature, maxTokens)) {
        emitted = true
        yield { text, provider, model, done: false }
      }
      yield { text: '', provider, model, done: true }
      if (emitted) return
      throw new Error(`${provider} stream produced no output`)
    } catch (error) {
      console.error(`[llm-gateway] ${provider} stream failed, trying next provider:`, error)
      failures.push(`${provider}: ${(error as Error).message}`)
    }
  }

  throw new Error(`All configured LLM providers failed to stream - ${failures.join(' | ')}`)
}

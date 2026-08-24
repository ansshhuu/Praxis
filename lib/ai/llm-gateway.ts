import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'

import { applyGuardrails } from '@/lib/ai/guardrails'

export type LLMProvider = 'openai' | 'anthropic' | 'gemini' | 'ollama'

export type LLMRole = 'system' | 'user' | 'assistant'

export interface LLMMessage {
  role: LLMRole
  content: string
}

export interface GenerateTextOptions {
  messages: LLMMessage[]
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
  openai: 'gpt-4o-mini',
  anthropic: 'claude-opus-5',
  gemini: 'gemini-2.5-flash',
  ollama: 'llama3.1',
}

const DEFAULT_MAX_TOKENS = 2048
const DEFAULT_TEMPERATURE = 0.3

function defaultProviderOrder(): LLMProvider[] {
  const configured = process.env.LLM_PROVIDER_ORDER?.split(',')
    .map((entry) => entry.trim())
    .filter((entry): entry is LLMProvider =>
      ['openai', 'anthropic', 'gemini', 'ollama'].includes(entry),
    )
  if (configured && configured.length > 0) return configured
  return ['openai', 'anthropic', 'gemini', 'ollama']
}

function isProviderConfigured(provider: LLMProvider): boolean {
  switch (provider) {
    case 'openai':
      return Boolean(process.env.OPENAI_API_KEY?.trim())
    case 'anthropic':
      return Boolean(process.env.ANTHROPIC_API_KEY?.trim())
    case 'gemini':
      return Boolean(process.env.GEMINI_API_KEY?.trim())
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

async function callOpenAI(
  messages: LLMMessage[],
  model: string,
  temperature: number,
  maxTokens: number,
): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const response = await client.chat.completions.create({
    model,
    temperature,
    max_tokens: maxTokens,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  })
  const text = response.choices[0]?.message?.content?.trim()
  if (!text) throw new Error('OpenAI returned an empty response')
  return text
}

async function* streamOpenAI(
  messages: LLMMessage[],
  model: string,
  temperature: number,
  maxTokens: number,
): AsyncGenerator<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const stream = await client.chat.completions.create({
    model,
    temperature,
    max_tokens: maxTokens,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    stream: true,
  })
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content
    if (delta) yield delta
  }
}

async function callAnthropic(
  messages: LLMMessage[],
  model: string,
  temperature: number,
  maxTokens: number,
): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const { system, rest } = splitSystem(messages)
  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system,
    messages: rest.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
  })
  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim()
  if (!text) throw new Error('Anthropic returned an empty response')
  return text
}

async function* streamAnthropic(
  messages: LLMMessage[],
  model: string,
  temperature: number,
  maxTokens: number,
): AsyncGenerator<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const { system, rest } = splitSystem(messages)
  const stream = client.messages.stream({
    model,
    max_tokens: maxTokens,
    temperature,
    system,
    messages: rest.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
  })
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text
    }
  }
}

async function callGemini(
  messages: LLMMessage[],
  model: string,
  temperature: number,
  maxTokens: number,
): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')
  const { system, rest } = splitSystem(messages)
  const generativeModel = genAI.getGenerativeModel({
    model,
    systemInstruction: system,
    generationConfig: { temperature, maxOutputTokens: maxTokens },
  })
  const contents = rest.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
  const result = await generativeModel.generateContent({ contents })
  const text = result.response.text().trim()
  if (!text) throw new Error('Gemini returned an empty response')
  return text
}

async function* streamGemini(
  messages: LLMMessage[],
  model: string,
  temperature: number,
  maxTokens: number,
): AsyncGenerator<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')
  const { system, rest } = splitSystem(messages)
  const generativeModel = genAI.getGenerativeModel({
    model,
    systemInstruction: system,
    generationConfig: { temperature, maxOutputTokens: maxTokens },
  })
  const contents = rest.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
  const result = await generativeModel.generateContentStream({ contents })
  for await (const chunk of result.stream) {
    const text = chunk.text()
    if (text) yield text
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
    case 'openai':
      return callOpenAI(messages, model, temperature, maxTokens)
    case 'anthropic':
      return callAnthropic(messages, model, temperature, maxTokens)
    case 'gemini':
      return callGemini(messages, model, temperature, maxTokens)
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
    case 'openai':
      return streamOpenAI(messages, model, temperature, maxTokens)
    case 'anthropic':
      return streamAnthropic(messages, model, temperature, maxTokens)
    case 'gemini':
      return streamGemini(messages, model, temperature, maxTokens)
    case 'ollama':
      return streamOllama(messages, model, temperature)
  }
}

function resolveProviderOrder(options: GenerateTextOptions): LLMProvider[] {
  const order = options.provider
    ? [options.provider]
    : options.providers && options.providers.length > 0
      ? options.providers
      : defaultProviderOrder()
  return order.filter(isProviderConfigured)
}

export async function generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
  const order = resolveProviderOrder(options)
  if (order.length === 0) {
    throw new Error(
      'No LLM provider is configured. Set at least one of OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, or configure OLLAMA_BASE_URL.',
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

  throw new Error(`All configured LLM providers failed — ${failures.join(' | ')}`)
}

export async function* generateStream(options: GenerateStreamOptions): AsyncGenerator<StreamChunk> {
  const order = resolveProviderOrder(options)
  if (order.length === 0) {
    throw new Error(
      'No LLM provider is configured. Set at least one of OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, or configure OLLAMA_BASE_URL.',
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

  throw new Error(`All configured LLM providers failed to stream — ${failures.join(' | ')}`)
}

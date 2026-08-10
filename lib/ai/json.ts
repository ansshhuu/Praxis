export function stripFences(raw: string): string {
  return raw
    .replace(/^\s*```(?:json|javascript)?\s*/i, '')
    .replace(/```\s*$/, '')
    .replace(/```(?:json|javascript)?/gi, '')
    .trim()
}

export function tryParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

export function extractBalanced(text: string, open: '[' | '{'): string | null {
  const close = open === '[' ? ']' : '}'
  const start = text.indexOf(open)
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < text.length; i += 1) {
    const char = text[i]

    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }

    if (char === '"') inString = true
    else if (char === open) depth += 1
    else if (char === close) {
      depth -= 1
      if (depth === 0) return text.slice(start, i + 1)
    }
  }

  return null
}

export function repairTruncatedArray(text: string): unknown[] | null {
  const start = text.indexOf('[')
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escaped = false
  let lastComplete = -1

  for (let i = start; i < text.length; i += 1) {
    const char = text[i]

    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }

    if (char === '"') inString = true
    else if (char === '[' || char === '{') depth += 1
    else if (char === ']' || char === '}') {
      depth -= 1
      if (depth === 1 && char === '}') lastComplete = i
    }
  }

  if (lastComplete === -1) return null
  const parsed = tryParse(`${text.slice(start, lastComplete + 1)}]`)
  return Array.isArray(parsed) ? parsed : null
}

function coerceToArray(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  for (const key of ['candidates', 'results', 'data', 'items', 'scores']) {
    if (Array.isArray(record[key])) return record[key] as unknown[]
  }
  return Object.keys(record).length > 0 ? [record] : null
}

export function parseJsonArray(raw: string): unknown[] | null {
  const cleaned = stripFences(raw)
  if (!cleaned) return null

  const direct = coerceToArray(tryParse(cleaned))
  if (direct) return direct

  const array = extractBalanced(cleaned, '[')
  if (array) {
    const parsed = coerceToArray(tryParse(array))
    if (parsed) return parsed
  }

  const object = extractBalanced(cleaned, '{')
  if (object) {
    const parsed = coerceToArray(tryParse(object))
    if (parsed) return parsed
  }

  return repairTruncatedArray(cleaned)
}

export function parseJsonObject(raw: string): Record<string, unknown> | null {
  const cleaned = stripFences(raw)
  if (!cleaned) return null

  const direct = tryParse(cleaned)
  if (direct && typeof direct === 'object' && !Array.isArray(direct)) {
    return direct as Record<string, unknown>
  }

  const object = extractBalanced(cleaned, '{')
  if (object) {
    const parsed = tryParse(object)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  }

  const array = parseJsonArray(cleaned)
  return array ? { action_items: array } : null
}

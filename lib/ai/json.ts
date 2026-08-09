/**
 * Tolerant JSON extraction for model output.
 *
 * Free-tier models wrap answers in code fences, pad them with prose, return a
 * wrapper object instead of the array asked for, or get cut off mid-structure
 * when they hit their output-token cap. Each of those is recovered here.
 *
 * Originally written for and proven by `lib/resumes/scoring.ts`; lifted here
 * unchanged so the Meetings analysis can reuse the same battle-tested parsing
 * instead of growing a second, weaker copy.
 */

/** Remove markdown code fences and any surrounding whitespace. */
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

/**
 * Slice out the first balanced `[...]` / `{...}` run, ignoring brackets that
 * appear inside string literals. `lastIndexOf(']')` alone gets this wrong when
 * the model adds prose after the JSON, or when the payload is truncated and
 * the final `]` belongs to a nested array.
 */
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

/**
 * Salvage an array that was cut off mid-flight (the provider hitting its output
 * token cap). Keeps every element that closed cleanly and discards the partial
 * one, so four of five elements survive instead of the whole batch failing.
 */
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
      // depth 1 means we just closed a direct element of the outer array.
      if (depth === 1 && char === '}') lastComplete = i
    }
  }

  if (lastComplete === -1) return null
  const parsed = tryParse(`${text.slice(start, lastComplete + 1)}]`)
  return Array.isArray(parsed) ? parsed : null
}

/** Unwrap `{ "candidates": [...] }` style responses, or a lone object. */
function coerceToArray(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  for (const key of ['candidates', 'results', 'data', 'items', 'scores']) {
    if (Array.isArray(record[key])) return record[key] as unknown[]
  }
  // A single element returned bare rather than in an array.
  return Object.keys(record).length > 0 ? [record] : null
}

/**
 * Tolerant JSON array extraction. Models wrap output in fences, add prose
 * around it, return a wrapper object, or get truncated mid-array — each of
 * those is recovered here before giving up.
 */
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

/**
 * Object counterpart to {@link parseJsonArray}, for prompts that ask for a
 * single record (`{ summary, action_items, attendees }`) rather than a list.
 */
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

  // A model that answered with a bare array of action items still carries
  // usable data — hand it back under the expected key rather than failing.
  const array = parseJsonArray(cleaned)
  return array ? { action_items: array } : null
}

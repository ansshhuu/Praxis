/**
 * Resume scoring: builds the batched prompts sent to the shared ai-router and
 * parses what comes back.
 *
 * Cost model — one `callAI` per batch, and a batch holds as many resumes as
 * fit inside the character budget. A typical screening of 3-5 resumes is a
 * single call; only genuinely large sets split.
 */

import { callAI } from '@/lib/ai/ai-router'

/** Combined prompt ceiling (JD + all resume excerpts) before splitting. */
const MAX_BATCH_CHARS = 12_000
/** Hard cap on resumes per call, even when they are all short. */
const MAX_RESUMES_PER_BATCH = 5
/** Per-resume excerpt — one long CV must not crowd out the others. */
const MAX_RESUME_CHARS = 4_000
/** JD excerpt; the requirements are almost always in the opening section. */
const MAX_JD_CHARS = 2_000

export class ScoringError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'ScoringError'
  }
}

export type ResumeInput = {
  /** Caller's identifier (the document id) — echoed back on the result. */
  key: string
  fileName: string
  text: string
}

export type ScoredCandidate = {
  key: string
  fileName: string
  candidateName: string
  email: string | null
  skills: string[]
  skillsMissing: string[]
  jdMatchScore: number
  yearsExperience: number | null
  currentRole: string | null
  education: string | null
  summary: string | null
}

/** Remove markdown code fences and any surrounding whitespace. */
function stripFences(raw: string): string {
  return raw
    .replace(/^\s*```(?:json|javascript)?\s*/i, '')
    .replace(/```\s*$/, '')
    .replace(/```(?:json|javascript)?/gi, '')
    .trim()
}

function tryParse(text: string): unknown {
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
 * the final `]` belongs to a nested "skills" array.
 */
function extractBalanced(text: string, open: '[' | '{'): string | null {
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
 * one, so four of five candidates still score instead of the whole batch failing.
 */
function repairTruncatedArray(text: string): unknown[] | null {
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
  // A single candidate returned bare rather than in an array.
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

function excerpt(text: string, limit: number): string {
  const trimmed = text.trim()
  return trimmed.length > limit ? `${trimmed.slice(0, limit)}…[truncated]` : trimmed
}

/**
 * Greedy packing: fill each batch until either the character budget or the
 * per-batch count is reached. Every batch holds at least one resume, however
 * long that resume is.
 */
export function buildBatches(
  inputs: ResumeInput[],
  jdLength: number,
): ResumeInput[][] {
  const budget = Math.max(2_000, MAX_BATCH_CHARS - jdLength)
  const batches: ResumeInput[][] = []

  let current: ResumeInput[] = []
  let used = 0

  for (const input of inputs) {
    const cost = Math.min(input.text.length, MAX_RESUME_CHARS)
    const full = current.length >= MAX_RESUMES_PER_BATCH
    const overflows = current.length > 0 && used + cost > budget

    if (full || overflows) {
      batches.push(current)
      current = []
      used = 0
    }

    current.push(input)
    used += cost
  }

  if (current.length > 0) batches.push(current)
  return batches
}

function buildPrompt(jobDescription: string, batch: ResumeInput[]): string {
  const resumes = batch
    .map((input, index) =>
      [
        `--- CANDIDATE C${index + 1} (file: ${input.fileName}) ---`,
        excerpt(input.text, MAX_RESUME_CHARS),
      ].join('\n'),
    )
    .join('\n\n')

  return [
    `Score each candidate below against the job description.`,
    `Respond with ONLY the raw JSON array, no markdown formatting, no code fences, no explanation text before or after.`,
    `Keep "summary" to one short sentence so the response is not cut off.`,
    `One object per candidate, in the same order, with exactly these keys:`,
    `  "id": the candidate label (e.g. "C1")`,
    `  "candidate_name": full name inferred from the resume, or the file name if absent`,
    `  "email": email address found in the resume, or null`,
    `  "skills": array of skills the candidate has that the job description asks for`,
    `  "skills_missing": array of job-description skills the candidate lacks`,
    `  "jd_match_score": integer 0-100, how well they match`,
    `  "years_experience": number of years of relevant experience, or null`,
    `  "current_role": current job title and employer, or null`,
    `  "education": highest qualification and institution, or null`,
    `  "summary": one or two sentences assessing fit`,
    '',
    `JOB DESCRIPTION:`,
    excerpt(jobDescription, MAX_JD_CHARS),
    '',
    resumes,
  ].join('\n')
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 24)
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function asScore(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.min(100, Math.max(0, Math.round(numeric)))
}

function asYears(value: unknown): number | null {
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) && numeric >= 0 ? Math.min(60, numeric) : null
}

/**
 * Match a returned row back to its input. Prefers the "C{n}" label the model
 * was given; falls back to array position when the label is missing or bogus.
 */
function resolveInput(row: Record<string, unknown>, batch: ResumeInput[], index: number) {
  const id = typeof row.id === 'string' ? row.id.trim().toUpperCase() : ''
  const match = /^C(\d+)$/.exec(id)
  if (match) {
    const position = Number(match[1]) - 1
    if (position >= 0 && position < batch.length) return batch[position]
  }
  return batch[index] ?? null
}

async function scoreBatch(
  jobDescription: string,
  batch: ResumeInput[],
): Promise<ScoredCandidate[]> {
  const raw = await callAI(buildPrompt(jobDescription, batch))

  // Raw, pre-parse response — the only way to tell a fenced reply from a
  // truncated one from a provider that answered in prose.
  console.log(
    `[resumes/scoring] raw AI response for ${batch.length} candidate(s), ${raw.length} chars:\n${raw}`,
  )

  const rows = parseJsonArray(raw)

  if (!rows) {
    console.error('[resumes/scoring] every parse strategy failed on the response above')
    throw new ScoringError(
      'The AI response could not be read as candidate scores. Please try screening again.',
    )
  }

  const seen = new Set<string>()
  const scored: ScoredCandidate[] = []

  rows.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') return
    const row = entry as Record<string, unknown>
    const input = resolveInput(row, batch, index)
    // A duplicated label must not overwrite a candidate already scored.
    if (!input || seen.has(input.key)) return
    seen.add(input.key)

    scored.push({
      key: input.key,
      fileName: input.fileName,
      candidateName: asNullableString(row.candidate_name) ?? input.fileName,
      email: asNullableString(row.email),
      skills: asStringArray(row.skills),
      skillsMissing: asStringArray(row.skills_missing),
      jdMatchScore: asScore(row.jd_match_score),
      yearsExperience: asYears(row.years_experience),
      currentRole: asNullableString(row.current_role),
      education: asNullableString(row.education),
      summary: asNullableString(row.summary),
    })
  })

  if (scored.length === 0) {
    throw new ScoringError('The AI returned no usable candidate scores. Please try again.')
  }

  return scored
}

/**
 * Score every resume against the JD and return them ranked best-first.
 *
 * Batches run sequentially: the free-tier providers behind `callAI` rate-limit
 * aggressively, and a screening is not latency-critical.
 *
 * @throws {ScoringError} when the model is unreachable or its output is unusable.
 */
export async function scoreResumes(
  jobDescription: string,
  inputs: ResumeInput[],
): Promise<ScoredCandidate[]> {
  if (inputs.length === 0) return []

  const batches = buildBatches(inputs, Math.min(jobDescription.length, MAX_JD_CHARS))
  const results: ScoredCandidate[] = []

  for (const batch of batches) {
    try {
      results.push(...(await scoreBatch(jobDescription, batch)))
    } catch (error) {
      if (error instanceof ScoringError) throw error
      throw new ScoringError(`Scoring failed: ${(error as Error).message}`, { cause: error })
    }
  }

  // Re-rank across all batches — per-batch scores are only comparable once
  // they're merged, so ranking is assigned here rather than by the model.
  return results.sort((a, b) => b.jdMatchScore - a.jdMatchScore)
}

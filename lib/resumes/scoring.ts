import { callAI } from '@/lib/ai/ai-router'
import { parseJsonArray } from '@/lib/ai/json'

export { parseJsonArray }

const MAX_BATCH_CHARS = 12_000
const MAX_RESUMES_PER_BATCH = 5
const MAX_RESUME_CHARS = 4_000
const MAX_JD_CHARS = 2_000

export class ScoringError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'ScoringError'
  }
}

export type ResumeInput = {
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

function excerpt(text: string, limit: number): string {
  const trimmed = text.trim()
  return trimmed.length > limit ? `${trimmed.slice(0, limit)}…[truncated]` : trimmed
}

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

  const rows = parseJsonArray(raw)

  if (!rows) {
    console.error(
      `[resumes/scoring] every parse strategy failed on a ${raw.length}-char response for ` +
        `${batch.length} candidate(s); first 200 chars: ${raw.slice(0, 200)}`,
    )
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

  return results.sort((a, b) => b.jdMatchScore - a.jdMatchScore)
}

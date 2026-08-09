/**
 * Meeting analysis: summary + action items + attendees from a transcript.
 *
 * Cost model — exactly ONE `callAI` per meeting. Summary, action items and
 * attendee extraction are deliberately fused into a single structured-JSON
 * prompt rather than three focused ones, matching the discipline in
 * Documents and Resumes.
 */

import { callAI } from '@/lib/ai/ai-router'
import { parseJsonObject } from '@/lib/ai/json'

/**
 * Transcript excerpt sent to the model. An hour of speech is ~50k characters,
 * far past the free-tier budget, so long meetings are analysed from the
 * opening stretch — where agenda, attendees and most commitments land.
 */
const MAX_TRANSCRIPT_CHARS = 8_000

/** Below this there is nothing worth spending an AI call on. */
export const MIN_TRANSCRIPT_CHARS = 40

const MAX_ACTION_ITEMS = 25
const MAX_ATTENDEES = 20

export class AnalysisError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'AnalysisError'
  }
}

export type ActionItem = {
  task: string
  assignee_guess: string | null
  deadline_guess: string | null
}

export type MeetingAnalysis = {
  summary: string | null
  actionItems: ActionItem[]
  attendees: string[]
  /** True when the transcript was truncated before being sent to the model. */
  truncated: boolean
}

function buildPrompt(transcript: string): string {
  const truncated = transcript.length > MAX_TRANSCRIPT_CHARS
  const excerpt = truncated ? transcript.slice(0, MAX_TRANSCRIPT_CHARS) : transcript

  return [
    truncated
      ? 'Analyse this partial transcript from the beginning of a meeting.'
      : 'Analyse this meeting transcript.',
    'Respond with ONLY a raw JSON object, no markdown formatting, no code fences, no explanation before or after.',
    'Use exactly these keys:',
    '  "summary": 2-4 sentences covering what was discussed and decided',
    '  "action_items": array of objects, each with:',
    '      "task": the concrete thing to be done, one short sentence',
    '      "assignee_guess": who is most likely responsible, or null if unclear',
    '      "deadline_guess": any deadline mentioned (e.g. "Friday", "end of Q3"), or null',
    '  "attendees": array of participant names identifiable from the transcript, or []',
    '',
    'Do not invent names, owners or deadlines. Use null when the transcript does not say.',
    'If there are no action items, return an empty array.',
    '',
    'TRANSCRIPT:',
    excerpt,
  ].join('\n')
}

function asNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  // Models routinely emit these as strings rather than a JSON null.
  if (/^(null|none|n\/a|unknown|unspecified|tbd)$/i.test(trimmed)) return null
  return trimmed
}

function asActionItems(value: unknown): ActionItem[] {
  if (!Array.isArray(value)) return []

  const items: ActionItem[] = []
  for (const entry of value) {
    // Tolerate a plain array of strings, which some models return when no
    // owner or deadline was mentioned anywhere.
    if (typeof entry === 'string') {
      const task = entry.trim()
      if (task) items.push({ task, assignee_guess: null, deadline_guess: null })
      continue
    }
    if (!entry || typeof entry !== 'object') continue

    const row = entry as Record<string, unknown>
    const task = asNullableString(row.task) ?? asNullableString(row.action)
    if (!task) continue

    items.push({
      task: task.slice(0, 400),
      assignee_guess:
        asNullableString(row.assignee_guess) ?? asNullableString(row.assignee),
      deadline_guess:
        asNullableString(row.deadline_guess) ?? asNullableString(row.deadline),
    })

    if (items.length >= MAX_ACTION_ITEMS) break
  }
  return items
}

function asAttendees(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const names: string[] = []

  for (const entry of value) {
    // `attendees` occasionally comes back as [{ name: "..." }].
    const raw =
      typeof entry === 'string'
        ? entry
        : entry && typeof entry === 'object'
          ? (entry as Record<string, unknown>).name
          : null
    const name = asNullableString(raw)
    if (!name) continue

    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    names.push(name.slice(0, 120))

    if (names.length >= MAX_ATTENDEES) break
  }
  return names
}

/**
 * Summarise a transcript and pull out action items and attendees.
 *
 * Exactly one AI call. Parsing is tolerant (see `lib/ai/json.ts`), but a
 * response that yields nothing usable is an error rather than a silent empty
 * result — the caller should surface that instead of showing a blank panel.
 *
 * @throws {AnalysisError} when the model is unreachable or its output is unusable.
 */
export async function analyzeTranscript(transcript: string): Promise<MeetingAnalysis> {
  const trimmed = transcript.trim()
  if (trimmed.length < MIN_TRANSCRIPT_CHARS) {
    throw new AnalysisError(
      `The transcript is too short to analyse (needs at least ${MIN_TRANSCRIPT_CHARS} characters).`,
    )
  }

  let raw: string
  try {
    raw = await callAI(buildPrompt(trimmed))
  } catch (error) {
    throw new AnalysisError(`AI analysis unavailable: ${(error as Error).message}`, {
      cause: error,
    })
  }

  const parsed = parseJsonObject(raw)
  if (!parsed) {
    console.error(
      `[meetings/analyze] every parse strategy failed on the response:\n${raw.slice(0, 1000)}`,
    )
    throw new AnalysisError(
      'The AI response could not be read as a meeting analysis. Please try processing again.',
    )
  }

  const summary = asNullableString(parsed.summary)
  const actionItems = asActionItems(parsed.action_items ?? parsed.actionItems)
  const attendees = asAttendees(parsed.attendees)

  // A parse that produced a shape but no content is still a failed analysis.
  if (!summary && actionItems.length === 0 && attendees.length === 0) {
    throw new AnalysisError(
      'The AI returned no usable summary or action items for this transcript.',
    )
  }

  return {
    summary,
    actionItems,
    attendees,
    truncated: trimmed.length > MAX_TRANSCRIPT_CHARS,
  }
}

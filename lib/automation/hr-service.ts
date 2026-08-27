import { applyGuardrails } from '@/lib/ai/guardrails'
import { generateText } from '@/lib/ai/llm-gateway'
import { embedTexts } from '@/lib/ai/rag-engine'
import { getHrCandidatesCollection, type HrCandidate } from '@/lib/models/mongodb/hr-candidates'

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0

  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

export interface CandidateMatch {
  candidateId: string
  name: string
  score: number
}

export function rankCandidates(matches: CandidateMatch[]): (CandidateMatch & { rank: number })[] {
  return [...matches]
    .sort((a, b) => b.score - a.score)
    .map((match, index) => ({ ...match, rank: index + 1 }))
}

export interface ScreenCandidateInput {
  candidateId: string
  name: string
  email: string
  resumeText: string
}

export interface ScreenResumesOptions {
  userId: string
  jobId: string
  jobDescription: string
  candidates: ScreenCandidateInput[]
}

export async function screenResumes(options: ScreenResumesOptions): Promise<HrCandidate[]> {
  const [jdEmbedding] = await embedTexts([options.jobDescription])
  const resumeEmbeddings = await embedTexts(options.candidates.map((candidate) => candidate.resumeText))

  const matches: CandidateMatch[] = options.candidates.map((candidate, index) => ({
    candidateId: candidate.candidateId,
    name: candidate.name,
    score: Math.round(cosineSimilarity(jdEmbedding, resumeEmbeddings[index]) * 100),
  }))

  const ranked = rankCandidates(matches)
  const collection = await getHrCandidatesCollection()

  const records: HrCandidate[] = ranked.map((entry) => {
    const source = options.candidates.find((candidate) => candidate.candidateId === entry.candidateId)
    return {
      userId: options.userId,
      orgId: options.userId,
      jobId: options.jobId,
      name: entry.name,
      email: source?.email ?? '',
      resumeExcerpt: applyGuardrails((source?.resumeText ?? '').slice(0, 500)).sanitizedText,
      matchScore: entry.score,
      rank: entry.rank,
      createdAt: new Date(),
    }
  })

  if (records.length > 0) {
    await collection.insertMany(records)
  }

  return records
}

export interface GenerateInterviewQuestionsOptions {
  jobDescription: string
  resumeExcerpt: string
  questionCount?: number
}

export async function generateInterviewQuestions(
  options: GenerateInterviewQuestionsOptions,
): Promise<string[]> {
  const count = options.questionCount ?? 5
  const { text } = await generateText({
    messages: [
      {
        role: 'system',
        content: `Write ${count} personalized interview questions as a JSON array of strings only, tailored to gaps and strengths between the resume and job description.`,
      },
      {
        role: 'user',
        content: `Job description: ${options.jobDescription}\n\nCandidate resume: ${options.resumeExcerpt}`,
      },
    ],
    task: 'hr-interview-questions',
    maxTokens: 500,
  })

  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string').slice(0, count)
    }
  } catch {
    return text
      .split('\n')
      .map((line) => line.replace(/^[-*\d.)\s]+/, '').trim())
      .filter(Boolean)
      .slice(0, count)
  }

  return text
    .split('\n')
    .map((line) => line.replace(/^[-*\d.)\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, count)
}

export interface GenerateOfferLetterOptions {
  candidateName: string
  role: string
  salary: number
  currency?: string
  salaryPeriod?: string
  startDate: string
  company: string
}

export async function generateOfferLetter(options: GenerateOfferLetterOptions): Promise<string> {
  const formattedStartDate = new Date(options.startDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const formattedSalary = `${options.currency ?? '$'}${options.salary.toLocaleString('en-US')} ${options.salaryPeriod ?? 'per year'}`

  const { text } = await generateText({
    messages: [
      {
        role: 'system',
        content:
          'You write formal, warm offer letters with clear compensation and start-date details. ' +
          'Output the complete letter with no placeholders, brackets, or template variables of any kind (e.g. never write things like [Date], [Company Letterhead], [Your Name]) — ' +
          'use only the exact values given to you. Always end with a full closing: a sign-off line, a signature block naming the company, and an acceptance line for the candidate to sign and date. ' +
          'Never truncate — finish every sentence and the entire letter.',
      },
      {
        role: 'user',
        content: [
          `Write a complete, ready-to-send offer letter with these exact details:`,
          `Company: ${options.company}`,
          `Candidate: ${options.candidateName}`,
          `Role: ${options.role}`,
          `Compensation: ${formattedSalary}`,
          `Start date: ${formattedStartDate}`,
          `Today's date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
        ].join('\n'),
      },
    ],
    task: 'hr-offer-letter',
    maxTokens: 1200,
  })
  return text.trim()
}

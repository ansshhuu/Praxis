import { applyGuardrails } from '@/lib/ai/guardrails'
import { generateText } from '@/lib/ai/llm-gateway'
import {
  getCrmLeadsCollection,
  type CrmLead,
  type QualificationBand,
} from '@/lib/models/mongodb/crm-leads'

const BUDGET_TARGET = 50000
const MAX_BUDGET_SCORE = 40
const MAX_URGENCY_SCORE = 30
const MAX_FIT_SCORE = 30

const FIT_KEYWORDS = [
  'enterprise',
  'decision maker',
  'budget approved',
  'urgent',
  'replace',
  'scale',
  'integration',
  'compliance',
  'automation',
  'growth',
]

export interface QualificationInput {
  budget: number
  timelineDays: number
  fitNotes: string
}

export interface QualificationResult {
  budgetScore: number
  urgencyScore: number
  fitScore: number
  totalScore: number
  band: QualificationBand
}

function scoreBudget(budget: number): number {
  if (!Number.isFinite(budget) || budget <= 0) return 0
  return Math.round(Math.min(budget / BUDGET_TARGET, 1) * MAX_BUDGET_SCORE)
}

function scoreUrgency(timelineDays: number): number {
  if (!Number.isFinite(timelineDays) || timelineDays <= 0) return MAX_URGENCY_SCORE
  if (timelineDays <= 7) return MAX_URGENCY_SCORE
  if (timelineDays <= 30) return 20
  if (timelineDays <= 90) return 10
  return 5
}

function scoreFit(fitNotes: string): number {
  const text = fitNotes.toLowerCase()
  const matches = FIT_KEYWORDS.filter((keyword) => text.includes(keyword)).length
  return Math.round(Math.min(matches / FIT_KEYWORDS.length, 1) * MAX_FIT_SCORE)
}

function bandFor(totalScore: number): QualificationBand {
  if (totalScore >= 75) return 'hot'
  if (totalScore >= 45) return 'warm'
  return 'cold'
}

export function calculateQualificationScore(input: QualificationInput): QualificationResult {
  const budgetScore = scoreBudget(input.budget)
  const urgencyScore = scoreUrgency(input.timelineDays)
  const fitScore = scoreFit(input.fitNotes)
  const totalScore = Math.min(budgetScore + urgencyScore + fitScore, 100)
  return { budgetScore, urgencyScore, fitScore, totalScore, band: bandFor(totalScore) }
}

export interface IngestLeadInput {
  userId: string
  name: string
  email: string
  company: string
  budget: number
  timelineDays: number
  fitNotes: string
  source: string
}

export async function ingestLead(input: IngestLeadInput): Promise<CrmLead> {
  const qualification = calculateQualificationScore(input)
  const collection = await getCrmLeadsCollection()

  const lead: CrmLead = {
    userId: input.userId,
    orgId: input.userId,
    name: input.name,
    email: input.email,
    company: input.company,
    budget: input.budget,
    timelineDays: input.timelineDays,
    fitNotes: applyGuardrails(input.fitNotes).sanitizedText,
    source: input.source,
    qualificationScore: qualification.totalScore,
    qualificationBand: qualification.band,
    status: 'new',
    createdAt: new Date(),
  }

  const result = await collection.insertOne(lead)
  return { ...lead, _id: result.insertedId }
}

export interface GenerateProposalOptions {
  leadName: string
  company: string
  requirements: string
  budget: number
}

export async function generateProposal(options: GenerateProposalOptions): Promise<string> {
  const { text } = await generateText({
    messages: [
      {
        role: 'system',
        content:
          'You are a sales engineer drafting a concise, persuasive business proposal. Use clear sections: Overview, Scope, Timeline, Investment, Next Steps.',
      },
      {
        role: 'user',
        content: `Prepare a proposal for ${options.leadName} at ${options.company}. Budget: $${options.budget}. Requirements: ${options.requirements}`,
      },
    ],
    task: 'crm-proposal',
    maxTokens: 2000,
  })
  return text
}

export interface FollowUpPlan {
  nextFollowUpAt: Date
  priority: 'high' | 'medium' | 'low'
}

export function planFollowUp(band: QualificationBand, lastContactedAt: Date): FollowUpPlan {
  const days = band === 'hot' ? 1 : band === 'warm' ? 3 : 7
  const priority = band === 'hot' ? 'high' : band === 'warm' ? 'medium' : 'low'
  const nextFollowUpAt = new Date(lastContactedAt.getTime() + days * 24 * 60 * 60 * 1000)
  return { nextFollowUpAt, priority }
}

export async function draftFollowUpMessage(leadName: string, context: string): Promise<string> {
  const { text } = await generateText({
    messages: [
      { role: 'system', content: 'You write brief, friendly sales follow-up emails, under 120 words.' },
      { role: 'user', content: `Draft a follow-up email to ${leadName}. Context: ${context}` },
    ],
    task: 'crm-follow-up',
    maxTokens: 300,
  })
  return text
}

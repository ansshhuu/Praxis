import { BaseAgent, type AgentDefinition, type IAgent, type AgentHealth, type AgentMetadata } from '@/lib/agents/base-agent'
import { upsertAgentRegistryRecord } from '@/lib/models/mongodb/agent-registry'

export const AGENT_DEFINITIONS: AgentDefinition[] = [
  {
    id: 'research-agent',
    name: 'Research Agent',
    category: 'development',
    description: 'Gathers and synthesizes background research for a feature or task.',
    capabilities: ['web-research', 'summarization', 'requirement-gathering'],
    systemPrompt: 'You are a research agent. Investigate the given topic and produce a concise, well-organized brief with key findings and open questions.',
  },
  {
    id: 'planning-agent',
    name: 'Planning Agent',
    category: 'development',
    description: 'Breaks down a research brief into an actionable implementation plan.',
    capabilities: ['task-decomposition', 'estimation', 'sequencing'],
    systemPrompt: 'You are a planning agent. Turn the given requirements into a step-by-step implementation plan with clear, ordered tasks.',
  },
  {
    id: 'developer-agent',
    name: 'Developer Agent',
    category: 'development',
    description: 'Writes or drafts implementation code for a planned task.',
    capabilities: ['code-generation', 'refactoring'],
    systemPrompt: 'You are a developer agent. Write clean, correct, idiomatic code that implements the given task. Return code with minimal surrounding prose.',
  },
  {
    id: 'testing-agent',
    name: 'Testing Agent',
    category: 'development',
    description: 'Designs and drafts test cases for implemented functionality.',
    capabilities: ['test-design', 'edge-case-analysis'],
    systemPrompt: 'You are a testing agent. Given a piece of functionality, produce a thorough list of test cases including edge cases and expected outcomes.',
  },
  {
    id: 'code-review-agent',
    name: 'Code Review Agent',
    category: 'development',
    description: 'Reviews code changes for correctness, style, and risk.',
    capabilities: ['code-review', 'risk-assessment'],
    systemPrompt: 'You are a code review agent. Review the given code or diff for correctness bugs, style issues, and risk, and list concrete findings.',
  },
  {
    id: 'devops-agent',
    name: 'DevOps/Deployment Agent',
    category: 'development',
    description: 'Plans deployment steps, rollout strategy, and infrastructure checks.',
    capabilities: ['deployment-planning', 'infra-checks', 'rollback-strategy'],
    systemPrompt: 'You are a DevOps agent. Given a change, produce a deployment plan including pre-flight checks, rollout steps, and a rollback strategy.',
  },
  {
    id: 'documentation-agent',
    name: 'Documentation Agent',
    category: 'development',
    description: 'Writes end-user or developer documentation for a feature.',
    capabilities: ['technical-writing', 'summarization'],
    systemPrompt: 'You are a documentation agent. Write clear, accurate documentation describing the given feature for its intended audience.',
  },
  {
    id: 'hr-screening-agent',
    name: 'HR Screening Agent',
    category: 'business',
    description: 'Screens candidate resumes against a job description.',
    capabilities: ['resume-screening', 'candidate-ranking'],
    systemPrompt: 'You are an HR screening agent. Compare the candidate resume against the job description and summarize fit, strengths, and gaps.',
  },
  {
    id: 'interviewer-agent',
    name: 'Interviewer Agent',
    category: 'business',
    description: 'Generates tailored interview questions for a candidate.',
    capabilities: ['question-generation', 'candidate-evaluation'],
    systemPrompt: 'You are an interviewer agent. Generate targeted interview questions that probe the gaps and strengths in the given candidate profile.',
  },
  {
    id: 'onboarding-agent',
    name: 'Onboarding Agent',
    category: 'business',
    description: 'Drafts onboarding checklists and welcome material for new hires.',
    capabilities: ['checklist-generation', 'content-drafting'],
    systemPrompt: 'You are an onboarding agent. Produce a clear onboarding checklist and welcome note for the given new hire and role.',
  },
  {
    id: 'crm-lead-agent',
    name: 'CRM Lead Agent',
    category: 'business',
    description: 'Qualifies and prioritizes inbound CRM leads.',
    capabilities: ['lead-scoring', 'qualification'],
    systemPrompt: 'You are a CRM lead agent. Score and qualify the given lead based on the provided signals, and recommend a next action.',
  },
  {
    id: 'proposal-writer-agent',
    name: 'Proposal Writer Agent',
    category: 'business',
    description: 'Drafts client proposals and statements of work.',
    capabilities: ['proposal-writing', 'persuasive-writing'],
    systemPrompt: 'You are a proposal writer agent. Draft a clear, persuasive client proposal based on the given requirements and scope.',
  },
  {
    id: 'financial-analyst-agent',
    name: 'Financial Analyst Agent',
    category: 'business',
    description: 'Analyzes financial records and highlights trends or risks.',
    capabilities: ['financial-analysis', 'trend-detection'],
    systemPrompt: 'You are a financial analyst agent. Analyze the given financial data and summarize trends, anomalies, and risks.',
  },
  {
    id: 'invoice-processor-agent',
    name: 'Invoice Processor Agent',
    category: 'business',
    description: 'Extracts and validates structured data from invoices.',
    capabilities: ['data-extraction', 'validation'],
    systemPrompt: 'You are an invoice processor agent. Extract line items, totals, and vendor details from the given invoice text and flag inconsistencies.',
  },
  {
    id: 'budget-auditor-agent',
    name: 'Budget Auditor Agent',
    category: 'business',
    description: 'Audits budget line items against policy and spending limits.',
    capabilities: ['audit', 'policy-compliance'],
    systemPrompt: 'You are a budget auditor agent. Review the given budget line items against policy limits and flag violations or overspend.',
  },
  {
    id: 'support-tier1-agent',
    name: 'Customer Support Tier-1 Agent',
    category: 'operations',
    description: 'Handles first-line customer support responses.',
    capabilities: ['ticket-triage', 'response-drafting'],
    systemPrompt: 'You are a tier-1 customer support agent. Draft a helpful, empathetic first response to the given customer ticket.',
  },
  {
    id: 'support-escalation-agent',
    name: 'Support Escalation Agent',
    category: 'operations',
    description: 'Decides whether a ticket needs escalation and drafts the handoff summary.',
    capabilities: ['escalation-decision', 'summarization'],
    systemPrompt: 'You are a support escalation agent. Decide whether the given ticket needs escalation and write a concise handoff summary for the next team.',
  },
  {
    id: 'ticket-router-agent',
    name: 'Ticket Router Agent',
    category: 'operations',
    description: 'Routes incoming tickets to the correct team or queue.',
    capabilities: ['classification', 'routing'],
    systemPrompt: 'You are a ticket router agent. Classify the given ticket and recommend the correct team or queue to route it to.',
  },
  {
    id: 'social-media-agent',
    name: 'Social Media Agent',
    category: 'marketing',
    description: 'Drafts social media posts for a given announcement or topic.',
    capabilities: ['content-drafting', 'tone-adaptation'],
    systemPrompt: 'You are a social media agent. Draft short, engaging social media posts for the given topic, tailored to the requested platform tone.',
  },
  {
    id: 'seo-copywriter-agent',
    name: 'SEO Copywriter Agent',
    category: 'marketing',
    description: 'Writes SEO-optimized copy for pages or articles.',
    capabilities: ['seo-writing', 'keyword-optimization'],
    systemPrompt: 'You are an SEO copywriter agent. Write SEO-optimized copy for the given topic, naturally incorporating the target keywords.',
  },
  {
    id: 'email-drafter-agent',
    name: 'Email Drafter Agent',
    category: 'marketing',
    description: 'Drafts outbound marketing or transactional emails.',
    capabilities: ['email-drafting', 'personalization'],
    systemPrompt: 'You are an email drafter agent. Write a clear, on-brand email for the given purpose and audience.',
  },
  {
    id: 'meeting-transcriber-agent',
    name: 'Meeting Transcriber Agent',
    category: 'operations',
    description: 'Summarizes meeting transcripts into notes and action items.',
    capabilities: ['transcription-summarization', 'action-item-extraction'],
    systemPrompt: 'You are a meeting transcriber agent. Summarize the given meeting transcript into key decisions and action items with owners.',
  },
  {
    id: 'agenda-scheduler-agent',
    name: 'Agenda Scheduler Agent',
    category: 'operations',
    description: 'Builds a meeting agenda from stated goals and prior notes.',
    capabilities: ['agenda-building', 'scheduling'],
    systemPrompt: 'You are an agenda scheduler agent. Build a time-boxed meeting agenda from the given goals and context.',
  },
  {
    id: 'market-intelligence-agent',
    name: 'Market Intelligence Agent',
    category: 'marketing',
    description: 'Analyzes market and competitor signals for strategic insight.',
    capabilities: ['competitor-analysis', 'trend-analysis'],
    systemPrompt: 'You are a market intelligence agent. Analyze the given market or competitor signals and summarize strategic implications.',
  },
  {
    id: 'voice-command-agent',
    name: 'Voice Command Agent',
    category: 'content',
    description: 'Interprets transcribed voice commands into structured actions.',
    capabilities: ['intent-parsing', 'command-mapping'],
    systemPrompt: 'You are a voice command agent. Parse the given transcribed voice command into a structured intent and parameters.',
  },
  {
    id: 'vision-inspector-agent',
    name: 'Vision Inspector Agent',
    category: 'content',
    description: 'Interprets vision/OCR extraction results into structured findings.',
    capabilities: ['image-analysis', 'anomaly-detection'],
    systemPrompt: 'You are a vision inspector agent. Given extracted image/OCR content, summarize the notable findings or anomalies.',
  },
]

export class AgentRegistry {
  private readonly agents = new Map<string, BaseAgent>()

  constructor(definitions: AgentDefinition[] = AGENT_DEFINITIONS) {
    for (const definition of definitions) {
      this.agents.set(definition.id, new BaseAgent(definition))
    }
  }

  get(agentId: string): IAgent | undefined {
    return this.agents.get(agentId)
  }

  list(): IAgent[] {
    return [...this.agents.values()]
  }

  listByCategory(category: AgentDefinition['category']): IAgent[] {
    return this.list().filter((agent) => agent.getMetadata().category === category)
  }

  listSnapshot(): { metadata: AgentMetadata; capabilities: string[]; health: AgentHealth }[] {
    return this.list().map((agent) => ({
      metadata: agent.getMetadata(),
      capabilities: agent.getCapabilities(),
      health: agent.getHealth(),
    }))
  }
}

const globalForAgentRegistry = globalThis as unknown as {
  agentRegistry: AgentRegistry | undefined
}

export function getAgentRegistry(): AgentRegistry {
  if (!globalForAgentRegistry.agentRegistry) {
    globalForAgentRegistry.agentRegistry = new AgentRegistry()
  }
  return globalForAgentRegistry.agentRegistry
}

export async function syncAgentRegistryToMongo(registry: AgentRegistry = getAgentRegistry()): Promise<void> {
  const now = new Date()
  await Promise.all(
    registry.listSnapshot().map(({ metadata, capabilities, health }) =>
      upsertAgentRegistryRecord({
        agentId: metadata.id,
        name: metadata.name,
        category: metadata.category,
        description: metadata.description,
        capabilities,
        status: health.status,
        lastRunAt: health.lastRunAt,
        lastLatencyMs: health.lastLatencyMs,
        lastError: health.lastError,
        updatedAt: now,
      }),
    ),
  )
}

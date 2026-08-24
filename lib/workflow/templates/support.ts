import { buildCategoryTemplates, type ScenarioMeta, type WorkflowTemplate } from '@/lib/workflow/templates/builder'

const SCENARIOS: ScenarioMeta[] = [
  { slug: 'ticket-triage', name: 'Ticket Triage', description: 'Triage a newly submitted support ticket.', tags: ['triage'] },
  { slug: 'sla-escalation', name: 'SLA Escalation', description: 'Escalate a ticket that is close to breaching SLA.', tags: ['sla', 'escalation'] },
  { slug: 'customer-satisfaction-survey', name: 'Customer Satisfaction Survey', description: 'Send a satisfaction survey after ticket resolution.', tags: ['survey'] },
  { slug: 'refund-request-review', name: 'Refund Request Review', description: 'Review a customer refund request.', tags: ['billing'] },
  { slug: 'bug-report-routing', name: 'Bug Report Routing', description: 'Route a bug report to the correct engineering team.', tags: ['bug', 'routing'] },
  { slug: 'kb-suggestion', name: 'Knowledge Base Suggestion', description: 'Suggest a knowledge base article for a repeated question.', tags: ['knowledge-base'] },
  { slug: 'chatbot-handoff-to-human', name: 'Chatbot Handoff to Human', description: 'Hand off a chatbot conversation to a human agent.', tags: ['chatbot', 'handoff'] },
  { slug: 'vip-customer-escalation', name: 'VIP Customer Escalation', description: 'Escalate a ticket from a VIP customer account.', tags: ['vip', 'escalation'] },
  { slug: 'outage-status-update', name: 'Outage Status Update', description: 'Post a status update during a service outage.', tags: ['outage'] },
  { slug: 'feature-request-logging', name: 'Feature Request Logging', description: 'Log a customer feature request for product review.', tags: ['product'] },
  { slug: 'support-ticket-reopening', name: 'Support Ticket Reopening', description: 'Handle a customer reopening a resolved ticket.', tags: ['reopen'] },
  { slug: 'multi-language-ticket-routing', name: 'Multi-language Ticket Routing', description: 'Route a ticket to an agent fluent in the customer’s language.', tags: ['routing', 'localization'] },
  { slug: 'churn-risk-ticket-flagging', name: 'Churn-Risk Ticket Flagging', description: 'Flag a support ticket that signals churn risk.', tags: ['churn'] },
  { slug: 'support-macro-suggestion', name: 'Support Macro Suggestion', description: 'Suggest a canned response macro for a common ticket type.', tags: ['macro'] },
  { slug: 'customer-onboarding-followup', name: 'Customer Onboarding Follow-up', description: 'Follow up with a customer during onboarding.', tags: ['onboarding'] },
  { slug: 'warranty-claim-processing', name: 'Warranty Claim Processing', description: 'Process a submitted warranty claim.', tags: ['warranty'] },
  { slug: 'support-workload-balancing', name: 'Support Team Workload Balancing', description: 'Rebalance ticket load across support agents.', tags: ['workload'] },
]

export const SUPPORT_WORKFLOW_TEMPLATES: WorkflowTemplate[] = buildCategoryTemplates('Support', SCENARIOS)

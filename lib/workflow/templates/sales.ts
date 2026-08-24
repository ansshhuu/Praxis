import { buildCategoryTemplates, type ScenarioMeta, type WorkflowTemplate } from '@/lib/workflow/templates/builder'

const SCENARIOS: ScenarioMeta[] = [
  { slug: 'lead-qualification', name: 'Lead Qualification', description: 'Score and qualify a newly captured inbound lead.', tags: ['crm', 'lead'] },
  { slug: 'deal-stage-update', name: 'Deal Stage Update', description: 'Advance a deal to the next pipeline stage.', tags: ['crm', 'pipeline'] },
  { slug: 'proposal-generation', name: 'Proposal Generation', description: 'Generate a client proposal from deal details.', tags: ['proposal'] },
  { slug: 'contract-renewal-reminder', name: 'Contract Renewal Reminder', description: 'Remind an account owner ahead of a contract renewal.', tags: ['renewal'] },
  { slug: 'quote-approval', name: 'Quote Approval', description: 'Route a discounted quote through approval.', tags: ['pricing', 'approval'] },
  { slug: 'sales-territory-assignment', name: 'Sales Territory Assignment', description: 'Assign a new account to the correct sales territory.', tags: ['territory'] },
  { slug: 'pipeline-forecast-review', name: 'Pipeline Forecast Review', description: 'Review the quarterly pipeline forecast.', tags: ['forecast'] },
  { slug: 'customer-churn-risk-alert', name: 'Customer Churn Risk Alert', description: 'Flag an account showing churn risk signals.', tags: ['churn', 'risk'] },
  { slug: 'upsell-opportunity-detection', name: 'Upsell Opportunity Detection', description: 'Detect an upsell opportunity from usage data.', tags: ['upsell'] },
  { slug: 'sales-commission-calculation', name: 'Sales Commission Calculation', description: 'Calculate commission for a closed deal.', tags: ['commission'] },
  { slug: 'discount-approval-workflow', name: 'Discount Approval Workflow', description: 'Approve a non-standard discount request.', tags: ['pricing', 'approval'] },
  { slug: 'competitor-win-loss-analysis', name: 'Competitor Win-Loss Analysis', description: 'Analyze a deal’s win-loss reasons against competitors.', tags: ['analysis'] },
  { slug: 'sales-demo-scheduling', name: 'Sales Demo Scheduling', description: 'Schedule a product demo with a prospect.', tags: ['scheduling'] },
  { slug: 'account-handoff-to-success', name: 'Account Handoff to Success', description: 'Hand off a closed-won account to customer success.', tags: ['handoff'] },
  { slug: 'referral-partner-onboarding', name: 'Referral Partner Onboarding', description: 'Onboard a new referral partner.', tags: ['partner'] },
  { slug: 'order-fulfillment-trigger', name: 'Order Fulfillment Trigger', description: 'Trigger order fulfillment after a deal closes.', tags: ['fulfillment'] },
  { slug: 'sales-rep-performance-review', name: 'Sales Rep Performance Review', description: 'Review a sales rep’s quarterly performance.', tags: ['performance'] },
]

export const SALES_WORKFLOW_TEMPLATES: WorkflowTemplate[] = buildCategoryTemplates('Sales', SCENARIOS)

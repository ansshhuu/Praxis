import { buildCategoryTemplates, type ScenarioMeta, type WorkflowTemplate } from '@/lib/workflow/templates/builder'

const SCENARIOS: ScenarioMeta[] = [
  { slug: 'campaign-launch-approval', name: 'Campaign Launch Approval', description: 'Approve a marketing campaign before launch.', tags: ['campaign', 'approval'] },
  { slug: 'social-post-scheduling', name: 'Social Post Scheduling', description: 'Schedule a batch of social media posts.', tags: ['social'] },
  { slug: 'email-newsletter-draft', name: 'Email Newsletter Draft', description: 'Draft the weekly email newsletter.', tags: ['email'] },
  { slug: 'seo-content-audit', name: 'SEO Content Audit', description: 'Audit a page’s content for SEO improvements.', tags: ['seo'] },
  { slug: 'ad-spend-budget-alert', name: 'Ad Spend Budget Alert', description: 'Alert when ad spend nears the monthly budget.', tags: ['budget', 'ads'] },
  { slug: 'influencer-outreach', name: 'Influencer Outreach', description: 'Draft outreach for a potential influencer partner.', tags: ['outreach'] },
  { slug: 'lead-magnet-followup', name: 'Lead Magnet Follow-up', description: 'Follow up with a lead who downloaded a lead magnet.', tags: ['lead-nurture'] },
  { slug: 'event-registration-reminder', name: 'Event Registration Reminder', description: 'Remind registrants ahead of an upcoming event.', tags: ['events'] },
  { slug: 'brand-mention-monitoring', name: 'Brand Mention Monitoring', description: 'Monitor and triage new brand mentions.', tags: ['monitoring'] },
  { slug: 'ab-test-result-analysis', name: 'A/B Test Result Analysis', description: 'Analyze the results of a completed A/B test.', tags: ['experimentation'] },
  { slug: 'content-calendar-sync', name: 'Content Calendar Sync', description: 'Sync the content calendar across teams.', tags: ['content'] },
  { slug: 'webinar-followup-sequence', name: 'Webinar Follow-up Sequence', description: 'Send a follow-up sequence after a webinar.', tags: ['webinar'] },
  { slug: 'customer-persona-refresh', name: 'Customer Persona Refresh', description: 'Refresh a customer persona from recent survey data.', tags: ['research'] },
  { slug: 'press-release-distribution', name: 'Press Release Distribution', description: 'Distribute a press release to media contacts.', tags: ['pr'] },
  { slug: 'landing-page-optimization', name: 'Landing Page Optimization', description: 'Optimize a landing page for conversion.', tags: ['conversion'] },
  { slug: 'product-launch-announcement', name: 'Product Launch Announcement', description: 'Coordinate a product launch announcement.', tags: ['launch'] },
  { slug: 'marketing-attribution-report', name: 'Marketing Attribution Report', description: 'Compile a multi-channel attribution report.', tags: ['reporting'] },
]

export const MARKETING_WORKFLOW_TEMPLATES: WorkflowTemplate[] = buildCategoryTemplates('Marketing', SCENARIOS)

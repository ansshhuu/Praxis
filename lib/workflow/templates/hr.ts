import { buildCategoryTemplates, type ScenarioMeta, type WorkflowTemplate } from '@/lib/workflow/templates/builder'

const SCENARIOS: ScenarioMeta[] = [
  { slug: 'candidate-screening', name: 'Candidate Screening', description: 'Screen an inbound resume against the open job description.', tags: ['recruiting', 'resume'] },
  { slug: 'interview-scheduling', name: 'Interview Scheduling', description: 'Coordinate interview slots between a candidate and the panel.', tags: ['recruiting', 'scheduling'] },
  { slug: 'offer-letter-generation', name: 'Offer Letter Generation', description: 'Draft and route an offer letter for approval.', tags: ['recruiting', 'offer'] },
  { slug: 'new-hire-onboarding', name: 'New Hire Onboarding', description: 'Kick off the onboarding checklist for a new hire.', tags: ['onboarding'] },
  { slug: 'background-check-verification', name: 'Background Check Verification', description: 'Verify a background check result before start date.', tags: ['compliance', 'recruiting'] },
  { slug: 'employee-exit-interview', name: 'Employee Exit Interview', description: 'Collect and summarize exit interview feedback.', tags: ['offboarding'] },
  { slug: 'performance-review-cycle', name: 'Performance Review Cycle', description: 'Kick off a quarterly performance review cycle.', tags: ['performance'] },
  { slug: 'benefits-enrollment', name: 'Benefits Enrollment', description: 'Guide a new hire through benefits enrollment.', tags: ['benefits', 'onboarding'] },
  { slug: 'payroll-discrepancy-review', name: 'Payroll Discrepancy Review', description: 'Review a reported payroll discrepancy.', tags: ['payroll'] },
  { slug: 'leave-request-approval', name: 'Leave Request Approval', description: 'Route a leave request through manager approval.', tags: ['leave', 'approval'] },
  { slug: 'employee-referral-processing', name: 'Employee Referral Processing', description: 'Process an internal employee referral submission.', tags: ['recruiting', 'referral'] },
  { slug: 'diversity-hiring-report', name: 'Diversity Hiring Report', description: 'Compile a diversity metrics report for the hiring pipeline.', tags: ['reporting', 'recruiting'] },
  { slug: 'training-completion-tracking', name: 'Training Completion Tracking', description: 'Track mandatory training completion for staff.', tags: ['training', 'compliance'] },
  { slug: 'policy-acknowledgment', name: 'Policy Acknowledgment', description: 'Collect employee acknowledgment of an updated policy.', tags: ['compliance'] },
  { slug: 'compensation-benchmarking', name: 'Compensation Benchmarking', description: 'Benchmark a role’s compensation against market data.', tags: ['compensation'] },
  { slug: 'internal-transfer-request', name: 'Internal Transfer Request', description: 'Process an employee’s internal transfer request.', tags: ['mobility'] },
  { slug: 'employee-satisfaction-survey', name: 'Employee Satisfaction Survey', description: 'Distribute and summarize an employee satisfaction survey.', tags: ['engagement', 'survey'] },
]

export const HR_WORKFLOW_TEMPLATES: WorkflowTemplate[] = buildCategoryTemplates('HR', SCENARIOS)

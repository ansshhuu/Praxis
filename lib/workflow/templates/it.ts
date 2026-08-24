import { buildCategoryTemplates, type ScenarioMeta, type WorkflowTemplate } from '@/lib/workflow/templates/builder'

const SCENARIOS: ScenarioMeta[] = [
  { slug: 'password-reset-request', name: 'Password Reset Request', description: 'Process a self-service password reset request.', tags: ['helpdesk', 'security'] },
  { slug: 'equipment-provisioning', name: 'New Employee Equipment Provisioning', description: 'Provision laptop and accounts for a new employee.', tags: ['provisioning', 'onboarding'] },
  { slug: 'access-request-approval', name: 'Access Request Approval', description: 'Approve a request for elevated system access.', tags: ['access', 'approval'] },
  { slug: 'software-license-renewal', name: 'Software License Renewal', description: 'Renew an expiring software license.', tags: ['licensing'] },
  { slug: 'incident-triage', name: 'Incident Triage', description: 'Triage a newly reported IT incident.', tags: ['incident'] },
  { slug: 'change-request-review', name: 'Change Request Review', description: 'Review a proposed infrastructure change request.', tags: ['change-management'] },
  { slug: 'backup-verification', name: 'Backup Verification', description: 'Verify the nightly backup completed successfully.', tags: ['backup'] },
  { slug: 'vulnerability-patch-rollout', name: 'Vulnerability Patch Rollout', description: 'Roll out a security patch across affected systems.', tags: ['security', 'patching'] },
  { slug: 'vpn-access-provisioning', name: 'VPN Access Provisioning', description: 'Provision VPN access for a remote employee.', tags: ['access', 'remote'] },
  { slug: 'asset-decommissioning', name: 'Asset Decommissioning', description: 'Decommission a retired hardware asset.', tags: ['asset'] },
  { slug: 'service-desk-ticket-escalation', name: 'Service Desk Ticket Escalation', description: 'Escalate a stalled service desk ticket.', tags: ['helpdesk', 'escalation'] },
  { slug: 'system-health-check', name: 'System Health Check', description: 'Run a scheduled system health check.', tags: ['monitoring'] },
  { slug: 'data-retention-policy-enforcement', name: 'Data Retention Policy Enforcement', description: 'Enforce data retention policy on stale records.', tags: ['compliance', 'data'] },
  { slug: 'offboarding-it-cleanup', name: 'Employee Offboarding IT Cleanup', description: 'Revoke access and reclaim assets for a departing employee.', tags: ['offboarding'] },
  { slug: 'cloud-cost-anomaly-alert', name: 'Cloud Cost Anomaly Alert', description: 'Alert on an unexpected cloud spend anomaly.', tags: ['finops', 'cloud'] },
  { slug: 'sla-breach-notification', name: 'SLA Breach Notification', description: 'Notify stakeholders of an SLA breach.', tags: ['sla'] },
  { slug: 'helpdesk-kb-update', name: 'Helpdesk Knowledge Base Update', description: 'Draft a knowledge base article from a resolved ticket.', tags: ['knowledge-base'] },
]

export const IT_WORKFLOW_TEMPLATES: WorkflowTemplate[] = buildCategoryTemplates('IT', SCENARIOS)

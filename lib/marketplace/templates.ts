export type TemplateCategory =
  | 'Finance'
  | 'HR'
  | 'Sales'
  | 'Operations'
  | 'Communication'
  | 'Compliance'

export type TemplateWorkflowJson = {
  nodes: {
    id: string
    type: 'workflow'
    position: { x: number; y: number }
    data: { typeKey: string; label: string; config: Record<string, string> }
  }[]
  edges: {
    id: string
    source: string
    target: string
    type: string
    markerEnd: { type: string; width: number; height: number }
    style: { strokeWidth: number; stroke: string }
  }[]
}

export type SeedTemplate = {
  name: string
  description: string
  category: TemplateCategory
  icon: string
  usageCount: number
  rating: number
  workflowJson: TemplateWorkflowJson
}

type Step = { typeKey: string; label: string; config: Record<string, string> }

function chain(steps: Step[]): TemplateWorkflowJson {
  const nodes: TemplateWorkflowJson['nodes'] = steps.map((step, index) => ({
    id: `n${index + 1}`,
    type: 'workflow',
    position: { x: index * 290, y: 170 },
    data: { typeKey: step.typeKey, label: step.label, config: step.config },
  }))

  const edges: TemplateWorkflowJson['edges'] = steps.slice(1).map((_, index) => ({
    id: `e${index + 1}`,
    source: `n${index + 1}`,
    target: `n${index + 2}`,
    type: 'default',
    markerEnd: { type: 'arrowclosed', width: 18, height: 18 },
    style: { strokeWidth: 2, stroke: '#94a3b8' },
  }))

  return { nodes, edges }
}

const emailTrigger = (mailbox: string): Step => ({
  typeKey: 'email-trigger',
  label: 'Email Trigger',
  config: { mailbox, folder: 'Inbox' },
})

const webhookTrigger = (path: string): Step => ({
  typeKey: 'webhook-trigger',
  label: 'Webhook Trigger',
  config: { endpointUrl: `https://api.eawmp.io/hooks/${path}`, method: 'POST' },
})

const scheduleTrigger = (frequency: string, runAt: string): Step => ({
  typeKey: 'schedule-trigger',
  label: 'Schedule Trigger',
  config: { frequency, runAt },
})

const saveDb = (table: string, fieldMapping: string): Step => ({
  typeKey: 'save-db',
  label: 'Save to DB',
  config: { table, fieldMapping },
})

const emailAction = (to: string, subject: string, body: string): Step => ({
  typeKey: 'email-action',
  label: 'Email Action',
  config: { to, subject, body },
})

const generateReport = (template: string, format: string): Step => ({
  typeKey: 'generate-report',
  label: 'Generate Report',
  config: { template, format },
})

const notify = (channel: string, message: string): Step => ({
  typeKey: 'notify',
  label: 'Notify',
  config: { channel, message },
})

export const SEED_TEMPLATES: SeedTemplate[] = [
  {
    name: 'Invoice Processing',
    category: 'Finance',
    description:
      'Automatically extract, validate, and route invoices from email attachments. Integrates with QuickBooks and SAP.',
    icon: 'receipt',
    usageCount: 4820,
    rating: 4.8,
    workflowJson: chain([
      emailTrigger('invoices@eawmp.io'),
      saveDb('invoices', 'vendor -> invoices.vendor\namount -> invoices.total'),
      notify('#ops-alerts', 'Invoice from {{vendor}} recorded and queued for approval.'),
    ]),
  },
  {
    name: 'Resume Screening',
    category: 'HR',
    description:
      'AI-powered resume ranking against job descriptions. Scores candidates and generates interview questions automatically.',
    icon: 'file-user',
    usageCount: 3210,
    rating: 4.7,
    workflowJson: chain([
      webhookTrigger('resume_intake'),
      saveDb('customers', 'candidate -> customers.name\nrole -> customers.segment'),
      notify('In-app', 'New candidate {{candidate}} is ready for screening.'),
    ]),
  },
  {
    name: 'Leave Approval',
    category: 'HR',
    description:
      'Automated leave request workflow with manager approval chain, calendar sync, and balance tracking.',
    icon: 'calendar-check',
    usageCount: 2890,
    rating: 4.6,
    workflowJson: chain([
      webhookTrigger('leave_request'),
      emailAction(
        '{{manager.email}}',
        'Leave request awaiting your approval',
        'Hi {{manager.name}}, {{employee.name}} requested leave from {{start_date}} to {{end_date}}.',
      ),
      notify('In-app', 'Leave request from {{employee.name}} sent for approval.'),
    ]),
  },
  {
    name: 'Employee Onboarding',
    category: 'HR',
    description:
      'End-to-end new hire workflow: document collection, IT provisioning tasks, welcome emails, and training schedule.',
    icon: 'user-plus',
    usageCount: 1950,
    rating: 4.9,
    workflowJson: chain([
      webhookTrigger('new_hire'),
      emailAction(
        '{{employee.email}}',
        'Welcome to the team!',
        'Hi {{employee.name}}, here is everything you need for your first day.',
      ),
      notify('#ops-alerts', 'Onboarding started for {{employee.name}}.'),
    ]),
  },
  {
    name: 'Expense Approval',
    category: 'Finance',
    description:
      'Multi-level expense approval with receipt OCR, policy compliance checks, and automatic reimbursement triggering.',
    icon: 'credit-card',
    usageCount: 3670,
    rating: 4.5,
    workflowJson: chain([
      emailTrigger('expenses@eawmp.io'),
      saveDb('invoices', 'employee -> invoices.submitted_by\namount -> invoices.total'),
      notify('#ops-alerts', 'Expense claim of {{amount}} submitted by {{employee}}.'),
    ]),
  },
  {
    name: 'Email Automation',
    category: 'Communication',
    description:
      'AI-driven email response drafting, categorization, and routing. Supports Gmail, Outlook, and custom SMTP.',
    icon: 'mail',
    usageCount: 5130,
    rating: 4.7,
    workflowJson: chain([
      emailTrigger('support@eawmp.io'),
      emailAction(
        '{{customer.email}}',
        'We received your request',
        'Hi {{customer.name}}, thanks for reaching out — a specialist will reply shortly.',
      ),
      notify('#support', 'Auto-reply sent to {{customer.email}}.'),
    ]),
  },
  {
    name: 'Document Approval',
    category: 'Compliance',
    description:
      'Route documents through configurable approval chains with e-signature support, audit trail, and deadline reminders.',
    icon: 'file-check',
    usageCount: 2240,
    rating: 4.6,
    workflowJson: chain([
      webhookTrigger('document_submitted'),
      emailAction(
        '{{approver.email}}',
        'Document awaiting sign-off: {{document.name}}',
        'Hi {{approver.name}}, {{document.name}} needs your approval before {{deadline}}.',
      ),
      notify('In-app', '{{document.name}} routed for approval.'),
    ]),
  },
  {
    name: 'Attendance Reminder',
    category: 'Operations',
    description:
      'Automated daily attendance check with anomaly detection, manager alerts, and monthly attendance report generation.',
    icon: 'clock',
    usageCount: 1780,
    rating: 4.4,
    workflowJson: chain([
      scheduleTrigger('Daily', '09:30'),
      generateReport('Weekly Summary', 'PDF'),
      notify('#ops-alerts', 'Daily attendance summary is ready.'),
    ]),
  },
]

export const TEMPLATE_PRESENTATION: Record<
  string,
  { icon: string; usageCount: number; rating: number }
> = Object.fromEntries(
  SEED_TEMPLATES.map((t) => [
    t.name,
    { icon: t.icon, usageCount: t.usageCount, rating: t.rating },
  ]),
)

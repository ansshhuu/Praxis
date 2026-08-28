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
    sourceHandle?: string
    label?: string
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

type Placed = Step & { id: string; x: number; y: number }

type Link = { from: string; to: string; branch?: 'true' | 'false' }

const EDGE_NEUTRAL = '#94a3b8'
const EDGE_TRUE = '#16a34a'
const EDGE_FALSE = '#ea580c'

const COL = 300
const ROW_MAIN = 190
const ROW_TOP = 40
const ROW_BOTTOM = 340

function graph(placed: Placed[], links: Link[]): TemplateWorkflowJson {
  return {
    nodes: placed.map((node) => ({
      id: node.id,
      type: 'workflow',
      position: { x: node.x, y: node.y },
      data: { typeKey: node.typeKey, label: node.label, config: node.config },
    })),
    edges: links.map((link) => ({
      id: `e-${link.from}-${link.to}${link.branch ? `-${link.branch}` : ''}`,
      source: link.from,
      target: link.to,
      ...(link.branch ? { sourceHandle: link.branch, label: link.branch === 'true' ? 'Yes' : 'No' } : {}),
      type: 'default',
      markerEnd: { type: 'arrowclosed', width: 18, height: 18 },
      style: {
        strokeWidth: 2,
        stroke: link.branch === 'true' ? EDGE_TRUE : link.branch === 'false' ? EDGE_FALSE : EDGE_NEUTRAL,
      },
    })),
  }
}

const emailTrigger = (label: string, mailbox: string): Step => ({
  typeKey: 'email-trigger',
  label,
  config: { mailbox, folder: 'Inbox' },
})

const webhookTrigger = (label: string, path: string): Step => ({
  typeKey: 'webhook-trigger',
  label,
  config: { endpointUrl: `https://api.eawmp.io/hooks/${path}`, method: 'POST' },
})

const scheduleTrigger = (label: string, frequency: string, runAt: string): Step => ({
  typeKey: 'schedule-trigger',
  label,
  config: { frequency, runAt },
})

const aiClassify = (label: string, prompt: string, categories: string): Step => ({
  typeKey: 'ai-classify',
  label,
  config: { model: 'GPT-4o', prompt, categories },
})

const extractData = (label: string, schema: string): Step => ({
  typeKey: 'extract-data',
  label,
  config: { model: 'GPT-4o', schema },
})

const condition = (label: string, field: string, operator: string, value: string): Step => ({
  typeKey: 'condition',
  label,
  config: { field, operator, value },
})

const saveDb = (label: string, table: string, fieldMapping: string): Step => ({
  typeKey: 'save-db',
  label,
  config: { table, fieldMapping },
})

const emailAction = (label: string, subject: string, body: string): Step => ({
  typeKey: 'email-action',
  label,
  config: { to: '', subject, body },
})

const generateReport = (label: string, template: string, format: string): Step => ({
  typeKey: 'generate-report',
  label,
  config: { template, format },
})

const notify = (label: string, channel: string, message: string): Step => ({
  typeKey: 'notify',
  label,
  config: { channel, recipientEmail: '', message },
})

const apiCall = (label: string, method: string, url: string): Step => ({
  typeKey: 'api-call',
  label,
  config: { method, url, headers: '{\n  "Authorization": "Bearer •••"\n}' },
})

const loop = (label: string, collection: string, maxIterations: string): Step => ({
  typeKey: 'loop',
  label,
  config: { collection, maxIterations },
})

const delay = (label: string, duration: string, unit: string): Step => ({
  typeKey: 'delay',
  label,
  config: { duration, unit },
})

function at(id: string, x: number, y: number, step: Step): Placed {
  return { id, x, y, ...step }
}

export const SEED_TEMPLATES: SeedTemplate[] = [
  {
    name: 'Invoice Processing',
    category: 'Finance',
    description:
      'Classify inbound invoices, pull out the vendor and amount, then route anything above the approval threshold to a human while auto-filing the rest.',
    icon: 'receipt',
    usageCount: 4820,
    rating: 4.8,
    workflowJson: graph(
      [
        at('trigger', 0, ROW_MAIN, emailTrigger('New Invoice Email', 'invoices@eawmp.io')),
        at(
          'classify',
          COL,
          ROW_MAIN,
          aiClassify(
            'Classify Invoice',
            'Classify this invoice document into one of the given categories based on its line items and vendor.',
            'Goods, Services, Subscription, Utilities',
          ),
        ),
        at(
          'extract',
          COL * 2,
          ROW_MAIN,
          extractData(
            'Extract Vendor & Amount',
            '{\n  "vendor": "string",\n  "amount": "number",\n  "invoice_number": "string",\n  "due_date": "string"\n}',
          ),
        ),
        at(
          'threshold',
          COL * 3,
          ROW_MAIN,
          condition('Over Approval Limit?', '{{extracted.amount}}', 'greater than', '5000'),
        ),
        at(
          'approver',
          COL * 4,
          ROW_TOP,
          notify(
            'Request Approval',
            '#ops-alerts',
            'A high-value invoice needs manual approval before payment can be scheduled.',
          ),
        ),
        at(
          'autofile',
          COL * 4,
          ROW_BOTTOM,
          saveDb(
            'Auto-File Invoice',
            'invoices',
            'vendor -> invoices.vendor\namount -> invoices.total\ninvoice_number -> invoices.reference',
          ),
        ),
        at('report', COL * 5, ROW_MAIN, generateReport('Log to Ledger', 'Weekly Summary', 'PDF')),
      ],
      [
        { from: 'trigger', to: 'classify' },
        { from: 'classify', to: 'extract' },
        { from: 'extract', to: 'threshold' },
        { from: 'threshold', to: 'approver', branch: 'true' },
        { from: 'threshold', to: 'autofile', branch: 'false' },
        { from: 'approver', to: 'report' },
        { from: 'autofile', to: 'report' },
      ],
    ),
  },
  {
    name: 'Resume Screening',
    category: 'HR',
    description:
      'Parse an incoming resume, score it against the role, then shortlist strong matches for HR and send a courteous decline to the rest.',
    icon: 'file-user',
    usageCount: 3210,
    rating: 4.7,
    workflowJson: graph(
      [
        at('trigger', 0, ROW_MAIN, webhookTrigger('Resume Uploaded', 'resume_intake')),
        at(
          'extract',
          COL,
          ROW_MAIN,
          extractData(
            'Parse Resume',
            '{\n  "candidate_name": "string",\n  "years_experience": "number",\n  "skills": "string",\n  "current_role": "string"\n}',
          ),
        ),
        at(
          'classify',
          COL * 2,
          ROW_MAIN,
          aiClassify(
            'Score Against Role',
            'Rate how well this candidate matches the open role and return the fit level plus a confidence score.',
            'Strong Match, Possible Match, Weak Match',
          ),
        ),
        at(
          'shortlist',
          COL * 3,
          ROW_MAIN,
          condition('Confident Match?', '{{confidence}}', 'greater than', '0.7'),
        ),
        at(
          'save',
          COL * 4,
          ROW_TOP,
          saveDb(
            'Add to Shortlist',
            'customers',
            'candidate_name -> customers.name\ncurrent_role -> customers.segment',
          ),
        ),
        at(
          'notifyHr',
          COL * 5,
          ROW_TOP,
          notify('Alert HR', 'In-app', 'A strong candidate has been shortlisted and is ready for review.'),
        ),
        at(
          'decline',
          COL * 4,
          ROW_BOTTOM,
          notify(
            'Log Decline',
            'In-app',
            'A candidate scored below the shortlist threshold and was not advanced.',
          ),
        ),
      ],
      [
        { from: 'trigger', to: 'extract' },
        { from: 'extract', to: 'classify' },
        { from: 'classify', to: 'shortlist' },
        { from: 'shortlist', to: 'save', branch: 'true' },
        { from: 'save', to: 'notifyHr' },
        { from: 'shortlist', to: 'decline', branch: 'false' },
      ],
    ),
  },
  {
    name: 'Leave Approval',
    category: 'HR',
    description:
      'Read the dates off a leave request, send long absences to a manager for sign-off, auto-approve short ones, and confirm the outcome to the employee either way.',
    icon: 'calendar-check',
    usageCount: 2890,
    rating: 4.6,
    workflowJson: graph(
      [
        at('trigger', 0, ROW_MAIN, webhookTrigger('Leave Form Submitted', 'leave_request')),
        at(
          'extract',
          COL,
          ROW_MAIN,
          extractData(
            'Read Dates & Reason',
            '{\n  "start_date": "string",\n  "end_date": "string",\n  "total_days": "number",\n  "reason": "string"\n}',
          ),
        ),
        at(
          'length',
          COL * 2,
          ROW_MAIN,
          condition('Longer Than 3 Days?', '{{extracted.total_days}}', 'greater than', '3'),
        ),
        at(
          'manager',
          COL * 3,
          ROW_TOP,
          notify(
            'Manager Sign-Off',
            'In-app',
            'An extended leave request needs manager approval before it can be confirmed.',
          ),
        ),
        at(
          'autoApprove',
          COL * 3,
          ROW_BOTTOM,
          saveDb(
            'Auto-Approve',
            'customers',
            'start_date -> leave.start\nend_date -> leave.end\ntotal_days -> leave.days',
          ),
        ),
        at(
          'confirm',
          COL * 4,
          ROW_MAIN,
          emailAction(
            'Confirm to Employee',
            'Update on your leave request',
            'Your leave request has been processed. Open the Praxis dashboard to see its current status and remaining balance.',
          ),
        ),
      ],
      [
        { from: 'trigger', to: 'extract' },
        { from: 'extract', to: 'length' },
        { from: 'length', to: 'manager', branch: 'true' },
        { from: 'length', to: 'autoApprove', branch: 'false' },
        { from: 'manager', to: 'confirm' },
        { from: 'autoApprove', to: 'confirm' },
      ],
    ),
  },
  {
    name: 'Employee Onboarding',
    category: 'HR',
    description:
      'Create the new hire record, wait a day, then send the welcome email, raise the IT provisioning task, and produce a first-week checklist.',
    icon: 'user-plus',
    usageCount: 1950,
    rating: 4.9,
    workflowJson: graph(
      [
        at('trigger', 0, ROW_MAIN, webhookTrigger('New Hire Added', 'new_hire')),
        at(
          'records',
          COL,
          ROW_MAIN,
          saveDb(
            'Create Employee Records',
            'customers',
            'name -> employees.full_name\nrole -> employees.job_title\nstart_date -> employees.start',
          ),
        ),
        at('wait', COL * 2, ROW_MAIN, delay('Wait Until Day One', '1', 'Days')),
        at(
          'welcome',
          COL * 3,
          ROW_MAIN,
          emailAction(
            'Welcome Email',
            'Welcome to the team!',
            'Welcome aboard - here is everything you need for your first day. Your accounts are being provisioned and your training schedule will follow shortly.',
          ),
        ),
        at(
          'itTask',
          COL * 4,
          ROW_MAIN,
          notify(
            'Raise IT Setup Task',
            '#ops-alerts',
            'A new hire starts today - laptop, accounts and access need to be provisioned.',
          ),
        ),
        at(
          'checklist',
          COL * 5,
          ROW_MAIN,
          generateReport('Onboarding Checklist', 'Executive Brief', 'PDF'),
        ),
      ],
      [
        { from: 'trigger', to: 'records' },
        { from: 'records', to: 'wait' },
        { from: 'wait', to: 'welcome' },
        { from: 'welcome', to: 'itTask' },
        { from: 'itTask', to: 'checklist' },
      ],
    ),
  },
  {
    name: 'Expense Approval',
    category: 'Finance',
    description:
      'Pull the amount and category off a submitted expense, sanity-check the category with AI, then auto-reimburse within policy or escalate for review.',
    icon: 'credit-card',
    usageCount: 3670,
    rating: 4.5,
    workflowJson: graph(
      [
        at('trigger', 0, ROW_MAIN, webhookTrigger('Expense Submitted', 'expense_claim')),
        at(
          'extract',
          COL,
          ROW_MAIN,
          extractData(
            'Read Receipt',
            '{\n  "amount": "number",\n  "category": "string",\n  "merchant": "string",\n  "expense_date": "string"\n}',
          ),
        ),
        at(
          'classify',
          COL * 2,
          ROW_MAIN,
          aiClassify(
            'Validate Category',
            'Check the claimed expense against company policy categories and pick the one it genuinely belongs to.',
            'Travel, Meals, Equipment, Training, Out of Policy',
          ),
        ),
        at(
          'policy',
          COL * 3,
          ROW_MAIN,
          condition('Within Policy Limit?', '{{extracted.amount}}', 'greater than', '250'),
        ),
        at(
          'review',
          COL * 4,
          ROW_TOP,
          notify(
            'Escalate for Review',
            '#ops-alerts',
            'An expense claim exceeds the automatic reimbursement limit and needs manager review.',
          ),
        ),
        at(
          'reimburse',
          COL * 4,
          ROW_BOTTOM,
          saveDb(
            'Approve & Record',
            'invoices',
            'amount -> expenses.total\ncategory -> expenses.category\nmerchant -> expenses.vendor',
          ),
        ),
      ],
      [
        { from: 'trigger', to: 'extract' },
        { from: 'extract', to: 'classify' },
        { from: 'classify', to: 'policy' },
        { from: 'policy', to: 'review', branch: 'true' },
        { from: 'policy', to: 'reimburse', branch: 'false' },
      ],
    ),
  },
  {
    name: 'Email Automation',
    category: 'Communication',
    description:
      'Read intent and urgency off every inbound email, page the team on anything urgent, auto-reply to the rest, and log the thread either way.',
    icon: 'mail',
    usageCount: 5130,
    rating: 4.7,
    workflowJson: graph(
      [
        at('trigger', 0, ROW_MAIN, emailTrigger('New Support Email', 'support@eawmp.io')),
        at(
          'classify',
          COL,
          ROW_MAIN,
          aiClassify(
            'Detect Intent & Urgency',
            'Read this support email and classify how urgent it is and what the sender is asking for.',
            'Urgent, Billing, Technical, General',
          ),
        ),
        at('urgent', COL * 2, ROW_MAIN, condition('Urgent?', '{{classification}}', 'equals', 'Urgent')),
        at(
          'page',
          COL * 3,
          ROW_TOP,
          notify(
            'Page Support Team',
            '#support',
            'An urgent support email just arrived and needs a response right away.',
          ),
        ),
        at(
          'autoReply',
          COL * 3,
          ROW_BOTTOM,
          emailAction(
            'Send Auto-Reply',
            'We received your request',
            'Thanks for reaching out - we have received your message and a specialist will reply shortly.',
          ),
        ),
        at(
          'log',
          COL * 4,
          ROW_MAIN,
          saveDb(
            'Log Conversation',
            'tickets',
            'classification -> tickets.type\nbody -> tickets.summary',
          ),
        ),
      ],
      [
        { from: 'trigger', to: 'classify' },
        { from: 'classify', to: 'urgent' },
        { from: 'urgent', to: 'page', branch: 'true' },
        { from: 'urgent', to: 'autoReply', branch: 'false' },
        { from: 'page', to: 'log' },
        { from: 'autoReply', to: 'log' },
      ],
    ),
  },
  {
    name: 'Document Approval',
    category: 'Compliance',
    description:
      'Identify what an uploaded document is, route anything needing a signature to an approver, and quietly file everything else with an audit trail.',
    icon: 'file-check',
    usageCount: 2240,
    rating: 4.6,
    workflowJson: graph(
      [
        at('trigger', 0, ROW_MAIN, webhookTrigger('Document Uploaded', 'document_submitted')),
        at(
          'extract',
          COL,
          ROW_MAIN,
          extractData(
            'Identify Document Type',
            '{\n  "document_type": "string",\n  "requires_signature": "boolean",\n  "counterparty": "string"\n}',
          ),
        ),
        at(
          'signature',
          COL * 2,
          ROW_MAIN,
          condition('Needs Signature?', '{{extracted.requires_signature}}', 'equals', 'true'),
        ),
        at(
          'approver',
          COL * 3,
          ROW_TOP,
          notify(
            'Route to Approver',
            'In-app',
            'A document needs sign-off before it can be filed. Open the Praxis dashboard to review and approve it.',
          ),
        ),
        at(
          'file',
          COL * 3,
          ROW_BOTTOM,
          saveDb(
            'File Automatically',
            'tickets',
            'document_type -> documents.category\ncounterparty -> documents.party',
          ),
        ),
      ],
      [
        { from: 'trigger', to: 'extract' },
        { from: 'extract', to: 'signature' },
        { from: 'signature', to: 'approver', branch: 'true' },
        { from: 'signature', to: 'file', branch: 'false' },
      ],
    ),
  },
  {
    name: 'Attendance Reminder',
    category: 'Operations',
    description:
      'Poll the attendance system each morning, and when check-ins are missing, nudge each absent employee before filing the daily summary.',
    icon: 'clock',
    usageCount: 1780,
    rating: 4.4,
    workflowJson: graph(
      [
        at('trigger', 0, ROW_MAIN, scheduleTrigger('Every Morning', 'Daily', '09:30')),
        at(
          'fetch',
          COL,
          ROW_MAIN,
          apiCall('Check Attendance System', 'GET', 'https://api.example.com/v1/attendance/today'),
        ),
        at(
          'missing',
          COL * 2,
          ROW_MAIN,
          condition('Missing Check-Ins?', '{{missing_checkins}}', 'greater than', '0'),
        ),
        at('each', COL * 3, ROW_TOP, loop('For Each Absentee', '{{absent_employees}}', '50')),
        at(
          'nudge',
          COL * 4,
          ROW_TOP,
          notify(
            'Send Reminder',
            'In-app',
            'We have not recorded your check-in for today. Please log your attendance in Praxis.',
          ),
        ),
        at('summary', COL * 5, ROW_MAIN, generateReport('Daily Attendance Summary', 'Weekly Summary', 'PDF')),
      ],
      [
        { from: 'trigger', to: 'fetch' },
        { from: 'fetch', to: 'missing' },
        { from: 'missing', to: 'each', branch: 'true' },
        { from: 'each', to: 'nudge' },
        { from: 'nudge', to: 'summary' },
        { from: 'missing', to: 'summary', branch: 'false' },
      ],
    ),
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

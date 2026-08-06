export type TemplateCategory =
  | 'Finance'
  | 'HR'
  | 'Sales'
  | 'Operations'
  | 'Communication'
  | 'Compliance'

export interface MarketplaceTemplate {
  id: string
  name: string
  category: TemplateCategory
  description: string
  icon: string
  usageCount: number
  rating: number
}

const mockTemplates: MarketplaceTemplate[] = [
  {
    id: 'tmpl-1',
    name: 'Invoice Processing',
    category: 'Finance',
    description:
      'Automatically extract, validate, and route invoices from email attachments. Integrates with QuickBooks and SAP.',
    icon: 'receipt',
    usageCount: 4820,
    rating: 4.8,
  },
  {
    id: 'tmpl-2',
    name: 'Resume Screening',
    category: 'HR',
    description:
      'AI-powered resume ranking against job descriptions. Scores candidates and generates interview questions automatically.',
    icon: 'file-user',
    usageCount: 3210,
    rating: 4.7,
  },
  {
    id: 'tmpl-3',
    name: 'Leave Approval',
    category: 'HR',
    description:
      'Automated leave request workflow with manager approval chain, calendar sync, and balance tracking.',
    icon: 'calendar-check',
    usageCount: 2890,
    rating: 4.6,
  },
  {
    id: 'tmpl-4',
    name: 'Employee Onboarding',
    category: 'HR',
    description:
      'End-to-end new hire workflow: document collection, IT provisioning tasks, welcome emails, and training schedule.',
    icon: 'user-plus',
    usageCount: 1950,
    rating: 4.9,
  },
  {
    id: 'tmpl-5',
    name: 'Expense Approval',
    category: 'Finance',
    description:
      'Multi-level expense approval with receipt OCR, policy compliance checks, and automatic reimbursement triggering.',
    icon: 'credit-card',
    usageCount: 3670,
    rating: 4.5,
  },
  {
    id: 'tmpl-6',
    name: 'Email Automation',
    category: 'Communication',
    description:
      'AI-driven email response drafting, categorization, and routing. Supports Gmail, Outlook, and custom SMTP.',
    icon: 'mail',
    usageCount: 5130,
    rating: 4.7,
  },
  {
    id: 'tmpl-7',
    name: 'Document Approval',
    category: 'Compliance',
    description:
      'Route documents through configurable approval chains with e-signature support, audit trail, and deadline reminders.',
    icon: 'file-check',
    usageCount: 2240,
    rating: 4.6,
  },
  {
    id: 'tmpl-8',
    name: 'Attendance Reminder',
    category: 'Operations',
    description:
      'Automated daily attendance check with anomaly detection, manager alerts, and monthly attendance report generation.',
    icon: 'clock',
    usageCount: 1780,
    rating: 4.4,
  },
]

export function getTemplates(): MarketplaceTemplate[] {
  return mockTemplates
}

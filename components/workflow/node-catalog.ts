import {
  Bell,
  Braces,
  Clock,
  Database,
  FileText,
  Filter,
  GitBranch,
  Globe,
  Mail,
  MailPlus,
  Repeat,
  Sparkles,
  Webhook,
  type LucideIcon,
} from 'lucide-react'

export type NodeCategory = 'trigger' | 'ai' | 'logic' | 'action'

export type CategoryStyle = {
  label: string
  /** Left-border + icon accent color */
  color: string
  /** Soft tint for the icon chip background */
  tint: string
}

export const categoryStyles: Record<NodeCategory, CategoryStyle> = {
  trigger: { label: 'Trigger', color: '#2563eb', tint: 'rgba(37, 99, 235, 0.12)' },
  ai: { label: 'AI', color: '#7c3aed', tint: 'rgba(124, 58, 237, 0.12)' },
  logic: { label: 'Logic', color: '#ea580c', tint: 'rgba(234, 88, 12, 0.12)' },
  action: { label: 'Action', color: '#16a34a', tint: 'rgba(22, 163, 74, 0.12)' },
}

export type NodeTypeKey =
  | 'email-trigger'
  | 'schedule-trigger'
  | 'webhook-trigger'
  | 'ai-classify'
  | 'extract-data'
  | 'save-db'
  | 'generate-report'
  | 'notify'
  | 'api-call'
  | 'email-action'
  | 'condition'
  | 'loop'
  | 'delay'

export type NodeTypeDef = {
  key: NodeTypeKey
  label: string
  category: NodeCategory
  icon: LucideIcon
  description: string
}

export const nodeTypes: NodeTypeDef[] = [
  // Triggers
  {
    key: 'email-trigger',
    label: 'Email Trigger',
    category: 'trigger',
    icon: Mail,
    description: 'Starts when a new email arrives',
  },
  {
    key: 'schedule-trigger',
    label: 'Schedule Trigger',
    category: 'trigger',
    icon: Clock,
    description: 'Runs on a recurring schedule',
  },
  {
    key: 'webhook-trigger',
    label: 'Webhook Trigger',
    category: 'trigger',
    icon: Webhook,
    description: 'Triggers from an inbound HTTP request',
  },
  // Actions
  {
    key: 'ai-classify',
    label: 'AI Classify',
    category: 'ai',
    icon: Sparkles,
    description: 'Categorize input with an LLM',
  },
  {
    key: 'extract-data',
    label: 'Extract Data',
    category: 'ai',
    icon: Braces,
    description: 'Pull structured fields from text',
  },
  {
    key: 'save-db',
    label: 'Save to DB',
    category: 'action',
    icon: Database,
    description: 'Persist a record to the database',
  },
  {
    key: 'generate-report',
    label: 'Generate Report',
    category: 'action',
    icon: FileText,
    description: 'Compile a formatted report',
  },
  {
    key: 'notify',
    label: 'Notify',
    category: 'action',
    icon: Bell,
    description: 'Send a Slack / in-app notification',
  },
  {
    key: 'api-call',
    label: 'API Call',
    category: 'action',
    icon: Globe,
    description: 'Call an external REST endpoint',
  },
  {
    key: 'email-action',
    label: 'Email Action',
    category: 'action',
    icon: MailPlus,
    description: 'Send an outbound email',
  },
  // Logic
  {
    key: 'condition',
    label: 'Condition',
    category: 'logic',
    icon: GitBranch,
    description: 'Branch based on a rule',
  },
  {
    key: 'loop',
    label: 'Loop',
    category: 'logic',
    icon: Repeat,
    description: 'Iterate over a collection',
  },
  {
    key: 'delay',
    label: 'Delay',
    category: 'logic',
    icon: Clock,
    description: 'Wait before continuing',
  },
]

export const nodeTypesByKey: Record<NodeTypeKey, NodeTypeDef> = nodeTypes.reduce(
  (acc, def) => {
    acc[def.key] = def
    return acc
  },
  {} as Record<NodeTypeKey, NodeTypeDef>,
)

export const paletteGroups: { category: NodeCategory; items: NodeTypeDef[] }[] = [
  { category: 'trigger', items: nodeTypes.filter((n) => n.category === 'trigger') },
  { category: 'action', items: nodeTypes.filter((n) => n.category === 'action' || n.category === 'ai') },
  { category: 'logic', items: nodeTypes.filter((n) => n.category === 'logic') },
]

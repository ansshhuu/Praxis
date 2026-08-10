import {
  Bell,
  BrainCircuit,
  Braces,
  Clock,
  Database,
  FileText,
  GitBranch,
  Globe,
  Mail,
  MailPlus,
  RefreshCw,
  Timer,
  Webhook,
  type LucideIcon,
} from 'lucide-react'

export type NodeCategory = 'trigger' | 'ai' | 'logic' | 'action'

export type CategoryStyle = {
  label: string
  color: string
  tint: string
}

export const categoryStyles: Record<NodeCategory, CategoryStyle> = {
  trigger: { label: 'Trigger', color: '#16a34a', tint: 'rgba(22, 163, 74, 0.12)' },
  ai:      { label: 'AI',      color: '#6366f1', tint: 'rgba(99, 102, 241, 0.12)' },
  logic:   { label: 'Logic',   color: '#ea580c', tint: 'rgba(234, 88, 12, 0.12)' },
  action:  { label: 'Action',  color: '#f59e0b', tint: 'rgba(245, 158, 11, 0.12)' },
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
  colorOverride?: string
  tintOverride?: string
}

export function nodeColor(def: NodeTypeDef): string {
  return def.colorOverride ?? categoryStyles[def.category].color
}

export function nodeTint(def: NodeTypeDef): string {
  return def.tintOverride ?? categoryStyles[def.category].tint
}

export const nodeTypes: NodeTypeDef[] = [
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

  {
    key: 'ai-classify',
    label: 'AI Classify',
    category: 'ai',
    icon: BrainCircuit,
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
    colorOverride: '#ea580c',
    tintOverride:  'rgba(234, 88, 12, 0.12)',
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
    icon: RefreshCw,
    description: 'Iterate over a collection',
  },
  {
    key: 'delay',
    label: 'Delay',
    category: 'logic',
    icon: Timer,
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

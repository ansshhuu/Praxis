'use client'

import { Trash2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  categoryStyles,
  nodeTypesByKey,
  type NodeTypeKey,
} from './node-catalog'
import type { WorkflowNodeData } from './workflow-node'

type Field =
  | { kind: 'text'; label: string; placeholder?: string; value?: string }
  | { kind: 'textarea'; label: string; placeholder?: string; value?: string }
  | { kind: 'select'; label: string; options: string[]; value?: string }

const fieldsByType: Partial<Record<NodeTypeKey, Field[]>> = {
  'email-trigger': [
    { kind: 'text', label: 'Mailbox', value: 'support@eawmp.io' },
    { kind: 'select', label: 'Folder', options: ['Inbox', 'Archive', 'Spam'] },
  ],
  'schedule-trigger': [
    {
      kind: 'select',
      label: 'Frequency',
      options: ['Every hour', 'Daily', 'Weekly', 'Monthly'],
    },
    { kind: 'text', label: 'Run at', value: '09:00' },
  ],
  'webhook-trigger': [
    {
      kind: 'text',
      label: 'Endpoint URL',
      value: 'https://api.eawmp.io/hooks/wf_2f9a',
    },
    { kind: 'select', label: 'Method', options: ['POST', 'GET', 'PUT'] },
  ],
  'ai-classify': [
    {
      kind: 'select',
      label: 'Model',
      options: ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro'],
    },
    {
      kind: 'textarea',
      label: 'Prompt',
      value:
        'Classify the incoming email into one of: Billing, Support, Sales, Other.',
    },
    { kind: 'text', label: 'Categories', value: 'Billing, Support, Sales' },
  ],
  'extract-data': [
    {
      kind: 'select',
      label: 'Model',
      options: ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro'],
    },
    {
      kind: 'textarea',
      label: 'Schema (JSON)',
      value: '{\n  "name": "string",\n  "amount": "number"\n}',
    },
  ],
  'save-db': [
    {
      kind: 'select',
      label: 'Table',
      options: ['tickets', 'invoices', 'customers'],
    },
    {
      kind: 'textarea',
      label: 'Field mapping',
      value: 'category -> tickets.type\nbody -> tickets.summary',
    },
  ],
  'generate-report': [
    {
      kind: 'select',
      label: 'Template',
      options: ['Weekly Summary', 'Executive Brief', 'Raw Export'],
    },
    { kind: 'select', label: 'Format', options: ['PDF', 'CSV', 'HTML'] },
  ],
  notify: [
    {
      kind: 'select',
      label: 'Channel',
      options: ['#ops-alerts', '#support', 'In-app'],
    },
    {
      kind: 'textarea',
      label: 'Message',
      value: 'New {{category}} ticket routed and saved.',
    },
  ],
  'api-call': [
    { kind: 'select', label: 'Method', options: ['GET', 'POST', 'PUT', 'DELETE'] },
    { kind: 'text', label: 'URL', value: 'https://api.example.com/v1/records' },
    { kind: 'textarea', label: 'Headers', value: '{\n  "Authorization": "Bearer •••"\n}' },
  ],
  'email-action': [
    { kind: 'text', label: 'To', value: '{{customer.email}}' },
    { kind: 'text', label: 'Subject', value: 'We received your request' },
    {
      kind: 'textarea',
      label: 'Body',
      value: 'Hi {{customer.name}}, thanks for reaching out…',
    },
  ],
  condition: [
    { kind: 'text', label: 'Field', value: '{{classification}}' },
    {
      kind: 'select',
      label: 'Operator',
      options: ['equals', 'not equals', 'contains', 'greater than'],
    },
    { kind: 'text', label: 'Value', value: 'Billing' },
  ],
  loop: [
    { kind: 'text', label: 'Collection', value: '{{items}}' },
    { kind: 'text', label: 'Max iterations', value: '50' },
  ],
  delay: [
    { kind: 'text', label: 'Duration', value: '5' },
    { kind: 'select', label: 'Unit', options: ['Seconds', 'Minutes', 'Hours'] },
  ],
}

function ConfigField({ field }: { field: Field }) {
  const id = `field-${field.label.replace(/\s+/g, '-').toLowerCase()}`

  if (field.kind === 'textarea') {
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id}>{field.label}</Label>
        <Textarea
          id={id}
          rows={4}
          defaultValue={field.value}
          placeholder={field.placeholder}
          className="resize-none font-mono text-xs"
        />
      </div>
    )
  }

  if (field.kind === 'select') {
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id}>{field.label}</Label>
        <select
          id={id}
          defaultValue={field.value ?? field.options[0]}
          className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{field.label}</Label>
      <Input id={id} defaultValue={field.value} placeholder={field.placeholder} />
    </div>
  )
}

type NodeConfigDrawerProps = {
  nodeId: string | null
  data: WorkflowNodeData | null
  onClose: () => void
  onDelete: (id: string) => void
}

export function NodeConfigDrawer({
  nodeId,
  data,
  onClose,
  onDelete,
}: NodeConfigDrawerProps) {
  const open = Boolean(nodeId && data)
  const def = data ? nodeTypesByKey[data.typeKey] : null
  const style = def ? categoryStyles[def.category] : null
  const fields = data ? fieldsByType[data.typeKey] ?? [] : []

  return (
    <div
      className={cn(
        'absolute inset-y-0 right-0 z-20 flex w-80 max-w-[85%] flex-col border-l border-border bg-card shadow-xl transition-transform duration-300 ease-out',
        open ? 'translate-x-0' : 'pointer-events-none translate-x-full',
      )}
      role="dialog"
      aria-label="Node configuration"
      aria-hidden={!open}
    >
      {def && style && data && (
        <>
          <div className="flex items-start justify-between border-b border-border px-4 py-4">
            <div className="flex items-center gap-3">
              <span
                className="flex size-9 items-center justify-center rounded-lg"
                style={{ background: style.tint, color: style.color }}
              >
                <def.icon className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {data.label}
                </p>
                <p className="text-xs" style={{ color: style.color }}>
                  {style.label} node
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="-mr-1 size-8"
              aria-label="Close configuration"
              onClick={onClose}
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
            <p className="text-xs text-muted-foreground">{def.description}</p>
            {fields.map((field) => (
              <ConfigField key={field.label} field={field} />
            ))}
          </div>

          <div className="border-t border-border p-4">
            <Button
              variant="outline"
              className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => nodeId && onDelete(nodeId)}
            >
              <Trash2 className="size-4" />
              Delete Node
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

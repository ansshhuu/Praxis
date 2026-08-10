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
  | {
      kind: 'text'
      key: string
      label: string
      placeholder?: string
      value?: string
      inputType?: 'text' | 'email'
    }
  | { kind: 'textarea'; key: string; label: string; placeholder?: string; value?: string }
  | { kind: 'select'; key: string; label: string; options: string[]; value?: string }

const fieldsByType: Partial<Record<NodeTypeKey, Field[]>> = {
  'email-trigger': [
    { kind: 'text', key: 'mailbox', label: 'Mailbox', value: 'support@eawmp.io' },
    { kind: 'select', key: 'folder', label: 'Folder', options: ['Inbox', 'Archive', 'Spam'] },
  ],
  'schedule-trigger': [
    {
      kind: 'select',
      key: 'frequency',
      label: 'Frequency',
      options: ['Every hour', 'Daily', 'Weekly', 'Monthly'],
    },
    { kind: 'text', key: 'runAt', label: 'Run at', value: '09:00' },
  ],
  'webhook-trigger': [
    {
      kind: 'text',
      key: 'endpointUrl',
      label: 'Endpoint URL',
      value: 'https://api.eawmp.io/hooks/wf_2f9a',
    },
    { kind: 'select', key: 'method', label: 'Method', options: ['POST', 'GET', 'PUT'] },
  ],
  'ai-classify': [
    {
      kind: 'select',
      key: 'model',
      label: 'Model',
      options: ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro'],
    },
    {
      kind: 'textarea',
      key: 'prompt',
      label: 'Prompt',
      value:
        'Classify the incoming email into one of: Billing, Support, Sales, Other.',
    },
    { kind: 'text', key: 'categories', label: 'Categories', value: 'Billing, Support, Sales' },
  ],
  'extract-data': [
    {
      kind: 'select',
      key: 'model',
      label: 'Model',
      options: ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro'],
    },
    {
      kind: 'textarea',
      key: 'schema',
      label: 'Schema (JSON)',
      value: '{\n  "name": "string",\n  "amount": "number"\n}',
    },
  ],
  'save-db': [
    {
      kind: 'select',
      key: 'table',
      label: 'Table',
      options: ['tickets', 'invoices', 'customers'],
    },
    {
      kind: 'textarea',
      key: 'fieldMapping',
      label: 'Field mapping',
      value: 'category -> tickets.type\nbody -> tickets.summary',
    },
  ],
  'generate-report': [
    {
      kind: 'select',
      key: 'template',
      label: 'Template',
      options: ['Weekly Summary', 'Executive Brief', 'Raw Export'],
    },
    { kind: 'select', key: 'format', label: 'Format', options: ['PDF', 'CSV', 'HTML'] },
  ],
  notify: [
    {
      kind: 'select',
      key: 'channel',
      label: 'Channel',
      options: ['#ops-alerts', '#support', 'In-app'],
    },
    {
      kind: 'text',
      key: 'recipientEmail',
      label: 'Recipient Email',
      inputType: 'email',
      placeholder: 'recipient@example.com',
      value: '',
    },
    {
      kind: 'textarea',
      key: 'message',
      label: 'Message',
      value: 'New {{classification}} ticket routed and saved.',
    },
  ],
  'api-call': [
    { kind: 'select', key: 'method', label: 'Method', options: ['GET', 'POST', 'PUT', 'DELETE'] },
    { kind: 'text', key: 'url', label: 'URL', value: 'https://api.example.com/v1/records' },
    {
      kind: 'textarea',
      key: 'headers',
      label: 'Headers',
      value: '{\n  "Authorization": "Bearer •••"\n}',
    },
  ],
  'email-action': [
    {
      kind: 'text',
      key: 'to',
      label: 'To',
      inputType: 'email',
      placeholder: 'recipient@example.com',
      value: '',
    },
    { kind: 'text', key: 'subject', label: 'Subject', value: 'We received your request' },
    {
      kind: 'textarea',
      key: 'body',
      label: 'Body',
      value: 'Thanks for reaching out — a specialist will reply shortly.',
    },
  ],
  condition: [
    { kind: 'text', key: 'field', label: 'Field', value: '{{classification}}' },
    {
      kind: 'select',
      key: 'operator',
      label: 'Operator',
      options: ['equals', 'not equals', 'contains', 'greater than'],
    },
    { kind: 'text', key: 'value', label: 'Value', value: 'Billing' },
  ],
  loop: [
    { kind: 'text', key: 'collection', label: 'Collection', value: '{{items}}' },
    { kind: 'text', key: 'maxIterations', label: 'Max iterations', value: '50' },
  ],
  delay: [
    { kind: 'text', key: 'duration', label: 'Duration', value: '5' },
    { kind: 'select', key: 'unit', label: 'Unit', options: ['Seconds', 'Minutes', 'Hours'] },
  ],
}

function fieldDefault(field: Field): string {
  if (field.value !== undefined) return field.value
  return field.kind === 'select' ? field.options[0] : ''
}

export function defaultConfigFor(typeKey: NodeTypeKey): Record<string, string> {
  const fields = fieldsByType[typeKey] ?? []
  return Object.fromEntries(fields.map((field) => [field.key, fieldDefault(field)]))
}

function ConfigField({
  field,
  value,
  onChange,
}: {
  field: Field
  value: string
  onChange: (value: string) => void
}) {
  const id = `field-${field.label.replace(/\s+/g, '-').toLowerCase()}`

  if (field.kind === 'textarea') {
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id}>{field.label}</Label>
        <Textarea
          id={id}
          rows={4}
          value={value}
          onChange={(event) => onChange(event.target.value)}
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
          value={value}
          onChange={(event) => onChange(event.target.value)}
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
      <Input
        id={id}
        type={field.inputType ?? 'text'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
      />
    </div>
  )
}

type NodeConfigDrawerProps = {
  nodeId: string | null
  data: WorkflowNodeData | null
  onClose: () => void
  onDelete: (id: string) => void
  onConfigChange: (id: string, key: string, value: string) => void
}

export function NodeConfigDrawer({
  nodeId,
  data,
  onClose,
  onDelete,
  onConfigChange,
}: NodeConfigDrawerProps) {
  const open = Boolean(nodeId && data)
  const def = data ? nodeTypesByKey[data.typeKey] : null
  const style = def ? categoryStyles[def.category] : null
  const fields = data ? fieldsByType[data.typeKey] ?? [] : []
  const config = data?.config ?? {}

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
              <ConfigField
                key={field.key}
                field={field}
                value={config[field.key] ?? fieldDefault(field)}
                onChange={(value) => nodeId && onConfigChange(nodeId, field.key, value)}
              />
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

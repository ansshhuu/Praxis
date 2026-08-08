'use client'

import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Check, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  categoryStyles,
  nodeColor,
  nodeTint,
  nodeTypesByKey,
  type NodeTypeKey,
} from './node-catalog'

export type WorkflowNodeData = {
  typeKey: NodeTypeKey
  label: string
  status?: 'idle' | 'running' | 'done'
  /** Per-node settings from the config drawer; read by the execution engine. */
  config?: Record<string, string>
}

export function WorkflowNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData
  const def = nodeTypesByKey[nodeData.typeKey]
  const style = categoryStyles[def.category]
  const color = nodeColor(def)
  const tint  = nodeTint(def)
  const Icon  = def.icon
  const isCondition = nodeData.typeKey === 'condition'
  const status = nodeData.status ?? 'idle'

  return (
    <div
      className={cn(
        'relative flex w-56 items-center gap-3 rounded-xl border bg-card py-3 pr-3 pl-4 shadow-sm transition-all',
        selected ? 'shadow-md ring-2 ring-primary/30' : 'border-border',
        status === 'running' && 'animate-pulse-ring',
      )}
      style={{
        borderLeft: `4px solid ${color}`,
        // Subtle category-tinted full border when selected
        ...(selected ? { borderColor: color, borderLeftWidth: '4px' } : {}),
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!size-2.5 !border-2 !border-card"
        style={{ background: color }}
      />

      {/* ── Icon badge: 44 × 44 px rounded-xl chip ── */}
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-xl"
        style={{ background: tint, color }}
      >
        <Icon className="size-5" strokeWidth={1.75} />
      </span>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          {nodeData.label}
        </p>
        <p className="mt-0.5 text-xs font-medium" style={{ color }}>
          {style.label}
        </p>
      </div>

      {status === 'running' && (
        <span className="absolute -top-2.5 -right-2.5 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <Loader2 className="size-3.5 animate-spin" />
        </span>
      )}
      {status === 'done' && (
        <span className="absolute -top-2.5 -right-2.5 flex size-6 items-center justify-center rounded-full bg-[#16a34a] text-white shadow-sm">
          <Check className="size-3.5" />
        </span>
      )}

      {isCondition ? (
        <>
          <Handle
            id="true"
            type="source"
            position={Position.Right}
            style={{ top: '32%', background: '#16a34a' }}
            className="!size-2.5 !border-2 !border-card"
          />
          <Handle
            id="false"
            type="source"
            position={Position.Right}
            style={{ top: '68%', background: '#ea580c' }}
            className="!size-2.5 !border-2 !border-card"
          />
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          className="!size-2.5 !border-2 !border-card"
          style={{ background: color }}
        />
      )}
    </div>
  )
}


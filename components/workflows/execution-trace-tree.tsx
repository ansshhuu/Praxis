'use client'

import { ChevronRight } from 'lucide-react'
import { useState } from 'react'

import { StatusBadge } from '@/components/ui/status-badge'
import { cn } from '@/lib/utils'

import type { NodeExecutionRecordView } from './types'

function durationOf(record: NodeExecutionRecordView): number | null {
  if (!record.finishedAt) return null
  return new Date(record.finishedAt).getTime() - new Date(record.startedAt).getTime()
}

function TraceNode({ record, depth }: { record: NodeExecutionRecordView; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 1)
  const hasChildren = Boolean(record.children?.length)
  const duration = durationOf(record)

  return (
    <div className={cn(depth > 0 && 'ml-5 border-l border-gray-100 pl-4')}>
      <div className="flex items-center gap-2 rounded-lg py-1.5">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? 'Collapse' : 'Expand'}
            className="flex size-5 shrink-0 items-center justify-center text-gray-400 hover:text-gray-900"
          >
            <ChevronRight className={cn('size-3.5 transition-transform', expanded && 'rotate-90')} />
          </button>
        ) : (
          <span className="size-5 shrink-0" />
        )}
        <StatusBadge status={record.status} />
        <span className="text-[13px] font-bold text-gray-900">{record.nodeId}</span>
        {duration !== null && <span className="text-[11px] font-medium text-gray-400 tabular-nums">{duration}ms</span>}
      </div>

      {expanded && record.output !== undefined && (
        <pre className="ml-7 mb-2 max-h-40 overflow-auto rounded-lg bg-gray-50 p-2 text-[11px] leading-relaxed text-gray-600">
          {JSON.stringify(record.output, null, 2)}
        </pre>
      )}

      {expanded && hasChildren && (
        <div className="flex flex-col">
          {record.children!.map((child, index) => (
            <TraceNode key={`${child.nodeId}-${index}`} record={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function ExecutionTraceTree({ nodes }: { nodes: NodeExecutionRecordView[] }) {
  if (nodes.length === 0) {
    return <p className="text-[13px] font-medium text-gray-400">No steps were recorded for this run.</p>
  }

  return (
    <div className="flex flex-col gap-0.5">
      {nodes.map((node, index) => (
        <TraceNode key={`${node.nodeId}-${index}`} record={node} depth={0} />
      ))}
    </div>
  )
}

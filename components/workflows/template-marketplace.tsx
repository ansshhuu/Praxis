'use client'

import { Loader2, Play, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn } from '@/lib/utils'

import { ExecutionTraceTree } from './execution-trace-tree'
import { WORKFLOW_CATEGORIES, type NodeExecutionRecordView, type WorkflowTemplateView } from './types'

const CATEGORY_COLORS: Record<string, string> = {
  HR: 'bg-purple-50 text-purple-700 border-purple-100',
  Sales: 'bg-blue-50 text-blue-700 border-blue-100',
  IT: 'bg-slate-50 text-slate-700 border-slate-100',
  DevOps: 'bg-orange-50 text-orange-700 border-orange-100',
  Marketing: 'bg-pink-50 text-pink-700 border-pink-100',
  Support: 'bg-emerald-50 text-emerald-700 border-emerald-100',
}

interface ExecuteState {
  template: WorkflowTemplateView
  isRunning: boolean
  error: string | null
  status: 'success' | 'failed' | 'queued' | null
  steps: NodeExecutionRecordView[]
}

function TemplateCard({ template, onExecute }: { template: WorkflowTemplateView; onExecute: () => void }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className={cn('rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide', CATEGORY_COLORS[template.category])}>
            {template.category}
          </span>
          <span className="text-[11px] font-medium text-gray-400">{template.nodeCount} nodes</span>
        </div>
        <CardTitle className="text-base">{template.name}</CardTitle>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto flex flex-col gap-3 pt-2">
        <div className="flex flex-wrap gap-1.5">
          {template.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
              {tag}
            </span>
          ))}
        </div>
        <Button size="sm" className="bg-[#F5CA50] font-bold text-[#111111] hover:brightness-95" onClick={onExecute}>
          <Play className="size-3.5" /> Run template
        </Button>
      </CardContent>
    </Card>
  )
}

export function TemplateMarketplace() {
  const [templates, setTemplates] = useState<WorkflowTemplateView[] | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [execution, setExecution] = useState<ExecuteState | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const params = new URLSearchParams()
      if (query.trim()) params.set('q', query.trim())
      if (category) params.set('category', category)
      try {
        const response = await fetch(`/api/workflows/templates?${params.toString()}`)
        const body = await response.json().catch(() => null)
        if (!response.ok) throw new Error((body as { error?: string } | null)?.error ?? 'Could not load templates')
        if (!cancelled) setTemplates((body as { templates: WorkflowTemplateView[] }).templates)
      } catch (loadError) {
        if (!cancelled) setError((loadError as Error).message)
      }
    }
    const timeout = setTimeout(load, 200)
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [query, category])

  const grouped = useMemo(() => templates ?? [], [templates])

  async function execute(template: WorkflowTemplateView) {
    setExecution({ template, isRunning: true, error: null, status: null, steps: [] })
    try {
      const response = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: template.id, mode: 'immediate', input: {} }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok && response.status !== 502) {
        setExecution({ template, isRunning: false, error: (body as { error?: string } | null)?.error ?? 'Execution failed', status: null, steps: [] })
        return
      }
      const parsed = body as { status: 'success' | 'failed'; steps: NodeExecutionRecordView[]; error: string | null }
      setExecution({ template, isRunning: false, error: parsed.error, status: parsed.status, steps: parsed.steps })
    } catch (runError) {
      setExecution({ template, isRunning: false, error: (runError as Error).message, status: null, steps: [] })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search 102 workflow templates…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-4 pl-9 text-[13.5px] outline-none focus:border-[#F5CA50] focus:ring-1 focus:ring-[#F5CA50]"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategory('')}
            className={cn(
              'rounded-full border px-3 py-1.5 text-[12px] font-bold transition-colors',
              category === '' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
            )}
          >
            All
          </button>
          {WORKFLOW_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-[12px] font-bold transition-colors',
                category === cat ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-[13px] font-bold text-red-500">{error}</p>}

      {!templates ? (
        <p className="text-[13px] font-medium text-gray-400">Loading templates…</p>
      ) : (
        <>
          <p className="text-[12.5px] font-medium text-gray-500">{grouped.length} templates</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {grouped.map((template) => (
              <TemplateCard key={template.id} template={template} onExecute={() => execute(template)} />
            ))}
          </div>
        </>
      )}

      {execution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setExecution(null)} />
          <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div>
                <h3 className="text-base font-bold text-gray-900">{execution.template.name}</h3>
                <p className="text-[12.5px] font-medium text-gray-500">Execution trace</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setExecution(null)} aria-label="Close">
                <X className="size-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {execution.isRunning ? (
                <div className="flex items-center gap-2 py-10 justify-center text-gray-500">
                  <Loader2 className="size-4 animate-spin" />
                  <span className="text-[13px] font-medium">Running workflow…</span>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {execution.status && <StatusBadge status={execution.status} />}
                  {execution.error && <p className="text-[13px] font-bold text-red-500">{execution.error}</p>}
                  <ExecutionTraceTree nodes={execution.steps} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { Loader2, Workflow as WorkflowIcon, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import { WORKFLOW_CATEGORIES, type WorkflowTemplateView } from './types'

const CATEGORY_COLORS: Record<string, string> = {
  HR: 'bg-purple-50 text-purple-700 border-purple-100',
  Sales: 'bg-blue-50 text-blue-700 border-blue-100',
  IT: 'bg-slate-50 text-slate-700 border-slate-100',
  DevOps: 'bg-orange-50 text-orange-700 border-orange-100',
  Marketing: 'bg-pink-50 text-pink-700 border-pink-100',
  Support: 'bg-emerald-50 text-emerald-700 border-emerald-100',
}

function TemplateCard({
  template,
  isLoading,
  onUse,
}: {
  template: WorkflowTemplateView
  isLoading: boolean
  onUse: () => void
}) {
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
        <Button
          size="sm"
          className="bg-[#F5CA50] font-bold text-[#111111] hover:brightness-95"
          onClick={onUse}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <WorkflowIcon className="size-3.5" />}
          Use workflow
        </Button>
      </CardContent>
    </Card>
  )
}

export function TemplateMarketplace() {
  const router = useRouter()
  const [templates, setTemplates] = useState<WorkflowTemplateView[] | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [creatingId, setCreatingId] = useState<string | null>(null)

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

  async function createFromTemplate(template: WorkflowTemplateView) {
    setCreatingId(template.id)
    setError(null)
    try {
      const response = await fetch('/api/workflows/from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: template.id }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error((body as { error?: string } | null)?.error ?? 'Could not create workflow from template')
      }
      const { workflow } = body as { workflow: { id: string } }
      router.push(`/workflows?id=${workflow.id}`)
    } catch (useError) {
      setError((useError as Error).message)
      setCreatingId(null)
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
              <TemplateCard
                key={template.id}
                template={template}
                isLoading={creatingId === template.id}
                onUse={() => createFromTemplate(template)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

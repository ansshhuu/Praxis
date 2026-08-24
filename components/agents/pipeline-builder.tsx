'use client'

import { CheckCircle2, Loader2, Plus, Trash2, Workflow, XCircle } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn } from '@/lib/utils'

import type { AgentView } from './types'

interface StepDraft {
  id: string
  agentId: string
  prompt: string
}

interface StageDraft {
  id: string
  parallel: boolean
  steps: StepDraft[]
}

interface PipelineStepResultView {
  agentId: string
  stageIndex: number
  attempts: number
  status: 'success' | 'error'
  output: string
  error?: string
  latencyMs: number
}

interface PipelineRunResultView {
  pipelineId: string
  runId: string
  status: 'success' | 'partial' | 'failed'
  steps: PipelineStepResultView[]
  aggregatedOutput: Record<string, unknown>
}

function newStep(agentId: string): StepDraft {
  return { id: crypto.randomUUID(), agentId, prompt: '' }
}

function newStage(agentId: string): StageDraft {
  return { id: crypto.randomUUID(), parallel: false, steps: [newStep(agentId)] }
}

function StageEditor({
  stage,
  stageNumber,
  agents,
  onChange,
  onRemove,
}: {
  stage: StageDraft
  stageNumber: number
  agents: AgentView[]
  onChange: (stage: StageDraft) => void
  onRemove: () => void
}) {
  function updateStep(stepId: string, patch: Partial<StepDraft>) {
    onChange({ ...stage, steps: stage.steps.map((step) => (step.id === stepId ? { ...step, ...patch } : step)) })
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-gray-900 text-[11px] font-bold text-white">
            {stageNumber}
          </span>
          <span className="text-[13px] font-bold text-gray-900">
            {stage.parallel ? 'Parallel stage' : 'Sequential step'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500">
            <input
              type="checkbox"
              checked={stage.parallel}
              onChange={(event) => onChange({ ...stage, parallel: event.target.checked })}
            />
            Run in parallel
          </label>
          <button type="button" onClick={onRemove} aria-label="Remove stage" className="text-gray-400 hover:text-red-500">
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {stage.steps.map((step) => (
          <div key={step.id} className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-3">
            <select
              value={step.agentId}
              onChange={(event) => updateStep(step.id, { agentId: event.target.value })}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[13px] font-medium text-gray-900 outline-none focus:border-[#F5CA50]"
            >
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
            <textarea
              value={step.prompt}
              onChange={(event) => updateStep(step.id, { prompt: event.target.value })}
              placeholder="What should this agent do?"
              rows={2}
              className="resize-none rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-[13px] outline-none placeholder:text-gray-400 focus:border-[#F5CA50]"
            />
          </div>
        ))}
        {stage.parallel && (
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => onChange({ ...stage, steps: [...stage.steps, newStep(agents[0]?.id ?? '')] })}
          >
            <Plus className="size-3.5" /> Add parallel branch
          </Button>
        )}
      </div>
    </div>
  )
}

function StepResultCard({ result }: { result: PipelineStepResultView }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[13px] font-bold text-gray-900">
          {result.status === 'success' ? (
            <CheckCircle2 className="size-4 text-green-500" />
          ) : (
            <XCircle className="size-4 text-red-500" />
          )}
          {result.agentId}
        </span>
        <span className="text-[11px] font-medium text-gray-400">
          stage {result.stageIndex + 1} · {result.attempts} attempt{result.attempts === 1 ? '' : 's'} · {result.latencyMs}ms
        </span>
      </div>
      <p className="line-clamp-3 text-[12.5px] font-medium text-gray-600">{result.output || result.error}</p>
    </div>
  )
}

export function PipelineBuilder({ agents }: { agents: AgentView[] }) {
  const [stages, setStages] = useState<StageDraft[]>(() => (agents[0] ? [newStage(agents[0].id)] : []))
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [runResult, setRunResult] = useState<PipelineRunResultView | null>(null)

  function updateStage(id: string, next: StageDraft) {
    setStages((prev) => prev.map((stage) => (stage.id === id ? next : stage)))
  }

  async function run() {
    if (stages.length === 0 || isRunning) return
    setIsRunning(true)
    setError(null)
    setRunResult(null)

    const payload = {
      name: 'Ad-hoc pipeline',
      stages: stages.map((stage) =>
        stage.parallel
          ? { parallel: stage.steps.map((step) => ({ agentId: step.agentId, prompt: step.prompt || 'Continue the pipeline.' })) }
          : { agentId: stage.steps[0].agentId, prompt: stage.steps[0].prompt || 'Continue the pipeline.' },
      ),
      retryPolicy: { maxAttempts: 2, backoffMs: 300 },
    }

    try {
      const response = await fetch('/api/agents/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok && response.status !== 502) {
        setError((body as { error?: string } | null)?.error ?? 'Pipeline run failed')
        return
      }
      setRunResult((body as { result: PipelineRunResultView }).result)
    } catch (runError) {
      setError((runError as Error).message)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <div>
            <CardTitle>Pipeline Stages</CardTitle>
            <CardDescription>Chain agents sequentially, or fan out a stage in parallel.</CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => agents[0] && setStages((prev) => [...prev, newStage(agents[0].id)])}
          >
            <Plus className="size-3.5" /> Add stage
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {stages.map((stage, index) => (
            <StageEditor
              key={stage.id}
              stage={stage}
              stageNumber={index + 1}
              agents={agents}
              onChange={(next) => updateStage(stage.id, next)}
              onRemove={() => setStages((prev) => prev.filter((s) => s.id !== stage.id))}
            />
          ))}

          <Button
            className="bg-[#F5CA50] font-bold text-[#111111] hover:brightness-95"
            disabled={stages.length === 0 || isRunning}
            onClick={run}
          >
            {isRunning ? <Loader2 className="size-4 animate-spin" /> : <Workflow className="size-4" />}
            {isRunning ? 'Running pipeline…' : 'Execute pipeline'}
          </Button>
          {error && <p className="text-[13px] font-bold text-red-500">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Execution Progress</CardTitle>
          <CardDescription>Step-by-step results and shared pipeline state.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!runResult && !isRunning && (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-100 py-14 text-center">
              <Workflow className="size-8 text-gray-300" />
              <p className="text-[13px] font-medium text-gray-500">Run a pipeline to see step progress here.</p>
            </div>
          )}

          {isRunning && (
            <div className="flex items-center gap-2 py-10 justify-center text-gray-500">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-[13px] font-medium">Executing stages…</span>
            </div>
          )}

          {runResult && (
            <>
              <div className="flex items-center justify-between">
                <StatusBadge status={runResult.status === 'success' ? 'success' : runResult.status === 'partial' ? 'pending' : 'error'} />
                <span className="text-[12px] font-medium text-gray-400">{runResult.steps.length} steps</span>
              </div>
              <div className="flex flex-col gap-2">
                {runResult.steps.map((step, index) => (
                  <StepResultCard key={`${step.agentId}-${index}`} result={step} />
                ))}
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                <p className="mb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wide">Shared state</p>
                <pre className={cn('max-h-48 overflow-auto text-[11px] leading-relaxed text-gray-600')}>
                  {JSON.stringify(runResult.aggregatedOutput, null, 2)}
                </pre>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

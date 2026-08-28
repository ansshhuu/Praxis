'use client'

import { CheckCircle2, HelpCircle, Loader2, Plus, Trash2, Workflow, XCircle } from 'lucide-react'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

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

type StepDisplayStatus = 'success' | 'error' | 'needs_input'

const CLARIFYING_QUESTION_PATTERNS = [
  /please provide/i,
  /please clarify/i,
  /could you clarify/i,
  /could you provide/i,
  /can you provide/i,
  /can you clarify/i,
  /what is the/i,
  /what are the/i,
  /which .* would you like/i,
  /can you tell me/i,
  /i need more (information|details|context)/i,
  /i'd need more (information|details|context)/i,
]

function isClarifyingQuestion(output: string): boolean {
  const trimmed = output.trim()
  if (!trimmed) return false
  if (trimmed.endsWith('?')) return true
  return CLARIFYING_QUESTION_PATTERNS.some((pattern) => pattern.test(trimmed))
}

function getStepDisplayStatus(result: PipelineStepResultView): StepDisplayStatus {
  if (result.status === 'error') return 'error'
  if (isClarifyingQuestion(result.output)) return 'needs_input'
  return 'success'
}

function getOverallDisplayStatus(runResult: PipelineRunResultView): 'success' | 'pending' | 'error' | 'needs_input' {
  const displayStatuses = runResult.steps.map(getStepDisplayStatus)
  if (displayStatuses.some((status) => status === 'needs_input')) return 'needs_input'
  if (runResult.status === 'success') return 'success'
  if (runResult.status === 'partial') return 'pending'
  return 'error'
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
  showValidation,
}: {
  stage: StageDraft
  stageNumber: number
  agents: AgentView[]
  onChange: (stage: StageDraft) => void
  onRemove: () => void
  showValidation: boolean
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
        {stage.steps.map((step) => {
          const isEmpty = step.prompt.trim().length === 0
          const showError = showValidation && isEmpty
          const agentName = agents.find((agent) => agent.id === step.agentId)?.name ?? 'this agent'
          return (
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
                aria-invalid={showError}
                className={cn(
                  'resize-none rounded-lg border bg-white px-2.5 py-2 text-[13px] outline-none placeholder:text-gray-400 focus:border-[#F5CA50]',
                  showError ? 'border-red-400 focus:border-red-400' : 'border-gray-200',
                )}
              />
              {showError && (
                <p className="text-[11.5px] font-semibold text-red-500">
                  Add instructions for {agentName} before running.
                </p>
              )}
            </div>
          )
        })}
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
  const [expanded, setExpanded] = useState(false)
  const displayStatus = getStepDisplayStatus(result)
  const text = result.output || result.error || ''
  const isLong = text.length > 180 || text.split('\n').length > 3

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[13px] font-bold text-gray-900">
          {displayStatus === 'success' && <CheckCircle2 className="size-4 text-green-500" />}
          {displayStatus === 'error' && <XCircle className="size-4 text-red-500" />}
          {displayStatus === 'needs_input' && <HelpCircle className="size-4 text-amber-500" />}
          {result.agentId}
          {displayStatus === 'needs_input' && <StatusBadge status="needs_input" />}
        </span>
        <span className="text-[11px] font-medium text-gray-400">
          stage {result.stageIndex + 1} · {result.attempts} attempt{result.attempts === 1 ? '' : 's'} · {result.latencyMs}ms
        </span>
      </div>
      {result.output ? (
        <div
          className={cn(
            'text-[12.5px] font-medium text-gray-600',
            '[&>*:not(:last-child)]:mb-2',
            '[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-0.5',
            '[&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:space-y-0.5',
            '[&_strong]:font-bold [&_strong]:text-gray-900',
            '[&_h1]:text-[13.5px] [&_h1]:font-bold [&_h1]:text-gray-900',
            '[&_h2]:text-[13px] [&_h2]:font-bold [&_h2]:text-gray-900',
            '[&_h3]:text-[12.5px] [&_h3]:font-bold [&_h3]:text-gray-900',
            !expanded && 'max-h-[4.5em] overflow-hidden',
          )}
        >
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      ) : (
        <p className={cn('text-[12.5px] font-medium text-gray-600', !expanded && 'line-clamp-3')}>{text}</p>
      )}
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="self-start text-[11px] font-bold text-[#B8860B] hover:underline"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  )
}

function hasEmptyStep(stages: StageDraft[]): boolean {
  return stages.some((stage) => stage.steps.some((step) => step.prompt.trim().length === 0))
}

export function PipelineBuilder({ agents }: { agents: AgentView[] }) {
  const [stages, setStages] = useState<StageDraft[]>(() => (agents[0] ? [newStage(agents[0].id)] : []))
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [runResult, setRunResult] = useState<PipelineRunResultView | null>(null)
  const [showValidation, setShowValidation] = useState(false)

  function updateStage(id: string, next: StageDraft) {
    setStages((prev) => prev.map((stage) => (stage.id === id ? next : stage)))
  }

  async function run() {
    if (stages.length === 0 || isRunning) return

    if (hasEmptyStep(stages)) {
      setShowValidation(true)
      return
    }
    setShowValidation(false)

    setIsRunning(true)
    setError(null)
    setRunResult(null)

    const payload = {
      name: 'Ad-hoc pipeline',
      stages: stages.map((stage) =>
        stage.parallel
          ? { parallel: stage.steps.map((step) => ({ agentId: step.agentId, prompt: step.prompt.trim() })) }
          : { agentId: stage.steps[0].agentId, prompt: stage.steps[0].prompt.trim() },
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
              showValidation={showValidation}
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
          {showValidation && hasEmptyStep(stages) && (
            <p className="text-[13px] font-bold text-red-500">
              Add instructions to every enabled stage before running the pipeline.
            </p>
          )}
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
                <StatusBadge status={getOverallDisplayStatus(runResult)} />
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

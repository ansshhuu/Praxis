'use client'

import { Loader2, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

import type { AgentExecutionResultView, AgentView } from './types'

function useTypewriter(fullText: string, active: boolean) {
  const [shown, setShown] = useState('')

  useEffect(() => {
    if (!active || !fullText) {
      setShown(active ? '' : fullText)
      return
    }
    setShown('')
    let index = 0
    const step = Math.max(1, Math.round(fullText.length / 120))
    const interval = setInterval(() => {
      index += step
      setShown(fullText.slice(0, index))
      if (index >= fullText.length) clearInterval(interval)
    }, 16)
    return () => clearInterval(interval)
  }, [fullText, active])

  return shown
}

async function readError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null)
  return (body as { error?: string } | null)?.error ?? fallback
}

export function AgentRunnerDrawer({ agent, onClose }: { agent: AgentView; onClose: () => void }) {
  const [prompt, setPrompt] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<AgentExecutionResultView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const revealing = useTypewriter(result?.output ?? '', Boolean(result))
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function run() {
    if (!prompt.trim() || isRunning) return
    setIsRunning(true)
    setError(null)
    setResult(null)
    try {
      const response = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id, prompt: prompt.trim() }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        setError((body as { error?: string } | null)?.error ?? (await readError(response, 'Agent run failed')))
        return
      }
      setResult((body as { result: AgentExecutionResultView }).result)
    } catch (runError) {
      setError((runError as Error).message)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Run ${agent.name}`}
        className="relative flex w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white p-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{agent.name}</h2>
            <p className="text-[13px] font-medium text-gray-500">{agent.description}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close runner">
            <X className="size-5" />
          </Button>
        </div>

        <div className="flex flex-col gap-5 p-5">
          <div className="flex flex-wrap gap-1.5">
            {agent.capabilities.map((capability) => (
              <span
                key={capability}
                className="rounded-full border border-gray-100 bg-gray-50 px-2.5 py-1 text-[11px] font-bold text-gray-600"
              >
                {capability}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="agent-prompt" className="text-[13px] font-bold text-gray-900 uppercase tracking-wide">
              Prompt
            </label>
            <Textarea
              id="agent-prompt"
              ref={inputRef}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={`Ask ${agent.name} to do something…`}
              rows={4}
            />
          </div>

          <Button
            className="bg-[#F5CA50] font-bold text-[#111111] hover:brightness-95"
            disabled={!prompt.trim() || isRunning}
            onClick={run}
          >
            {isRunning ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {isRunning ? 'Running…' : 'Run agent'}
          </Button>

          {error && <p className="text-[13px] font-bold text-red-500">{error}</p>}

          {result && (
            <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
              <div className="flex items-center justify-between">
                <StatusBadge status={result.status === 'success' ? 'success' : 'error'} />
                <span className="text-[12px] font-bold tabular-nums text-gray-500">
                  {result.latencyMs}ms · {result.provider}/{result.model}
                </span>
              </div>
              <p
                className={cn(
                  'whitespace-pre-wrap text-[13.5px] leading-relaxed font-medium text-gray-800',
                  revealing.length < (result.output.length ?? 0) && 'after:ml-0.5 after:inline-block after:h-4 after:w-[2px] after:animate-pulse after:bg-gray-400 after:align-middle after:content-[""]',
                )}
              >
                {result.output ? revealing : result.error}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

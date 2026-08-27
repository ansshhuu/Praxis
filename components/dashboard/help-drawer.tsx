'use client'

import {
  Bell,
  Bot,
  Briefcase,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LineChart,
  Sparkles,
  Workflow,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type HelpTopic = {
  id: string
  label: string
  icon: LucideIcon
  description: string
  steps: string[]
}

const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description:
      'A high-level overview of your workspace: active users, in-flight work, AI usage today, quick action triggers and the 30-day workflow success rate.',
    steps: [
      'Pick a window from the date-range dropdown (7, 30 or 90 days) to rescope the charts.',
      'Use the 7D / 30D / 90D tabs on the success-rate chart, and hover any point for that day’s rate and run count.',
      'Page through Recent Workflow Runs at the bottom left, or open a run’s ⋯ menu to jump to the workflow.',
      'Click Load more activities to extend the Recent Activity feed.',
      'Click Export Report to generate a PDF summary, or New Workflow to start building.',
    ],
  },
  {
    id: 'workflows',
    label: 'Workflows',
    icon: Workflow,
    description:
      'The visual automation builder: chain triggers, AI steps, logic and actions on a canvas, run saved workflows on a schedule, and start from prebuilt templates.',
    steps: [
      'Open Workflows and give the workflow a name in the header field.',
      'Drag nodes from the left palette onto the canvas and connect their handles to wire up the pipeline.',
      'Click any node to open its config drawer, fill in its settings, then Save and Run.',
      'Open History on a workflow to review its execution traces, or Scheduler to run it on a cadence instead of by hand.',
      'Browse Marketplace for a working template to copy into your own workflows instead of starting from an empty canvas.',
    ],
  },
  {
    id: 'agents',
    label: 'Agents',
    icon: Bot,
    description:
      '26 specialized autonomous agents across development, business, operations, marketing and content, runnable individually or chained into multi-agent pipelines.',
    steps: [
      'Open Agent Directory to browse the 26 agents and their current health and latency.',
      'Click Run on an agent to open its runner drawer, fill in its inputs, and watch it execute.',
      'Open Pipeline Builder to chain multiple agents so one agent’s output feeds the next.',
      'Save a pipeline, then run it and review each agent’s step in the trace.',
    ],
  },
  {
    id: 'automation',
    label: 'Automation',
    icon: Briefcase,
    description:
      'Domain-specific automation hubs for CRM, HR & Recruitment, Finance & Invoices, and Support & Tickets.',
    steps: [
      'Open CRM to qualify a lead — fill in contact, budget and timeline, then score it and plan the follow-up.',
      'Open HR & Recruitment to upload resumes with a job description, screen and rank candidates, generate interview questions, and draft offer letters.',
      'Open Finance & Invoices to upload an invoice or receipt for OCR extraction, categorization and anomaly detection.',
      'Open Support & Tickets to triage an incoming ticket, translate it, and draft a reply.',
    ],
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: FileText,
    description:
      'The centralized document repository and knowledge base: upload files, extract their text with OCR, and get an AI summary you can question in plain language.',
    steps: [
      'Click Upload Document and choose a file (50 MB max).',
      'Select the document from the list to open its detail pane.',
      'Run processing to extract the text and generate the AI summary.',
      'Read the summary, or type into Ask a question to query the document’s contents.',
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: LineChart,
    description:
      'Enterprise observability: usage trends, response-time percentiles, token consumption and cost, backing-service health, and generated reports.',
    steps: [
      'Open Analytics to review AI usage over time, workflow success versus failure, and response-time percentiles (p50, p95, p99).',
      'Scroll to System Health for live status of Postgres, MongoDB, Redis and ChromaDB.',
      'Check Agent Observability for token consumption, estimated cost, run counts and latency by provider.',
      'Open Reports to generate an Employee, Workflow, Sales, HR or AI Usage summary as PDF, Word or Excel.',
    ],
  },
  {
    id: 'ai',
    label: 'AI',
    icon: Sparkles,
    description:
      'AI Assistant chat, meeting transcription, the RAG knowledge-base playground, and multimodal tools for voice and computer vision.',
    steps: [
      'Open AI Assistant and type a question, or pick a suggested prompt — Shift+Enter inserts a newline instead of sending.',
      'Open Meetings to upload a recording or paste a transcript and get a summary, attendees and action items.',
      'Open Knowledge Base to ingest text or files, then query it and get an answer grounded in cited snippets.',
      'Open Multimodal Lab to record and transcribe voice, synthesize speech, or run OCR and object detection on an image.',
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    description:
      'The delivery log for every notification the platform has sent, plus per-channel configuration for email, SMS, push and Slack.',
    steps: [
      'Check the Notification Channels panel for how many messages each channel has sent or failed.',
      'Scan the Notification Log for individual messages.',
      'Read the Recipient column to see the address a message actually went to.',
      'Check the Status pill — a Failed row carries the delivery error in its message text.',
    ],
  },
]

function TopicCard({ topic }: { topic: HelpTopic }) {
  const [open, setOpen] = useState(false)
  const Icon = topic.icon
  const contentId = `help-panel-${topic.id}`

  return (
    <div className="shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#FFFAEC]/60"
      >
        <span className="flex size-8 shrink-0 items-center justify-center self-start rounded-lg border border-[#F5CA50]/30 bg-[#FFFAEC] text-[#D4A017]">
          <Icon className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 self-stretch">
          <span className="block text-[14px] leading-tight font-bold text-gray-900">
            {topic.label}
          </span>
          <span
            className={cn(
              'block text-[12.5px] leading-snug text-gray-500',
              !open && 'line-clamp-2',
            )}
          >
            {topic.description}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 self-start text-gray-400 transition-transform duration-200',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      <div
        id={contentId}
        aria-hidden={!open}
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-gray-100 px-4 pt-3.5 pb-4">
            <p className="mb-2 text-[10.5px] font-bold tracking-[0.08em] text-gray-400 uppercase">
              How to
            </p>
            <ol className="flex flex-col gap-2">
              {topic.steps.map((step, index) => (
                <li key={step} className="flex gap-2.5 text-[13px] leading-relaxed text-gray-700">
                  <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-[#EAE3D9] text-[10.5px] font-bold text-[#66615B] tabular-nums">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

export function HelpDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (open) closeRef.current?.focus()
  }, [open])

  return (
    <div
      className={cn('fixed inset-0 z-[60]', open ? 'pointer-events-auto' : 'pointer-events-none')}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-foreground/40 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0',
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Help and instructions"
        className={cn(
          'absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-[#F7F7F6] shadow-2xl transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#DFD6C9] bg-[#EAE3D9] px-5 py-4">
          <div>
            <h2 className="text-[17px] font-bold text-gray-900">Help &amp; Instructions</h2>
            <p className="mt-0.5 text-[12.5px] text-[#66615B]">
              What each module does, and how to use it.
            </p>
          </div>
          <Button
            ref={closeRef}
            variant="ghost"
            size="icon"
            aria-label="Close help"
            onClick={onClose}
            className="-mr-1 shrink-0 text-[#66615B] hover:bg-white/60 hover:text-[#111111]"
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain px-4 pt-4 pb-8">
          {HELP_TOPICS.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
          <p className="shrink-0 px-1 pt-1 text-center text-[11.5px] text-gray-400">
            Expand any module above to see its steps.
          </p>
        </div>
      </div>
    </div>
  )
}

'use client'

import {
  BarChart3,
  Bell,
  CalendarClock,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LineChart,
  MessageSquare,
  Mic,
  ScrollText,
  Settings,
  Store,
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
      'A live overview of your workspace: active users, in-flight work, AI usage today, and the 30-day workflow success rate. Everything on it is read from your real records.',
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
      'A drag-and-drop builder for automation pipelines. Chain triggers, AI steps, logic and actions on a canvas, then run the whole thing and watch each node report back.',
    steps: [
      'Open Workflows and give the workflow a name in the header field.',
      'Drag nodes from the left palette onto the canvas.',
      'Connect nodes by dragging from one node’s output handle to the next node’s input.',
      'Click any node to open its config drawer and fill in its settings.',
      'Click Save to persist the graph.',
      'Click Run to execute it, then open History to review past runs.',
    ],
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: FileText,
    description:
      'Upload PDFs, Office files and images, extract their text with OCR, and get an AI summary you can then question in plain language.',
    steps: [
      'Click Upload Document and choose a file (50 MB max).',
      'Select the document from the list to open its detail pane.',
      'Run processing to extract the text and generate the AI summary.',
      'Read the summary, or type into Ask a question to query the document’s contents.',
    ],
  },
  {
    id: 'resumes',
    label: 'Resumes',
    icon: ScrollText,
    description:
      'Score a batch of candidate CVs against a job description in one pass, ranked by match, with skills matched and missing called out per candidate.',
    steps: [
      'Paste the role’s Job Description into the text area.',
      'Upload the candidate resumes you want scored (PDF, DOCX or TXT).',
      'Click Screen Candidates and wait for scoring to finish.',
      'Review the ranked Screening Results table and each candidate’s match score.',
      'Open a candidate to see their AI assessment and generate interview questions.',
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    description:
      'Generate a document summarising your real platform data, with an AI-written insights section, saved as a downloadable file.',
    steps: [
      'Click Generate Report.',
      'Choose a Report Type (Employee, Workflow, Sales, HR or AI Usage).',
      'Choose a Format — PDF, Word or Excel.',
      'Confirm, then wait while the data is collected and summarised.',
      'Open or download the finished file from the reports table.',
    ],
  },
  {
    id: 'chat',
    label: 'AI Assistant',
    icon: MessageSquare,
    description:
      'A conversational assistant with context on your workspace. Ask it about your workflows, documents and activity instead of hunting through pages.',
    steps: [
      'Open AI Assistant from the AI tab.',
      'Type your question in the message box, or pick one of the suggested prompts.',
      'Press Enter to send — Shift+Enter inserts a newline instead.',
      'Keep asking follow-ups; the thread keeps its context.',
    ],
  },
  {
    id: 'meetings',
    label: 'Meetings',
    icon: Mic,
    description:
      'Turn a recording or a raw transcript into a summary, an attendee list and a set of action items.',
    steps: [
      'Click New Meeting.',
      'Either upload an audio recording (MP3, WAV or M4A) or paste an existing transcript.',
      'Start processing — audio is transcribed first, then analysed.',
      'Open the meeting to read its summary, attendees and extracted action items.',
    ],
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    icon: Store,
    description:
      'A library of prebuilt workflow templates. Start from a working pipeline instead of an empty canvas.',
    steps: [
      'Browse the template cards, or filter by category.',
      'Read a template’s description to check it fits your use case.',
      'Click Use Template to copy it into your own workflows.',
      'You land in the builder with the nodes already laid out — adjust the config and save.',
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    description:
      'The delivery log for every notification the platform has sent, including real emails dispatched by Notify and Email Action nodes.',
    steps: [
      'Check the Notification Channels panel for how many messages each channel has sent or failed.',
      'Scan the Notification Log for individual messages.',
      'Read the Recipient column to see the address a message actually went to.',
      'Check the Status pill — a Failed row carries the delivery error in its message text.',
    ],
  },
  {
    id: 'scheduler',
    label: 'Scheduler',
    icon: CalendarClock,
    description:
      'Run saved workflows on a repeating schedule instead of triggering them by hand.',
    steps: [
      'Click New Scheduled Job.',
      'Pick the workflow you want to run.',
      'Set the cadence with a Cron Expression, or pick one of the Quick Presets.',
      'Save the job — it appears in Scheduled Jobs with its next run time.',
      'Toggle a job inactive to pause it without deleting it.',
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: LineChart,
    description:
      'Deeper execution metrics than the dashboard: usage trends, success versus failure, response-time percentiles, API call volume and storage.',
    steps: [
      'Open Analytics from the Insights tab.',
      'Review AI Usage Over Time for request volume across modules.',
      'Compare the Workflow Success / Fail bars to spot bad days.',
      'Check the Response Time Trend (p50, p95, p99) for slow executions.',
      'Watch Storage Usage against your quota.',
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    description:
      'Your profile plus workspace administration. User management is restricted to admins.',
    steps: [
      'Open Settings from the avatar menu in the top right.',
      'Update your name and email under Personal Information and save.',
      'Admins: open the Users section to see everyone in the workspace.',
      'Admins: click Add User, set a name, email, role and temporary password to create an account.',
    ],
  },
]

function TopicCard({ topic }: { topic: HelpTopic }) {
  const [open, setOpen] = useState(false)
  const Icon = topic.icon
  const contentId = `help-panel-${topic.id}`

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#FFFAEC]/60"
      >
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#F5CA50]/30 bg-[#FFFAEC] text-[#D4A017]">
          <Icon className="size-4" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-bold text-gray-900">{topic.label}</span>
          <span className="mt-0.5 block text-[12.5px] leading-relaxed text-gray-500">
            {topic.description}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'mt-1 size-4 shrink-0 text-gray-400 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div id={contentId} className="border-t border-gray-100 px-4 py-3.5">
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
      )}
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

        <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-4">
          {HELP_TOPICS.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
          <p className="px-1 py-2 text-center text-[11.5px] text-gray-400">
            Expand any module above to see its steps.
          </p>
        </div>
      </div>
    </div>
  )
}

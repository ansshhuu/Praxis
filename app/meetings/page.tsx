'use client'

import {
  AlertTriangle,
  CalendarClock,
  CheckSquare,
  ClipboardList,
  FileAudio,
  ListChecks,
  Loader2,
  Mic,
  Plus,
  Sparkles,
  Upload,
  Users,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/ui/stat-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn } from '@/lib/utils'

type ApiStatus = 'PENDING' | 'TRANSCRIBING' | 'PROCESSED' | 'FAILED'

interface ActionItem {
  task: string
  assignee_guess: string | null
  deadline_guess: string | null
}

interface ApiMeeting {
  id: string
  fileName: string
  createdAt: string
  status: ApiStatus
  statusMessage: string | null
  duration: string
  durationSeconds: number | null
  attendees: string[]
  actionItemCount: number
  hasSummary: boolean
  hasTranscript: boolean
}

interface ApiMeetingDetail extends ApiMeeting {
  fileUrl: string
  transcript: string | null
  summary: string | null
  actionItems: ActionItem[]
}

const badgeStatus: Record<ApiStatus, string> = {
  PENDING: 'pending',
  TRANSCRIBING: 'running',
  PROCESSED: 'completed',
  FAILED: 'failed',
}

const statusLabels: Record<ApiStatus, string> = {
  PENDING: 'Pending',
  TRANSCRIBING: 'Transcribing',
  PROCESSED: 'Processed',
  FAILED: 'Failed',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

async function readError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null)
  return (body as { error?: string } | null)?.error ?? fallback
}

function readDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const audio = new Audio()
    const done = (value: number | null) => {
      URL.revokeObjectURL(url)
      resolve(value)
    }
    audio.preload = 'metadata'
    audio.onloadedmetadata = () =>
      done(Number.isFinite(audio.duration) ? audio.duration : null)
    audio.onerror = () => done(null)
    audio.src = url
    window.setTimeout(() => done(null), 5000)
  })
}

const fieldClass =
  'rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] font-medium text-gray-700 outline-none placeholder:text-gray-400 focus:ring-1 focus:ring-[#F5CA50] focus:border-[#F5CA50] shadow-sm transition-all'

function NewMeetingModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (meeting: ApiMeeting, processing: Promise<void>) => void
}) {
  const [mode, setMode] = useState<'audio' | 'transcript'>('audio')
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [transcript, setTranscript] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function submitAudio() {
    if (!file) return

    const form = new FormData()
    form.append('file', file)
    const duration = await readDuration(file)
    if (duration !== null) form.append('duration_seconds', String(duration))

    const response = await fetch('/api/meetings/upload', { method: 'POST', body: form })
    if (!response.ok) throw new Error(await readError(response, 'Upload failed'))

    const { meeting } = (await response.json()) as { meeting: ApiMeeting }

    const processing = fetch(`/api/meetings/${meeting.id}/process`, {
      method: 'POST',
    }).then(() => undefined)
    processing.catch(() => {})

    onCreated({ ...meeting, status: 'TRANSCRIBING' }, processing)
  }

  async function submitTranscript() {
    const created = await fetch('/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: title.trim() || 'Pasted transcript' }),
    })
    if (!created.ok) throw new Error(await readError(created, 'Could not create the meeting'))

    const { meeting } = (await created.json()) as { meeting: ApiMeeting }

    const processing = fetch(`/api/meetings/${meeting.id}/manual-transcript`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript }),
    }).then(() => undefined)
    processing.catch(() => {})

    onCreated({ ...meeting, status: 'TRANSCRIBING' }, processing)
  }

  async function handleSubmit() {
    if (isSaving) return
    setIsSaving(true)
    setError(null)
    try {
      if (mode === 'audio') await submitAudio()
      else await submitTranscript()
      onClose()
    } catch (submitError) {
      setError((submitError as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  const canSubmit = mode === 'audio' ? file !== null : transcript.trim().length >= 40

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 md:p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">New Meeting</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="size-5 text-gray-500" />
          </Button>
        </div>

        <div className="mb-5 flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
          {([
            { id: 'audio', label: 'Upload audio' },
            { id: 'transcript', label: 'Paste a transcript' },
          ] as const).map((option) => (
            <button
              key={option.id}
              id={`meeting-mode-${option.id}`}
              onClick={() => { setMode(option.id); setError(null) }}
              className={cn(
                'flex-1 rounded-lg px-3 py-2 text-[13px] font-bold transition-colors',
                mode === option.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {mode === 'audio' ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              const dropped = e.dataTransfer.files?.[0]
              if (dropped) { setFile(dropped); setError(null) }
            }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed py-12 transition-colors',
              isDragging
                ? 'border-[#F5CA50] bg-[#FFFAEC]'
                : 'border-gray-200 bg-gray-50 hover:border-[#F5CA50]/50 hover:bg-[#FFFAEC]',
            )}
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-[#EAE3D9] text-[#111111]">
              <Upload className="size-5" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900">
                {file ? file.name : 'Drop a recording here or click to browse'}
              </p>
              <p className="mt-1 text-xs text-gray-500">MP3, WAV or M4A — max 25 MB</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".mp3,.wav,.m4a,audio/*"
              onChange={(e) => {
                const picked = e.target.files?.[0]
                if (picked) { setFile(picked); setError(null) }
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-gray-900 uppercase tracking-wide" htmlFor="meeting-title">
                Meeting Title
              </label>
              <input
                id="meeting-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Q3 Planning Sync"
                className={fieldClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-gray-900 uppercase tracking-wide" htmlFor="meeting-transcript">
                Transcript
              </label>
              <textarea
                id="meeting-transcript"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={9}
                placeholder={'Ava: Let\'s review the Q3 roadmap.\nMarcus: I\'ll own the migration plan by Friday.\n…'}
                className={cn(fieldClass, 'resize-y font-normal leading-relaxed')}
              />
              <p className="text-[12px] font-medium text-gray-500">
                Paste notes or a transcript from any source — the same AI summary and action
                items are generated, with no audio needed.
              </p>
              {transcript.trim().length > 0 && transcript.trim().length < 40 && (
                <p className="text-[12px] font-bold text-amber-600">
                  Paste a transcript to continue — at least 40 characters are needed.
                </p>
              )}
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-[13px] font-bold text-red-500 text-center">{error}</p>}

        <div className="mt-8 flex gap-3">
          <Button variant="outline" className="flex-1 rounded-xl h-12 font-bold" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            className="flex-1 rounded-xl h-12 font-bold bg-[#F5CA50] text-[#111111] hover:brightness-95"
            onClick={() => void handleSubmit()}
            disabled={isSaving || !canSubmit}
          >
            {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Sparkles className="size-4 mr-2" />}
            {isSaving ? 'Working…' : 'Analyse Meeting'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function TranscriptFallback({
  meetingId,
  onDone,
}: {
  meetingId: string
  onDone: () => void
}) {
  const [open, setOpen] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (isSaving) return
    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/meetings/${meetingId}/manual-transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      })
      if (!response.ok) throw new Error(await readError(response, 'Could not analyse that transcript.'))
      onDone()
    } catch (submitError) {
      setError((submitError as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="rounded-lg font-bold"
        onClick={() => setOpen(true)}
      >
        <ClipboardList className="size-4 mr-2" />
        Or paste a transcript instead
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        rows={7}
        placeholder="Paste the meeting transcript here…"
        aria-label="Meeting transcript"
        className={cn(fieldClass, 'resize-y font-normal leading-relaxed')}
      />
      {error && <p className="text-[13px] font-bold text-red-500">{error}</p>}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="rounded-lg font-bold" onClick={() => setOpen(false)} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          size="sm"
          className="rounded-lg font-bold bg-[#F5CA50] text-[#111111] hover:brightness-95"
          onClick={() => void submit()}
          disabled={isSaving || transcript.trim().length < 40}
        >
          {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Sparkles className="size-4 mr-2" />}
          {isSaving ? 'Analysing…' : 'Analyse Transcript'}
        </Button>
      </div>
    </div>
  )
}

function MeetingDetailView({
  meetingId,
  summary,
  onChanged,
}: {
  meetingId: string
  summary: ApiMeeting
  onChanged: () => void
}) {
  const [meeting, setMeeting] = useState<ApiMeetingDetail | null>(null)
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript'>('summary')
  const [checked, setChecked] = useState<Record<number, boolean>>({})

  const status = meeting?.status ?? summary.status
  const isWorking = status === 'TRANSCRIBING' || status === 'PENDING'

  useEffect(() => {
    setChecked({})
  }, [meetingId])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const response = await fetch(`/api/meetings/${meetingId}`)
        if (!response.ok || cancelled) return
        const body = (await response.json()) as { meeting: ApiMeetingDetail }
        if (!cancelled) setMeeting(body.meeting)
      } catch {
      }
    }
    void load()
    const interval = isWorking ? setInterval(load, 3000) : null
    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
    }
  }, [meetingId, isWorking])

  const actionItems = meeting?.actionItems ?? []
  const attendees = meeting?.attendees ?? summary.attendees
  const statusMessage = meeting?.statusMessage ?? summary.statusMessage

  return (
    <Card className="h-full flex flex-col overflow-hidden rounded-2xl shadow-sm border-gray-100 p-0">
      <div className="p-5 border-b border-gray-100 shrink-0">
        <h3 className="font-bold text-gray-900 text-base truncate pr-2">
          {meeting?.fileName ?? summary.fileName}
        </h3>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-gray-500">
            {formatDate(meeting?.createdAt ?? summary.createdAt)} · {meeting?.duration ?? summary.duration}
          </span>
          <StatusBadge status={badgeStatus[status]} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isWorking && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Loader2 className="size-6 animate-spin text-[#D4A017]" />
            <p className="text-sm font-bold text-gray-900">
              {status === 'PENDING' ? 'Queued…' : 'Transcribing and analysing…'}
            </p>
            <p className="max-w-xs text-[13px] font-medium text-gray-500">
              Whisper transcribes the recording, then one AI call produces the summary and
              action items.
            </p>
          </div>
        )}

        {status === 'FAILED' && (
          <div className="flex flex-col gap-4 p-5">
            <div className="flex gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
              <AlertTriangle className="size-5 shrink-0 text-red-500" />
              <div>
                <p className="text-[13px] font-bold text-red-700">Transcription failed</p>
                <p className="mt-1 text-[13px] font-medium text-red-600">
                  {statusMessage ?? 'The audio could not be transcribed.'}
                </p>
              </div>
            </div>
            <TranscriptFallback meetingId={meetingId} onDone={onChanged} />
          </div>
        )}

        {status === 'PROCESSED' && (
          <>
            <div className="flex gap-1 border-b border-gray-100 px-5 pt-4">
              {([
                { id: 'summary', label: 'Summary & Actions' },
                { id: 'transcript', label: 'Transcript' },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'px-3 pb-3 text-[13px] font-bold transition-colors border-b-2 -mb-px',
                    activeTab === tab.id
                      ? 'border-[#F5CA50] text-gray-900'
                      : 'border-transparent text-gray-400 hover:text-gray-700',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'summary' ? (
              <div className="flex flex-col gap-6 p-5">
                {statusMessage && (
                  <p className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-[12.5px] font-medium text-amber-700">
                    {statusMessage}
                  </p>
                )}

                <section>
                  <h4 className="mb-2.5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-gray-400">
                    <Users className="size-3.5" /> Attendees
                  </h4>
                  {attendees.length === 0 ? (
                    <p className="text-[13px] font-medium text-gray-400">
                      No participant names identifiable from the transcript.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {attendees.map((name) => (
                        <span
                          key={name}
                          className="rounded-full bg-[#FFFAEC] border border-[#F5CA50]/40 px-3 py-1 text-[12.5px] font-bold text-[#8A6D1F]"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <h4 className="mb-2.5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-gray-400">
                    <Sparkles className="size-3.5" /> AI Summary
                  </h4>
                  {meeting?.summary ? (
                    <p className="text-[13.5px] leading-relaxed font-medium text-gray-700">
                      {meeting.summary}
                    </p>
                  ) : (
                    <p className="text-[13px] font-medium text-gray-400">
                      No summary was generated for this meeting.
                    </p>
                  )}
                </section>

                <section>
                  <h4 className="mb-2.5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-gray-400">
                    <ListChecks className="size-3.5" /> Action Items
                    {actionItems.length > 0 && (
                      <span className="text-gray-300">({actionItems.length})</span>
                    )}
                  </h4>
                  {actionItems.length === 0 ? (
                    <p className="text-[13px] font-medium text-gray-400">
                      No action items were identified.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {actionItems.map((item, index) => (
                        <li key={`${item.task}-${index}`}>
                          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-100 bg-white p-3 transition-colors hover:border-gray-200 hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={Boolean(checked[index])}
                              onChange={(e) =>
                                setChecked((prev) => ({ ...prev, [index]: e.target.checked }))
                              }
                              className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[#F5CA50]"
                            />
                            <div className="min-w-0">
                              <p
                                className={cn(
                                  'text-[13.5px] font-semibold text-gray-900',
                                  checked[index] && 'text-gray-400 line-through',
                                )}
                              >
                                {item.task}
                              </p>
                              {(item.assignee_guess || item.deadline_guess) && (
                                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                  {item.assignee_guess && (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11.5px] font-bold text-blue-700">
                                      <Users className="size-3" />
                                      {item.assignee_guess}
                                    </span>
                                  )}
                                  {item.deadline_guess && (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 text-[11.5px] font-bold text-orange-700">
                                      <CalendarClock className="size-3" />
                                      {item.deadline_guess}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            ) : (
              <div className="p-5">
                {meeting?.transcript ? (
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed font-medium text-gray-600">
                    {meeting.transcript}
                  </p>
                ) : (
                  <p className="text-[13px] font-medium text-gray-400">
                    No transcript is available for this meeting.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  )
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<ApiMeeting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/meetings')
      if (!response.ok) return
      const { meetings: rows } = (await response.json()) as { meetings: ApiMeeting[] }
      setMeetings(rows)
      setSelectedId((current) => current ?? rows[0]?.id ?? null)
    } catch {
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const hasWork = meetings.some((m) => m.status === 'TRANSCRIBING' || m.status === 'PENDING')
  useEffect(() => {
    if (!hasWork) return
    const interval = setInterval(() => void refresh(), 4000)
    return () => clearInterval(interval)
  }, [hasWork, refresh])

  const handleCreated = useCallback(
    (meeting: ApiMeeting, processing: Promise<void>) => {
      setMeetings((prev) => [meeting, ...prev])
      setSelectedId(meeting.id)
      void processing.finally(() => void refresh())
    },
    [refresh],
  )

  const selected = meetings.find((m) => m.id === selectedId) ?? null

  const processedCount = meetings.filter((m) => m.status === 'PROCESSED').length
  const openActions = meetings.reduce((total, m) => total + m.actionItemCount, 0)
  const totalSeconds = meetings.reduce((total, m) => total + (m.durationSeconds ?? 0), 0)
  const hoursAnalysed = totalSeconds > 0 ? (totalSeconds / 3600).toFixed(1) : '0'

  return (
    <DashboardShell>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Meetings</h1>
            <p className="mt-1 text-sm font-medium text-gray-500">
              Transcribe recordings and turn them into summaries and action items
            </p>
          </div>
          <Button
            id="new-meeting-button"
            className="bg-[#F5CA50] text-[#111111] hover:brightness-95 font-bold"
            onClick={() => setShowModal(true)}
          >
            <Plus className="size-4 mr-2" />
            New Meeting
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Meetings" value={String(meetings.length)} icon={Mic} />
          <StatCard
            title="Processed"
            value={String(processedCount)}
            icon={CheckSquare}
            iconColor="text-green-600"
            iconBg="bg-green-50"
          />
          <StatCard
            title="Action Items"
            value={String(openActions)}
            icon={ListChecks}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />
          <StatCard
            title="Hours Analysed"
            value={hoursAnalysed}
            icon={CalendarClock}
            iconColor="text-violet-600"
            iconBg="bg-violet-50"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div className="flex flex-col gap-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))
            ) : meetings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center py-16 text-center">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-gray-100">
                    <FileAudio className="size-8 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">No meetings yet</h3>
                  <p className="mt-1 max-w-xs text-[13px] font-medium text-gray-500">
                    Upload a recording — or paste a transcript — to get an AI summary,
                    action items and attendees.
                  </p>
                  <Button
                    className="mt-5 bg-[#F5CA50] text-[#111111] hover:brightness-95 font-bold"
                    onClick={() => setShowModal(true)}
                  >
                    <Plus className="size-4 mr-2" /> New Meeting
                  </Button>
                </CardContent>
              </Card>
            ) : (
              meetings.map((meeting) => (
                <button
                  key={meeting.id}
                  id={`meeting-row-${meeting.id}`}
                  onClick={() => setSelectedId(meeting.id)}
                  className={cn(
                    'flex items-center gap-4 rounded-2xl border p-4 text-left transition-all',
                    selectedId === meeting.id
                      ? 'border-[#F5CA50] bg-[#FFFAEC] shadow-sm ring-1 ring-[#F5CA50]/50'
                      : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm',
                  )}
                >
                  <div className="shrink-0 rounded-xl border border-gray-100 bg-gray-50 p-2.5">
                    <FileAudio className="size-7 text-[#D4A017]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-gray-900">
                      {meeting.fileName}
                    </p>
                    <p className="mt-0.5 text-[12.5px] font-medium text-gray-500">
                      {formatDate(meeting.createdAt)} · {meeting.duration}
                      {meeting.actionItemCount > 0 && ` · ${meeting.actionItemCount} action items`}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <StatusBadge status={badgeStatus[meeting.status]} />
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                        {statusLabels[meeting.status]}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="min-h-[520px]">
            {selected ? (
              <MeetingDetailView
                key={selected.id}
                meetingId={selected.id}
                summary={selected}
                onChanged={refresh}
              />
            ) : (
              !isLoading && (
                <Card className="h-full">
                  <CardContent className="flex h-full flex-col items-center justify-center py-16 text-center">
                    <Mic className="mb-3 size-8 text-gray-300" />
                    <p className="text-[13px] font-medium text-gray-500">
                      Select a meeting to see its summary and action items.
                    </p>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <NewMeetingModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </DashboardShell>
  )
}

'use client'

import {
  Award,
  Check,
  ChevronRight,
  FileText,
  Loader2,
  ScrollText,
  Sparkles,
  Upload,
  X,
  Users,
  Target,
  ShieldCheck
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import React from 'react'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatCard } from '@/components/ui/stat-card'
import { cn } from '@/lib/utils'

// ─── Types & helpers ──────────────────────────────────────────────────────────

interface Candidate {
  id: string
  documentId: string
  screeningId: string
  name: string
  email: string | null
  matchScore: number
  rank: number
  skillsMatched: string[]
  skillsMissing: string[]
  yearsExperience: number | null
  currentRole: string | null
  education: string | null
  summary: string | null
  fileName: string
  createdAt: string
}

interface CandidateDetail extends Candidate {
  interviewQuestions: string[]
  resumeText: string | null
  fileUrl: string
  jobDescription: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`
}

async function readError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null)
  return (body as { error?: string } | null)?.error ?? fallback
}

// ─── Rank badge ───────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  const styles: Record<number, string> = {
    1: 'bg-[#FFFAEC] text-[#D4A017] border-[#F5CA50]/30',
    2: 'bg-gray-100 text-gray-700 border-gray-200',
    3: 'bg-orange-50 text-orange-700 border-orange-200',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold',
        styles[rank] ?? 'bg-gray-50 text-gray-500 border-gray-100',
      )}
    >
      {rank <= 3 && <Award className="size-3" />}
      #{rank}
    </span>
  )
}

function ScoreBar({ score }: { score: number }) {
  // Use green for high score, amber for medium, red for low
  const color =
    score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-[#F5CA50]' : 'bg-red-500'
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${score}%` }} />
      </div>
      <span className="tabular-nums text-[13px] font-bold text-gray-900">{score}%</span>
    </div>
  )
}

// ─── Candidate Detail Drawer ──────────────────────────────────────────────────

function CandidateDrawer({
  candidate: initial,
  onClose,
}: {
  candidate: Candidate
  onClose: () => void
}) {
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null)
  const [questions, setQuestions] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [questionError, setQuestionError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch(`/api/resumes/${initial.id}`)
        if (!response.ok || cancelled) return
        const { candidate: detail } = (await response.json()) as { candidate: CandidateDetail }
        if (cancelled) return
        setCandidate(detail)
        setQuestions(detail.interviewQuestions)
      } catch {
        // Keep the row data already on screen.
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [initial.id])

  async function generateQuestions() {
    if (isGenerating) return
    setIsGenerating(true)
    setQuestionError(null)
    try {
      const response = await fetch(`/api/resumes/${initial.id}/questions`, { method: 'POST' })
      if (!response.ok) {
        setQuestionError(await readError(response, 'Could not generate questions'))
        return
      }
      const { questions: generated } = (await response.json()) as { questions: string[] }
      setQuestions(generated)
    } catch (error) {
      setQuestionError((error as Error).message)
    } finally {
      setIsGenerating(false)
    }
  }

  const view = candidate ?? initial
  const experienceLine = [
    view.yearsExperience !== null ? `${view.yearsExperience} yrs experience` : null,
    view.education,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${view.name} details`}
        className="relative flex w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white p-4 md:p-6">
          <div className="flex items-center gap-3">
             <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 font-bold text-sm">
                {view.name.charAt(0)}
             </div>
             <div>
               <h2 className="text-lg font-bold text-gray-900">{view.name}</h2>
               <p className="text-[13px] text-gray-500 font-medium">{view.currentRole ?? view.fileName}</p>
             </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close drawer">
            <X className="size-5" />
          </Button>
        </div>

        <div className="flex flex-col gap-6 p-4 md:p-6">
          {/* Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">AI Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[13.5px] text-gray-700 leading-relaxed font-medium">
                {view.summary ?? 'No assessment was returned for this candidate.'}
              </p>
            </CardContent>
          </Card>

          {/* Score */}
          <div className="flex items-center gap-5">
            <div className="flex size-16 flex-col items-center justify-center rounded-2xl bg-[#FFFAEC] border border-[#F5CA50]/30 text-[#D4A017]">
              <span className="text-2xl font-bold tabular-nums">{view.matchScore}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Match Score</p>
              <p className="text-[13px] font-medium text-gray-500 mt-0.5">{experienceLine || view.fileName}</p>
            </div>
            <div className="ml-auto">
              <RankBadge rank={view.rank} />
            </div>
          </div>

          {/* Skills breakdown */}
          <div>
            <p className="mb-3 text-[13px] font-bold text-gray-900 uppercase tracking-wide">Skills Matched</p>
            <div className="flex flex-wrap gap-2">
              {view.skillsMatched.map((s) => (
                <span key={s} className="flex items-center gap-1.5 rounded-full bg-green-50 border border-green-100 px-3 py-1.5 text-[12px] font-bold text-green-700">
                  <Check className="size-3.5" /> {s}
                </span>
              ))}
            </div>
          </div>
          {view.skillsMissing.length > 0 && (
            <div className="pt-2 border-t border-gray-50">
              <p className="mb-3 text-[13px] font-bold text-gray-500 uppercase tracking-wide">Skills Missing</p>
              <div className="flex flex-wrap gap-2">
                {view.skillsMissing.map((s) => (
                  <span key={s} className="rounded-full bg-red-50 border border-red-100 px-3 py-1.5 text-[12px] font-bold text-red-600">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Interview questions */}
          <div className="pt-2 border-t border-gray-50">
            <p className="mb-4 text-[13px] font-bold text-gray-900 uppercase tracking-wide">AI-Generated Interview Questions</p>
            {questions.length > 0 ? (
              <ol className="flex flex-col gap-4">
                {questions.map((q, i) => (
                  <li key={i} className="flex gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white border border-gray-200 text-[11px] font-bold text-gray-900">
                      {i + 1}
                    </span>
                    <p className="text-[13.5px] font-medium leading-relaxed text-gray-700">{q}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="flex flex-col items-start gap-3 bg-gray-50 p-5 rounded-xl border border-gray-100 text-center items-center">
                <Sparkles className="size-6 text-gray-400 mb-1" />
                <p className="text-[13px] text-gray-500 font-medium max-w-xs">
                  Generate personalized interview questions based on the resume and job description.
                </p>
                <Button
                  className="bg-[#F5CA50] text-[#111111] hover:brightness-95 w-full mt-2"
                  onClick={generateQuestions}
                  disabled={isGenerating}
                >
                  {isGenerating ? <Loader2 className="size-4 animate-spin mr-2" /> : <Sparkles className="size-4 mr-2" />}
                  {isGenerating ? 'Generating…' : 'Generate questions'}
                </Button>
              </div>
            )}
            {questionError && <p className="mt-2 text-xs text-red-500 font-medium text-center">{questionError}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────

function UploadZone({
  onScreen,
  error,
}: {
  onScreen: (files: File[], jobDescription: string) => void
  error: string | null
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [jobDescription, setJobDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  function addFiles(list: FileList | null) {
    if (!list?.length) return
    setFiles((previous) => {
      const incoming = Array.from(list)
      const seen = new Set(previous.map((file) => `${file.name}:${file.size}`))
      return [...previous, ...incoming.filter((file) => !seen.has(`${file.name}:${file.size}`))]
    })
  }

  function removeFile(index: number) {
    setFiles((previous) => previous.filter((_, i) => i !== index))
  }

  const canScreen = files.length > 0 && jobDescription.trim().length >= 20

  return (
    <Card className="max-w-3xl mx-auto w-full">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl">Screen Candidates</CardTitle>
        <CardDescription>Upload resumes and provide a job description to instantly rank candidates</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 pt-4">
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files) }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed py-10 transition-colors',
            isDragging ? 'border-[#F5CA50] bg-[#FFFAEC]' : 'border-gray-200 bg-gray-50 hover:border-[#F5CA50]/50 hover:bg-[#FFFAEC]',
          )}
        >
          <div className="flex size-14 items-center justify-center rounded-full bg-[#EAE3D9] text-[#111111]">
            <Upload className="size-6" />
          </div>
          <div className="text-center">
            <p className="text-[15px] font-bold text-gray-900">
              {files.length === 0
                ? 'Drop resume files here'
                : files.length === 1
                  ? files[0].name
                  : `${files.length} resumes selected`}
            </p>
            <p className="text-[13px] text-gray-500 mt-1 font-medium">PDF, DOCX — multiple files supported</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.docx,.doc,.txt"
            onChange={(e) => {
              addFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>

        {files.length > 0 && (
          <ul className="flex flex-col gap-2">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${file.size}-${index}`}
                className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                  <FileText className="size-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <span className="truncate text-sm font-bold text-gray-900">{file.name}</span>
                  <span className="text-[12px] font-medium text-gray-500">{formatFileSize(file.size)}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeFile(index) }}
                  aria-label={`Remove ${file.name}`}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-bold text-gray-900 uppercase tracking-wide">Job Description</label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here — skills, requirements, responsibilities…"
            rows={6}
            className="resize-none rounded-xl border border-gray-200 bg-white p-4 text-[14px] outline-none placeholder:text-gray-400 focus:border-[#F5CA50] focus:ring-1 focus:ring-[#F5CA50] shadow-sm transition-all"
          />
        </div>

        {error && <p className="text-[13px] font-bold text-red-500 text-center">{error}</p>}

        <Button
          className="w-full bg-[#F5CA50] text-[#111111] hover:brightness-95 h-12 text-[15px] font-bold rounded-xl mt-2"
          disabled={!canScreen}
          onClick={() => onScreen(files, jobDescription.trim())}
        >
          Screen Candidates
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Results Table ────────────────────────────────────────────────────────────

function ResultsTable({ candidates, onSelect }: { candidates: Candidate[]; onSelect: (id: string) => void }) {
  return (
    <Card className="overflow-hidden">
      <div className="p-5 md:p-6 flex items-center justify-between border-b border-gray-100 bg-white">
        <div>
          <CardTitle className="text-xl">Screening Results</CardTitle>
          <CardDescription className="mt-1">{candidates.length} candidates ranked by AI match score</CardDescription>
        </div>
      </div>
      <div className="overflow-x-auto bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] pl-6">Rank</TableHead>
              <TableHead>Candidate</TableHead>
              <TableHead>Match Score</TableHead>
              <TableHead>Key Skills</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.map((c) => (
              <TableRow
                key={c.id}
                className="cursor-pointer group"
                onClick={() => onSelect(c.id)}
              >
                <TableCell className="pl-6"><RankBadge rank={c.rank} /></TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 font-bold text-sm">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-gray-900">{c.name}</p>
                      <p className="text-[12px] font-medium text-gray-500">{c.email ?? (c.yearsExperience !== null ? `${c.yearsExperience} yrs exp` : c.fileName)}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell><ScoreBar score={c.matchScore} /></TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    {c.skillsMatched.slice(0, 3).map((s) => (
                      <span key={s} className="rounded-md bg-[#FFFAEC] border border-[#F5CA50]/30 px-2 py-0.5 text-[11px] font-bold text-[#D4A017] uppercase tracking-wide">
                        {s}
                      </span>
                    ))}
                    {c.skillsMatched.length > 3 && (
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-500">+{c.skillsMatched.length - 3}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                   <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700 uppercase tracking-wider border border-green-100">
                     Screened
                   </span>
                </TableCell>
                <TableCell className="pr-6">
                  <div className="flex size-8 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 group-hover:bg-[#F5CA50] group-hover:text-[#111111] group-hover:border-transparent transition-colors">
                     <ChevronRight className="size-4" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ResumesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [hasResults, setHasResults] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [screenError, setScreenError] = useState<string | null>(null)
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const response = await fetch('/api/resumes')
        if (!response.ok || cancelled) return
        const { candidates: rows } = (await response.json()) as { candidates: Candidate[] }
        if (cancelled || rows.length === 0) return

        const latest = rows.filter((row) => row.screeningId === rows[0].screeningId)
        setCandidates(latest)
        setHasResults(true)
      } catch {}
    }
    void load()
    return () => { cancelled = true }
  }, [])

  const handleScreen = useCallback(async (files: File[], jobDescription: string) => {
    setIsProcessing(true)
    setScreenError(null)

    try {
      const form = new FormData()
      form.append('jobDescription', jobDescription)
      for (const file of files) form.append('resumes', file)

      const response = await fetch('/api/resumes/screen', { method: 'POST', body: form })
      if (!response.ok) {
        setScreenError(await readError(response, 'Screening failed, please try again.'))
        return
      }

      const { candidates: ranked, skipped } = (await response.json()) as {
        candidates: Candidate[]
        skipped: { fileName: string; reason: string }[]
      }

      setCandidates(ranked)
      setHasResults(true)
      setScreenError(
        skipped.length > 0
          ? `Skipped ${skipped.length} file(s): ${skipped.map((s) => `${s.fileName} — ${s.reason}`).join('; ')}`
          : null,
      )
    } catch (error) {
      setScreenError((error as Error).message)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId) ?? null

  const avgMatch = hasResults && candidates.length > 0 
    ? Math.round(candidates.reduce((acc, c) => acc + c.matchScore, 0) / candidates.length)
    : 0

  return (
    <DashboardShell>
      <div className="mx-auto flex max-w-[1400px] w-full flex-col gap-6 md:p-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Resume Screening</h1>
            <p className="mt-1 text-sm text-gray-500 font-medium">
              AI-powered candidate ranking against job descriptions
            </p>
          </div>
          {hasResults && !isProcessing && (
            <Button
              className="bg-[#F5CA50] text-[#111111] hover:brightness-95 font-bold"
              onClick={() => {
                setHasResults(false)
                setScreenError(null)
              }}
            >
              <Upload className="size-4 mr-2" />
              New Screening
            </Button>
          )}
        </div>

        {/* Top Stat Row */}
        {hasResults && !isProcessing && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-2">
            <StatCard title="Total Resumes" value={candidates.length.toString()} icon={Users} />
            <StatCard title="Avg Match Score" value={`${avgMatch}%`} icon={Target} />
            <StatCard title="Auto-Screened" value={candidates.length.toString()} icon={ShieldCheck} iconColor="text-green-600" iconBg="bg-green-50" />
          </div>
        )}

        {isProcessing ? (
          <Card className="max-w-2xl mx-auto w-full border-none shadow-none bg-transparent">
            <CardContent className="flex flex-col items-center gap-6 py-20 text-center">
              <div className="relative flex items-center justify-center size-20">
                 <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-[#F5CA50] rounded-full border-t-transparent animate-spin"></div>
                 <Sparkles className="size-8 text-[#D4A017] animate-pulse" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">Analyzing Candidates</p>
                <p className="mt-2 text-sm text-gray-500 font-medium">Extracting skills, assessing experience, and scoring matches against the job description.</p>
              </div>
            </CardContent>
          </Card>
        ) : hasResults ? (
          <ResultsTable candidates={candidates} onSelect={setSelectedCandidateId} />
        ) : (
          <UploadZone onScreen={handleScreen} error={screenError} />
        )}

        {hasResults && !isProcessing && screenError && (
          <div className="rounded-xl bg-red-50 p-4 border border-red-100">
            <p className="text-[13px] font-bold text-red-600">{screenError}</p>
          </div>
        )}
      </div>

      {selectedCandidate && (
        <CandidateDrawer candidate={selectedCandidate} onClose={() => setSelectedCandidateId(null)} />
      )}
    </DashboardShell>
  )
}

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
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

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
import { cn } from '@/lib/utils'

// ─── Types & helpers ──────────────────────────────────────────────────────────

/** Wire format returned by /api/resumes. */
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

/** Human-readable size for a staged (not yet uploaded) file. */
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
    1: 'bg-amber-100 text-amber-700 border-amber-200',
    2: 'bg-slate-100 text-slate-600 border-slate-200',
    3: 'bg-orange-100 text-orange-700 border-orange-200',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        styles[rank] ?? 'bg-muted text-muted-foreground border-border',
      )}
    >
      {rank <= 3 && <Award className="size-3" />}
      #{rank}
    </span>
  )
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 85 ? 'bg-success' : score >= 70 ? 'bg-warning' : 'bg-destructive'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${score}%` }} />
      </div>
      <span className="tabular-nums text-xs font-medium text-foreground">{score}%</span>
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

  /** Only ever fired by the button below — never automatically. */
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
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${view.name} details`}
        className="relative flex w-full max-w-md flex-col overflow-y-auto bg-card shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card p-4">
          <div>
            <h2 className="text-lg font-semibold">{view.name}</h2>
            <p className="text-sm text-muted-foreground">{view.currentRole ?? view.fileName}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close drawer" id="close-candidate-drawer">
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex flex-col gap-6 p-4">
          {/* Summary */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">AI Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {view.summary ?? 'No assessment was returned for this candidate.'}
              </p>
            </CardContent>
          </Card>

          {/* Score */}
          <div className="flex items-center gap-4">
            <div className="flex size-16 flex-col items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <span className="text-xl font-bold tabular-nums">{view.matchScore}</span>
              <span className="text-[10px] font-medium">/ 100</span>
            </div>
            <div>
              <p className="text-sm font-medium">Match Score</p>
              <p className="text-xs text-muted-foreground">{experienceLine || view.fileName}</p>
            </div>
            <div className="ml-auto">
              <RankBadge rank={view.rank} />
            </div>
          </div>

          {/* Skills breakdown */}
          <div>
            <p className="mb-2 text-sm font-semibold">Skills Matched</p>
            <div className="flex flex-wrap gap-1.5">
              {view.skillsMatched.map((s) => (
                <span key={s} className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                  <Check className="size-3" /> {s}
                </span>
              ))}
            </div>
          </div>
          {view.skillsMissing.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-muted-foreground">Skills Missing</p>
              <div className="flex flex-wrap gap-1.5">
                {view.skillsMissing.map((s) => (
                  <span key={s} className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Interview questions — generated only when asked for. */}
          <div>
            <p className="mb-3 text-sm font-semibold">AI-Generated Interview Questions</p>
            {questions.length > 0 ? (
              <ol className="flex flex-col gap-3">
                {questions.map((q, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-foreground/80">{q}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="flex flex-col items-start gap-2">
                <p className="text-sm text-muted-foreground">
                  Generate five questions tailored to this candidate and the job description.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateQuestions}
                  disabled={isGenerating}
                  id="generate-questions-button"
                >
                  {isGenerating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  {isGenerating ? 'Generating…' : 'Generate questions'}
                </Button>
              </div>
            )}
            {questionError && <p className="mt-2 text-xs text-destructive">{questionError}</p>}
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
      // Now that staged files are visible and individually removable, a second
      // drop appends instead of replacing — but re-picking the same file must
      // not create a duplicate row.
      const seen = new Set(previous.map((file) => `${file.name}:${file.size}`))
      return [...previous, ...incoming.filter((file) => !seen.has(`${file.name}:${file.size}`))]
    })
  }

  function removeFile(index: number) {
    setFiles((previous) => previous.filter((_, i) => i !== index))
  }

  const canScreen = files.length > 0 && jobDescription.trim().length >= 20

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Screen Candidates</CardTitle>
        <CardDescription>Upload resumes and provide a job description to rank candidates</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files) }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed py-8 transition-colors',
            isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/40 hover:border-primary/50 hover:bg-primary/5',
          )}
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Upload className="size-5" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">
              {files.length === 0
                ? 'Drop resume files here'
                : files.length === 1
                  ? files[0].name
                  : `${files.length} resumes selected`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">PDF, DOCX — multiple files supported</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.docx,.doc,.txt"
            onChange={(e) => {
              addFiles(e.target.files)
              // Clear the input so removing a file and re-picking it still
              // fires a change event.
              e.target.value = ''
            }}
          />
        </div>

        {files.length > 0 && (
          <ul className="flex flex-col gap-1.5" id="staged-resume-list">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${file.size}-${index}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2"
              >
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm font-medium text-foreground">{file.name}</span>
                <span className="ml-auto shrink-0 tabular-nums text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  aria-label={`Remove ${file.name}`}
                  className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="job-description-input">Job Description</label>
          <textarea
            id="job-description-input"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here — skills, requirements, responsibilities…"
            rows={5}
            className="resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          id="screen-candidates-button"
          className="w-full"
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
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Screening Results</CardTitle>
        <CardDescription>{candidates.length} candidates ranked by AI match score</CardDescription>
      </CardHeader>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Rank</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Match Score</TableHead>
              <TableHead>Skills Matched</TableHead>
              <TableHead>Experience</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.map((c) => (
              <TableRow
                key={c.id}
                className="cursor-pointer"
                onClick={() => onSelect(c.id)}
                id={`candidate-row-${c.id}`}
              >
                <TableCell><RankBadge rank={c.rank} /></TableCell>
                <TableCell>
                  <p className="font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.email ?? c.fileName}</p>
                </TableCell>
                <TableCell><ScoreBar score={c.matchScore} /></TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {c.skillsMatched.slice(0, 3).map((s) => (
                      <span key={s} className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">{s}</span>
                    ))}
                    {c.skillsMatched.length > 3 && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">+{c.skillsMatched.length - 3}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {c.yearsExperience !== null ? `${c.yearsExperience} yrs` : '—'}
                </TableCell>
                <TableCell>
                  <ChevronRight className="size-4 text-muted-foreground" />
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

  // Restore the most recent screening on load. Older screenings are filtered
  // out so ranks (each run numbers from 1) don't interleave in the table.
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
      } catch {
        // No previous screening on screen — the upload zone is the right state.
      }
    }

    void load()
    return () => {
      cancelled = true
    }
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
      // Partial success still shows results — the skipped files are named so
      // the user knows which resumes never made it into the ranking.
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

  return (
    <DashboardShell>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Resume Screening</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AI-powered candidate ranking against job descriptions
          </p>
        </div>

        {isProcessing ? (
          <Card className="shadow-sm">
            <CardContent className="flex flex-col items-center gap-4 py-16">
              <Loader2 className="size-10 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium">Analyzing candidates…</p>
                <p className="mt-1 text-sm text-muted-foreground">Extracting skills, scoring matches</p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-sm">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : hasResults ? (
          <ResultsTable candidates={candidates} onSelect={setSelectedCandidateId} />
        ) : (
          <UploadZone onScreen={handleScreen} error={screenError} />
        )}

        {hasResults && !isProcessing && screenError && (
          <p className="text-sm text-muted-foreground">{screenError}</p>
        )}

        {hasResults && !isProcessing && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setHasResults(false)
                setScreenError(null)
              }}
              id="new-screening-button"
            >
              <ScrollText className="size-4" />
              New Screening
            </Button>
          </div>
        )}
      </div>

      {selectedCandidate && (
        <CandidateDrawer candidate={selectedCandidate} onClose={() => setSelectedCandidateId(null)} />
      )}
    </DashboardShell>
  )
}

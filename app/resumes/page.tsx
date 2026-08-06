'use client'

import {
  Award,
  Check,
  ChevronRight,
  Loader2,
  ScrollText,
  Upload,
  X,
} from 'lucide-react'
import { useState } from 'react'

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
import { getCandidateById, getCandidates, type ResumeCandidate } from '@/lib/mock-data/resumes'

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

function CandidateDrawer({ candidate, onClose }: { candidate: ResumeCandidate; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${candidate.name} details`}
        className="relative flex w-full max-w-md flex-col overflow-y-auto bg-card shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card p-4">
          <div>
            <h2 className="text-lg font-semibold">{candidate.name}</h2>
            <p className="text-sm text-muted-foreground">{candidate.currentRole}</p>
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
              <p className="text-sm text-foreground/80 leading-relaxed">{candidate.summary}</p>
            </CardContent>
          </Card>

          {/* Score */}
          <div className="flex items-center gap-4">
            <div className="flex size-16 flex-col items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <span className="text-xl font-bold tabular-nums">{candidate.matchScore}</span>
              <span className="text-[10px] font-medium">/ 100</span>
            </div>
            <div>
              <p className="text-sm font-medium">Match Score</p>
              <p className="text-xs text-muted-foreground">{candidate.yearsExperience} yrs experience · {candidate.education}</p>
            </div>
            <div className="ml-auto">
              <RankBadge rank={candidate.rank} />
            </div>
          </div>

          {/* Skills breakdown */}
          <div>
            <p className="mb-2 text-sm font-semibold">Skills Matched</p>
            <div className="flex flex-wrap gap-1.5">
              {candidate.skillsMatched.map((s) => (
                <span key={s} className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                  <Check className="size-3" /> {s}
                </span>
              ))}
            </div>
          </div>
          {candidate.skillsMissing.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-muted-foreground">Skills Missing</p>
              <div className="flex flex-wrap gap-1.5">
                {candidate.skillsMissing.map((s) => (
                  <span key={s} className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Interview questions */}
          <div>
            <p className="mb-3 text-sm font-semibold">AI-Generated Interview Questions</p>
            <ol className="flex flex-col gap-3">
              {candidate.interviewQuestions.map((q, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-foreground/80">{q}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────

function UploadZone({ onScreen }: { onScreen: () => void }) {
  const [isDragging, setIsDragging] = useState(false)
  const [jobDescription, setJobDescription] = useState('')

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
          onDrop={(e) => { e.preventDefault(); setIsDragging(false) }}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed py-8 transition-colors',
            isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/40 hover:border-primary/50 hover:bg-primary/5',
          )}
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Upload className="size-5" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Drop resume files here</p>
            <p className="text-xs text-muted-foreground mt-0.5">PDF, DOCX — multiple files supported</p>
          </div>
        </div>

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

        <Button
          id="screen-candidates-button"
          className="w-full"
          onClick={onScreen}
        >
          Screen Candidates
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Results Table ────────────────────────────────────────────────────────────

function ResultsTable({ candidates, onSelect }: { candidates: ResumeCandidate[]; onSelect: (id: string) => void }) {
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
                  <p className="text-xs text-muted-foreground">{c.email}</p>
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
                <TableCell className="text-sm text-muted-foreground">{c.yearsExperience} yrs</TableCell>
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
  const [hasResults, setHasResults] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const candidates = getCandidates()

  function handleScreen() {
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
      setHasResults(true)
    }, 1800)
  }

  const selectedCandidate = selectedCandidateId ? getCandidateById(selectedCandidateId) : null

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
                <p className="mt-1 text-sm text-muted-foreground">Extracting skills, scoring matches, generating questions</p>
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
          <UploadZone onScreen={handleScreen} />
        )}

        {hasResults && !isProcessing && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setHasResults(false)} id="new-screening-button">
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

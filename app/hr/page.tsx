'use client'

import { Check, ChevronDown, Copy, Download, FileText, Loader2, Pencil, RotateCw, Sparkles, Upload, UsersRound, X } from 'lucide-react'
import { Fragment, useRef, useState } from 'react'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

const CURRENCIES = [
  { value: '$', label: '$ USD' },
  { value: '₹', label: '₹ INR' },
  { value: '€', label: '€ EUR' },
  { value: '£', label: '£ GBP' },
]

const SALARY_PERIODS = [
  { value: 'per year', label: '/ year' },
  { value: 'per month', label: '/ month' },
]

interface Candidate {
  id: string
  name: string
  email: string | null
  matchScore: number
  rank: number
  fileName: string
  skillsMatched: string[]
  skillsMissing: string[]
}

type PanelTab = 'score' | 'questions'

async function readError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null)
  return (body as { error?: string } | null)?.error ?? fallback
}

function ScoreBadge({ score }: { score: number }) {
  const style = score >= 80 ? 'bg-green-50 text-green-700 border-green-100' : score >= 60 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-700 border-red-100'
  return <span className={cn('rounded-full border px-2.5 py-0.5 text-[12px] font-bold', style)}>{score}%</span>
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg px-3 py-1.5 text-[12.5px] font-bold transition-colors',
        active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
      )}
    >
      {children}
    </button>
  )
}

function CandidateDetailPanel({
  candidate,
  activeTab,
  onTabChange,
  questions,
  isGeneratingQuestions,
  questionsError,
  onGenerateQuestions,
}: {
  candidate: Candidate
  activeTab: PanelTab
  onTabChange: (tab: PanelTab) => void
  questions: string[] | undefined
  isGeneratingQuestions: boolean
  questionsError: string | null
  onGenerateQuestions: () => void
}) {
  return (
    <div className="border-t border-gray-100 bg-gray-50/60 p-5">
      <div className="mb-4 inline-flex gap-1 rounded-xl bg-gray-100 p-1">
        <TabButton active={activeTab === 'score'} onClick={() => onTabChange('score')}>
          Score Breakdown
        </TabButton>
        <TabButton active={activeTab === 'questions'} onClick={() => onTabChange('questions')}>
          Interview Questions
        </TabButton>
      </div>

      {activeTab === 'score' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[12px] font-bold tracking-wide text-gray-500 uppercase">Why this score</p>
            {candidate.skillsMatched.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {candidate.skillsMatched.map((skill, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] font-medium text-gray-700">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-green-500" />
                    {skill}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] font-medium text-gray-400">No matched skills identified.</p>
            )}
          </div>
          <div>
            <p className="mb-2 text-[12px] font-bold tracking-wide text-gray-500 uppercase">Gaps</p>
            {candidate.skillsMissing.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {candidate.skillsMissing.map((skill, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] font-medium text-red-600">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-400" />
                    {skill}
                    <span className="ml-auto rounded-full border border-red-100 bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-500">Missing</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] font-medium text-gray-400">No gaps identified.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'questions' && (
        <div>
          {isGeneratingQuestions ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : questions && questions.length > 0 ? (
            <ol className="flex flex-col gap-3">
              {questions.map((q, i) => (
                <li key={i} className="flex gap-3 rounded-xl border border-gray-100 bg-white p-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-50 border border-gray-200 text-[11px] font-bold">{i + 1}</span>
                  <p className="text-[13.5px] font-medium text-gray-700">{q}</p>
                </li>
              ))}
            </ol>
          ) : (
            <div className="flex flex-col items-start gap-3">
              {questionsError && <p className="text-[13px] font-bold text-red-500">{questionsError}</p>}
              <Button variant="outline" size="sm" onClick={onGenerateQuestions}>
                <Sparkles className="size-3.5" /> Generate questions
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function HrPage() {
  const [jobDescription, setJobDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [isScreening, setIsScreening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<PanelTab>('score')
  const [questionsByCandidate, setQuestionsByCandidate] = useState<Record<string, string[]>>({})
  const [generatingCandidateId, setGeneratingCandidateId] = useState<string | null>(null)
  const [questionsError, setQuestionsError] = useState<Record<string, string>>({})

  const [offerForm, setOfferForm] = useState({
    candidateName: '',
    role: '',
    salary: '',
    currency: '$',
    salaryPeriod: 'per year',
    startDate: '',
    company: '',
  })
  const [offerLetter, setOfferLetter] = useState<string | null>(null)
  const [isDrafting, setIsDrafting] = useState(false)
  const [offerError, setOfferError] = useState<string | null>(null)
  const [isEditingLetter, setIsEditingLetter] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  async function screen() {
    if (files.length === 0 || jobDescription.trim().length < 20 || isScreening) return
    setIsScreening(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('jobDescription', jobDescription)
      for (const file of files) form.append('resumes', file)

      const response = await fetch('/api/resumes/screen', { method: 'POST', body: form })
      if (!response.ok) {
        setError(await readError(response, 'Screening failed'))
        return
      }
      const { candidates: ranked } = (await response.json()) as { candidates: Candidate[] }
      setCandidates(ranked)
      if (ranked[0]) setOfferForm((prev) => ({ ...prev, candidateName: ranked[0].name }))
    } catch (screenError) {
      setError((screenError as Error).message)
    } finally {
      setIsScreening(false)
    }
  }

  function toggleCandidate(candidateId: string) {
    setExpandedCandidateId((prev) => (prev === candidateId ? null : candidateId))
    setActiveTab('score')
  }

  async function generateQuestions(candidateId: string) {
    if (generatingCandidateId) return
    setGeneratingCandidateId(candidateId)
    setQuestionsError((prev) => ({ ...prev, [candidateId]: '' }))
    try {
      const response = await fetch(`/api/resumes/${candidateId}/questions`, { method: 'POST' })
      if (!response.ok) {
        const message = await readError(response, 'Could not generate questions')
        setQuestionsError((prev) => ({ ...prev, [candidateId]: message }))
        return
      }
      const { questions: generated } = (await response.json()) as { questions: string[] }
      setQuestionsByCandidate((prev) => ({ ...prev, [candidateId]: generated }))
    } catch (questionsErr) {
      setQuestionsError((prev) => ({ ...prev, [candidateId]: (questionsErr as Error).message }))
    } finally {
      setGeneratingCandidateId(null)
    }
  }

  async function draftOffer() {
    if (!offerForm.candidateName || !offerForm.role || !offerForm.company || !offerForm.startDate || isDrafting) return
    setIsDrafting(true)
    setOfferError(null)
    setIsEditingLetter(false)
    setOfferLetter(null)
    try {
      const response = await fetch('/api/automation/hr/offer-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...offerForm, salary: Number(offerForm.salary) || 0 }),
      })
      if (!response.ok) {
        setOfferError(await readError(response, 'Could not draft offer letter'))
        return
      }
      const { letter } = (await response.json()) as { letter: string }
      setOfferLetter(letter)
    } catch (draftError) {
      setOfferError((draftError as Error).message)
    } finally {
      setIsDrafting(false)
    }
  }

  async function copyLetter() {
    if (!offerLetter) return
    try {
      await navigator.clipboard.writeText(offerLetter)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  async function downloadLetterPdf() {
    if (!offerLetter || isDownloading) return
    setIsDownloading(true)
    try {
      const response = await fetch('/api/automation/hr/offer-letter/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ letter: offerLetter, candidateName: offerForm.candidateName }),
      })
      if (!response.ok) {
        setOfferError(await readError(response, 'Could not download the offer letter'))
        return
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `offer-letter-${offerForm.candidateName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'candidate'}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (downloadError) {
      setOfferError((downloadError as Error).message)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-gray-900">
            <UsersRound className="size-6 text-[#D4A017]" /> HR & Recruitment
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">Semantic resume ranking, interview prep and offer letters.</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Multi-Resume Upload</CardTitle>
            <CardDescription>Upload resumes and a job description to rank candidates.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div
              onClick={() => inputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-8 transition-colors hover:border-[#F5CA50]/50 hover:bg-[#FFFAEC]"
            >
              <Upload className="size-6 text-gray-400" />
              <p className="text-[13.5px] font-bold text-gray-900">
                {files.length === 0 ? 'Drop resumes here or click to browse' : `${files.length} file(s) selected`}
              </p>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
                onChange={(e) => e.target.files && setFiles(Array.from(e.target.files))}
              />
            </div>
            {files.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {files.map((file, i) => (
                  <li key={file.name} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700">
                    <FileText className="size-3.5 text-gray-400" /> {file.name}
                    <button type="button" onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}>
                      <X className="size-3.5 text-gray-400 hover:text-red-500" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description…"
              rows={4}
              className="resize-none rounded-xl border border-gray-200 bg-white p-3 text-[13.5px] outline-none placeholder:text-gray-400 focus:border-[#F5CA50] focus:ring-1 focus:ring-[#F5CA50]"
            />
            {error && <p className="text-[13px] font-bold text-red-500">{error}</p>}
            <Button className="bg-[#F5CA50] font-bold text-[#111111] hover:brightness-95" disabled={files.length === 0 || jobDescription.trim().length < 20 || isScreening} onClick={screen}>
              {isScreening ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {isScreening ? 'Screening…' : 'Screen candidates'}
            </Button>
          </CardContent>
        </Card>

        {candidates.length > 0 && (
          <Card className="overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <CardTitle>Semantic Ranking</CardTitle>
              <CardDescription className="mt-1">{candidates.length} candidates ranked by match score</CardDescription>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Rank</TableHead>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Match Score</TableHead>
                    <TableHead className="pr-6">Interview Prep</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((candidate) => {
                    const isExpanded = expandedCandidateId === candidate.id
                    return (
                      <Fragment key={candidate.id}>
                        <TableRow
                          className="cursor-pointer"
                          data-state={isExpanded ? 'selected' : undefined}
                          onClick={() => toggleCandidate(candidate.id)}
                        >
                          <TableCell className="pl-6 font-bold text-gray-900">#{candidate.rank}</TableCell>
                          <TableCell>
                            <p className="font-bold text-gray-900">{candidate.name}</p>
                            <p className="text-[12px] font-medium text-gray-500">{candidate.email ?? candidate.fileName}</p>
                          </TableCell>
                          <TableCell>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleCandidate(candidate.id)
                              }}
                              className="flex items-center gap-1.5"
                            >
                              <ScoreBadge score={candidate.matchScore} />
                              <ChevronDown className={cn('size-3.5 text-gray-400 transition-transform', isExpanded && 'rotate-180')} />
                            </button>
                          </TableCell>
                          <TableCell className="pr-6">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setExpandedCandidateId(candidate.id)
                                setActiveTab('questions')
                                if (!questionsByCandidate[candidate.id]) generateQuestions(candidate.id)
                              }}
                            >
                              Generate questions
                            </Button>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={4} className="p-0 whitespace-normal">
                              <CandidateDetailPanel
                                candidate={candidate}
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                                questions={questionsByCandidate[candidate.id]}
                                isGeneratingQuestions={generatingCandidateId === candidate.id}
                                questionsError={questionsError[candidate.id] || null}
                                onGenerateQuestions={() => generateQuestions(candidate.id)}
                              />
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Offer Letter Preview</CardTitle>
            <CardDescription>Draft a formal offer letter for the top candidate.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="offer-candidate-name">Candidate Name</Label>
                <Input
                  id="offer-candidate-name"
                  placeholder="e.g. Jordan Lee"
                  value={offerForm.candidateName}
                  onChange={(e) => setOfferForm({ ...offerForm, candidateName: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="offer-role">Position / Role</Label>
                <Input
                  id="offer-role"
                  placeholder="e.g. Senior Product Designer"
                  value={offerForm.role}
                  onChange={(e) => setOfferForm({ ...offerForm, role: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="offer-company">Company Name</Label>
                <Input
                  id="offer-company"
                  placeholder="e.g. Acme Corp"
                  value={offerForm.company}
                  onChange={(e) => setOfferForm({ ...offerForm, company: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="offer-start-date">Start Date</Label>
                <Input
                  id="offer-start-date"
                  type="date"
                  value={offerForm.startDate}
                  onChange={(e) => setOfferForm({ ...offerForm, startDate: e.target.value })}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="offer-salary">Salary</Label>
                <div className="flex gap-2">
                  <select
                    aria-label="Currency"
                    value={offerForm.currency}
                    onChange={(e) => setOfferForm({ ...offerForm, currency: e.target.value })}
                    className="h-8 rounded-lg border border-input bg-transparent px-2 text-[13px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <Input
                    id="offer-salary"
                    placeholder="e.g. 95000"
                    type="number"
                    min={0}
                    value={offerForm.salary}
                    onChange={(e) => setOfferForm({ ...offerForm, salary: e.target.value })}
                  />
                  <select
                    aria-label="Salary period"
                    value={offerForm.salaryPeriod}
                    onChange={(e) => setOfferForm({ ...offerForm, salaryPeriod: e.target.value })}
                    className="h-8 shrink-0 rounded-lg border border-input bg-transparent px-2 text-[13px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {SALARY_PERIODS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <Button
              className="self-start bg-[#F5CA50] font-bold text-[#111111] hover:brightness-95"
              disabled={!offerForm.candidateName || !offerForm.role || !offerForm.company || !offerForm.startDate || isDrafting}
              onClick={draftOffer}
            >
              {isDrafting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {isDrafting ? 'Drafting…' : offerLetter ? 'Regenerate offer letter' : 'Draft offer letter'}
            </Button>

            {offerError && <p className="text-[13px] font-bold text-red-500">{offerError}</p>}

            {isDrafting && (
              <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
                <p className="mb-4 flex items-center gap-2 text-[13px] font-bold text-gray-500">
                  <Loader2 className="size-3.5 animate-spin" /> Drafting offer letter…
                </p>
                <div className="flex flex-col gap-2.5">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-5/6" />
                  <Skeleton className="mt-4 h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-3/4" />
                </div>
              </div>
            )}

            {!isDrafting && offerLetter && (
              <div className="flex flex-col gap-3">
                <div className="max-h-[32rem] overflow-y-auto rounded-xl border border-gray-200 bg-white p-10 shadow-sm">
                  {isEditingLetter ? (
                    <textarea
                      value={offerLetter}
                      onChange={(e) => setOfferLetter(e.target.value)}
                      rows={20}
                      className="w-full resize-none font-serif text-[14.5px] leading-[1.9] text-gray-800 outline-none"
                    />
                  ) : (
                    <p className="font-serif text-[14.5px] leading-[1.9] whitespace-pre-wrap text-gray-800">{offerLetter}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={copyLetter}>
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    {copied ? 'Copied' : 'Copy to clipboard'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadLetterPdf} disabled={isDownloading}>
                    {isDownloading ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                    Download as PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsEditingLetter((prev) => !prev)}>
                    <Pencil className="size-3.5" />
                    {isEditingLetter ? 'Done editing' : 'Edit'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={draftOffer} disabled={isDrafting}>
                    <RotateCw className="size-3.5" />
                    Regenerate
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}

'use client'

import { FileText, Loader2, Sparkles, Upload, UsersRound, X } from 'lucide-react'
import { useRef, useState } from 'react'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface Candidate {
  id: string
  name: string
  email: string | null
  matchScore: number
  rank: number
  fileName: string
}

async function readError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null)
  return (body as { error?: string } | null)?.error ?? fallback
}

function ScoreBadge({ score }: { score: number }) {
  const style = score >= 80 ? 'bg-green-50 text-green-700 border-green-100' : score >= 60 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-700 border-red-100'
  return <span className={cn('rounded-full border px-2.5 py-0.5 text-[12px] font-bold', style)}>{score}%</span>
}

export default function HrPage() {
  const [jobDescription, setJobDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [questions, setQuestions] = useState<string[]>([])
  const [isScreening, setIsScreening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [offerForm, setOfferForm] = useState({ candidateName: '', role: '', salary: '', startDate: '', company: '' })
  const [offerLetter, setOfferLetter] = useState<string | null>(null)
  const [isDrafting, setIsDrafting] = useState(false)

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

  async function generateQuestions(candidateId: string) {
    try {
      const response = await fetch(`/api/resumes/${candidateId}/questions`, { method: 'POST' })
      if (!response.ok) return
      const { questions: generated } = (await response.json()) as { questions: string[] }
      setQuestions(generated)
    } catch {}
  }

  async function draftOffer() {
    if (!offerForm.candidateName || !offerForm.role || !offerForm.company || !offerForm.startDate || isDrafting) return
    setIsDrafting(true)
    try {
      const response = await fetch('/api/automation/hr/offer-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...offerForm, salary: Number(offerForm.salary) || 0 }),
      })
      if (!response.ok) {
        setError(await readError(response, 'Could not draft offer letter'))
        return
      }
      const { letter } = (await response.json()) as { letter: string }
      setOfferLetter(letter)
    } catch (offerError) {
      setError((offerError as Error).message)
    } finally {
      setIsDrafting(false)
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
                  {candidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell className="pl-6 font-bold text-gray-900">#{candidate.rank}</TableCell>
                      <TableCell>
                        <p className="font-bold text-gray-900">{candidate.name}</p>
                        <p className="text-[12px] font-medium text-gray-500">{candidate.email ?? candidate.fileName}</p>
                      </TableCell>
                      <TableCell>
                        <ScoreBadge score={candidate.matchScore} />
                      </TableCell>
                      <TableCell className="pr-6">
                        <Button variant="outline" size="sm" onClick={() => generateQuestions(candidate.id)}>
                          Generate questions
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {questions.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>AI-Generated Interview Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-col gap-3">
                {questions.map((q, i) => (
                  <li key={i} className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white border border-gray-200 text-[11px] font-bold">{i + 1}</span>
                    <p className="text-[13.5px] font-medium text-gray-700">{q}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Offer Letter Preview</CardTitle>
            <CardDescription>Draft a formal offer letter for the top candidate.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Candidate name" value={offerForm.candidateName} onChange={(e) => setOfferForm({ ...offerForm, candidateName: e.target.value })} />
              <Input placeholder="Role" value={offerForm.role} onChange={(e) => setOfferForm({ ...offerForm, role: e.target.value })} />
              <Input placeholder="Company" value={offerForm.company} onChange={(e) => setOfferForm({ ...offerForm, company: e.target.value })} />
              <Input placeholder="Salary ($)" type="number" value={offerForm.salary} onChange={(e) => setOfferForm({ ...offerForm, salary: e.target.value })} />
              <Input placeholder="Start date" type="date" value={offerForm.startDate} onChange={(e) => setOfferForm({ ...offerForm, startDate: e.target.value })} />
            </div>
            <Button className="self-start bg-[#F5CA50] font-bold text-[#111111] hover:brightness-95" disabled={isDrafting} onClick={draftOffer}>
              {isDrafting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Draft offer letter
            </Button>
            {offerLetter && (
              <div className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50/60 p-4 text-[13px] leading-relaxed whitespace-pre-wrap text-gray-700">
                {offerLetter}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}

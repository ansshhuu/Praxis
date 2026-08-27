'use client'

import { Briefcase, Loader2, Send, Sparkles } from 'lucide-react'
import { useDeferredValue, useRef, useState } from 'react'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  FIT_NOTES_MAX_LENGTH,
  TIMELINE_MAX_DAYS,
  TIMELINE_MIN_DAYS,
  type LeadFieldErrors,
  hasLeadFieldErrors,
  validateLeadForm,
} from '@/lib/validation/lead'
import {
  PROPOSAL_BUDGET_MAX,
  PROPOSAL_REQUIREMENTS_MAX_LENGTH,
  type ProposalFieldErrors,
  hasProposalFieldErrors,
  validateProposalForm,
} from '@/lib/validation/proposal'

type QualificationBand = 'hot' | 'warm' | 'cold'

interface LeadView {
  name: string
  email: string
  company: string
  budget: number
  timelineDays: number
  qualificationScore: number
  qualificationBand: QualificationBand
  status: string
  createdAt: string
}

interface FollowUpPlan {
  nextFollowUpAt: string
  priority: 'high' | 'medium' | 'low'
}

const BAND_STYLES: Record<QualificationBand, string> = {
  hot: 'bg-red-50 text-red-700 border-red-100',
  warm: 'bg-amber-50 text-amber-700 border-amber-100',
  cold: 'bg-blue-50 text-blue-700 border-blue-100',
}

async function readError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null)
  return (body as { error?: string } | null)?.error ?? fallback
}

const EMPTY_LEAD_FORM = { name: '', email: '', company: '', budget: '', timelineDays: '30', fitNotes: '' }

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-[12px] font-semibold text-red-500">{message}</p>
}

function LeadForm({ onCreated }: { onCreated: (lead: LeadView) => void }) {
  const [form, setForm] = useState(EMPTY_LEAD_FORM)
  const [fieldErrors, setFieldErrors] = useState<LeadFieldErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<LeadView | null>(null)

  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const companyRef = useRef<HTMLInputElement>(null)
  const budgetRef = useRef<HTMLInputElement>(null)
  const timelineRef = useRef<HTMLInputElement>(null)
  const fitNotesRef = useRef<HTMLTextAreaElement>(null)

  const fieldRefs: Record<keyof LeadFieldErrors, React.RefObject<HTMLElement | null>> = {
    name: nameRef,
    email: emailRef,
    company: companyRef,
    budget: budgetRef,
    timelineDays: timelineRef,
    fitNotes: fitNotesRef,
  }

  function focusFirstError(errors: LeadFieldErrors) {
    const order: (keyof LeadFieldErrors)[] = ['name', 'email', 'company', 'budget', 'timelineDays', 'fitNotes']
    const firstKey = order.find((key) => errors[key])
    if (!firstKey) return
    const el = fieldRefs[firstKey].current
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el?.focus()
  }

  async function submit() {
    if (isSubmitting) return

    const errors = validateLeadForm(form)
    if (hasLeadFieldErrors(errors)) {
      setFieldErrors(errors)
      setError(null)
      focusFirstError(errors)
      return
    }

    setFieldErrors({})
    setIsSubmitting(true)
    setError(null)
    try {
      const response = await fetch('/api/automation/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          company: form.company,
          budget: Number(form.budget),
          timelineDays: Number(form.timelineDays),
          fitNotes: form.fitNotes,
          source: 'crm-dashboard',
        }),
      })
      if (!response.ok) {
        setError(await readError(response, 'Failed to ingest lead'))
        return
      }
      const { lead } = (await response.json()) as { lead: LeadView }
      onCreated(lead)
      setLastResult(lead)
      setForm(EMPTY_LEAD_FORM)
    } catch (submitError) {
      setError(`Failed to ingest lead: ${(submitError as Error).message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  function updateField<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Qualify a Lead</CardTitle>
        <CardDescription>Score budget, urgency and fit automatically.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Input
            ref={nameRef}
            placeholder="Contact name"
            value={form.name}
            aria-invalid={Boolean(fieldErrors.name)}
            onChange={(e) => updateField('name', e.target.value)}
          />
          <FieldError message={fieldErrors.name} />
        </div>

        <div className="flex flex-col gap-1">
          <Input
            ref={emailRef}
            placeholder="Email"
            type="email"
            value={form.email}
            aria-invalid={Boolean(fieldErrors.email)}
            onChange={(e) => updateField('email', e.target.value)}
          />
          <FieldError message={fieldErrors.email} />
        </div>

        <div className="flex flex-col gap-1">
          <Input
            ref={companyRef}
            placeholder="Company"
            value={form.company}
            aria-invalid={Boolean(fieldErrors.company)}
            onChange={(e) => updateField('company', e.target.value)}
          />
          <FieldError message={fieldErrors.company} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Input
              ref={budgetRef}
              placeholder="Budget ($)"
              type="number"
              min="0"
              step="1"
              value={form.budget}
              aria-invalid={Boolean(fieldErrors.budget)}
              onChange={(e) => updateField('budget', e.target.value)}
            />
            <FieldError message={fieldErrors.budget} />
          </div>
          <div className="flex flex-col gap-1">
            <Input
              ref={timelineRef}
              placeholder="Urgency"
              type="number"
              min={TIMELINE_MIN_DAYS}
              max={TIMELINE_MAX_DAYS}
              step="1"
              value={form.timelineDays}
              aria-invalid={Boolean(fieldErrors.timelineDays)}
              onChange={(e) => updateField('timelineDays', e.target.value)}
            />
            <p className="text-[11px] font-medium text-gray-400">
              Urgency (days to close, {TIMELINE_MIN_DAYS}–{TIMELINE_MAX_DAYS})
            </p>
            <FieldError message={fieldErrors.timelineDays} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Textarea
            ref={fitNotesRef}
            placeholder="Fit notes — decision maker, budget approved, urgent…"
            rows={3}
            className="max-h-48 overflow-y-auto"
            maxLength={FIT_NOTES_MAX_LENGTH}
            value={form.fitNotes}
            aria-invalid={Boolean(fieldErrors.fitNotes)}
            onChange={(e) => updateField('fitNotes', e.target.value.slice(0, FIT_NOTES_MAX_LENGTH))}
          />
          <div className="flex items-center justify-between">
            <FieldError message={fieldErrors.fitNotes} />
            <span className="ml-auto text-[11px] font-medium tabular-nums text-gray-400">
              {form.fitNotes.length}/{FIT_NOTES_MAX_LENGTH}
            </span>
          </div>
        </div>

        {error && <p className="text-[13px] font-bold text-red-500">{error}</p>}

        <Button className="bg-[#F5CA50] font-bold text-[#111111] hover:brightness-95" disabled={isSubmitting} onClick={submit}>
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          Qualify lead
        </Button>

        {lastResult && (
          <div className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-bold text-gray-900">
                {lastResult.name} · {lastResult.company}
              </p>
              <span className={cn('rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase', BAND_STYLES[lastResult.qualificationBand])}>
                {lastResult.qualificationBand}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                <div className="h-full rounded-full bg-[#F5CA50]" style={{ width: `${lastResult.qualificationScore}%` }} />
              </div>
              <span className="text-[12px] font-bold tabular-nums text-gray-700">{lastResult.qualificationScore}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const EMPTY_PROPOSAL_FORM = { leadName: '', company: '', requirements: '', budget: '' }

function ProposalGenerator({ qualifiedLeads }: { qualifiedLeads: LeadView[] }) {
  const [form, setForm] = useState(EMPTY_PROPOSAL_FORM)
  const [fieldErrors, setFieldErrors] = useState<ProposalFieldErrors>({})
  const [proposal, setProposal] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deferredRequirements = useDeferredValue(form.requirements)

  const leadNameRef = useRef<HTMLInputElement>(null)
  const companyRef = useRef<HTMLInputElement>(null)
  const requirementsRef = useRef<HTMLTextAreaElement>(null)
  const budgetRef = useRef<HTMLInputElement>(null)

  const fieldRefs: Record<keyof ProposalFieldErrors, React.RefObject<HTMLElement | null>> = {
    leadName: leadNameRef,
    company: companyRef,
    requirements: requirementsRef,
    budget: budgetRef,
  }

  function focusFirstError(errors: ProposalFieldErrors) {
    const order: (keyof ProposalFieldErrors)[] = ['leadName', 'company', 'requirements', 'budget']
    const firstKey = order.find((key) => errors[key])
    if (!firstKey) return
    const el = fieldRefs[firstKey].current
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el?.focus()
  }

  function updateField<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function applyQualifiedLead(email: string) {
    const lead = qualifiedLeads.find((l) => l.email === email)
    if (!lead) return
    setForm((prev) => ({ ...prev, leadName: lead.name, company: lead.company, budget: String(lead.budget) }))
    setFieldErrors({})
  }

  async function generate() {
    if (isGenerating) return

    const errors = validateProposalForm(form)
    if (hasProposalFieldErrors(errors)) {
      setFieldErrors(errors)
      setError(null)
      focusFirstError(errors)
      return
    }

    setFieldErrors({})
    setIsGenerating(true)
    setError(null)
    try {
      const response = await fetch('/api/automation/crm/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: form.leadName,
          company: form.company,
          requirements: form.requirements,
          budget: Number(form.budget),
        }),
      })
      if (!response.ok) {
        setError(await readError(response, 'Failed to generate proposal'))
        return
      }
      const { proposal: text } = (await response.json()) as { proposal: string }
      setProposal(text)
    } catch (generateError) {
      setError(`Failed to generate proposal: ${(generateError as Error).message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Automated Proposal Generator</CardTitle>
        <CardDescription>Draft a client-ready proposal in seconds.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {qualifiedLeads.length > 0 && (
          <label className="flex flex-col gap-1 text-[12px] font-semibold text-gray-500">
            Use qualified lead
            <select
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-[13px] font-medium text-gray-900 outline-none focus-visible:border-ring"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) applyQualifiedLead(e.target.value)
                e.target.value = ''
              }}
            >
              <option value="" disabled>
                Select a qualified lead…
              </option>
              {qualifiedLeads.map((lead) => (
                <option key={lead.email + lead.createdAt} value={lead.email}>
                  {lead.name} · {lead.company}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Input
              ref={leadNameRef}
              placeholder="Lead name"
              value={form.leadName}
              aria-invalid={Boolean(fieldErrors.leadName)}
              onChange={(e) => updateField('leadName', e.target.value)}
            />
            <FieldError message={fieldErrors.leadName} />
          </div>
          <div className="flex flex-col gap-1">
            <Input
              ref={companyRef}
              placeholder="Company"
              value={form.company}
              aria-invalid={Boolean(fieldErrors.company)}
              onChange={(e) => updateField('company', e.target.value)}
            />
            <FieldError message={fieldErrors.company} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Textarea
            ref={requirementsRef}
            placeholder="Requirements and scope…"
            rows={3}
            className="max-h-64 overflow-y-auto"
            maxLength={PROPOSAL_REQUIREMENTS_MAX_LENGTH}
            value={form.requirements}
            aria-invalid={Boolean(fieldErrors.requirements)}
            onChange={(e) => updateField('requirements', e.target.value.slice(0, PROPOSAL_REQUIREMENTS_MAX_LENGTH))}
          />
          <div className="flex items-center justify-between">
            <FieldError message={fieldErrors.requirements} />
            <span className="ml-auto text-[11px] font-medium tabular-nums text-gray-400">
              {deferredRequirements.length}/{PROPOSAL_REQUIREMENTS_MAX_LENGTH}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Input
            ref={budgetRef}
            placeholder="Budget ($)"
            type="number"
            min="0"
            max={PROPOSAL_BUDGET_MAX}
            step="1"
            value={form.budget}
            aria-invalid={Boolean(fieldErrors.budget)}
            onChange={(e) => updateField('budget', e.target.value)}
          />
          <FieldError message={fieldErrors.budget} />
        </div>

        {error && <p className="text-[13px] font-bold text-red-500">{error}</p>}

        <Button className="bg-[#F5CA50] font-bold text-[#111111] hover:brightness-95" disabled={isGenerating} onClick={generate}>
          {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Generate proposal
        </Button>
        {proposal && (
          <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50/60 p-4 text-[13px] leading-relaxed whitespace-pre-wrap text-gray-700">
            {proposal}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function LeadCard({ lead, onPlanFollowUp }: { lead: LeadView; onPlanFollowUp: (lead: LeadView) => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[14px] font-bold text-gray-900">{lead.name}</p>
          <p className="text-[12.5px] font-medium text-gray-500">{lead.company}</p>
        </div>
        <span className={cn('rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase', BAND_STYLES[lead.qualificationBand])}>
          {lead.qualificationBand}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-[#F5CA50]" style={{ width: `${lead.qualificationScore}%` }} />
        </div>
        <span className="text-[12px] font-bold tabular-nums text-gray-700">{lead.qualificationScore}</span>
      </div>
      <div className="flex items-center justify-between text-[12px] font-medium text-gray-500">
        <span>${lead.budget.toLocaleString()} budget</span>
        <span>{lead.timelineDays}d timeline</span>
      </div>
      <Button variant="outline" size="sm" onClick={() => onPlanFollowUp(lead)}>
        Plan follow-up
      </Button>
    </div>
  )
}

export default function CrmPage() {
  const [leads, setLeads] = useState<LeadView[]>([])
  const [followUps, setFollowUps] = useState<Record<string, FollowUpPlan>>({})

  async function planFollowUp(lead: LeadView) {
    try {
      const response = await fetch('/api/automation/crm/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ band: lead.qualificationBand, lastContactedAt: lead.createdAt }),
      })
      if (!response.ok) return
      const { plan } = (await response.json()) as { plan: FollowUpPlan }
      setFollowUps((prev) => ({ ...prev, [lead.email]: plan }))
    } catch {}
  }

  const timeline = leads
    .map((lead) => ({ lead, plan: followUps[lead.email] }))
    .filter((entry): entry is { lead: LeadView; plan: FollowUpPlan } => Boolean(entry.plan))
    .sort((a, b) => new Date(a.plan.nextFollowUpAt).getTime() - new Date(b.plan.nextFollowUpAt).getTime())

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-gray-900">
            <Briefcase className="size-6 text-[#D4A017]" /> CRM Automation
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">Qualify leads, generate proposals and plan follow-ups.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <LeadForm onCreated={(lead) => setLeads((prev) => [lead, ...prev])} />
          <ProposalGenerator qualifiedLeads={leads} />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Lead Qualification Cards</CardTitle>
            <CardDescription>{leads.length} leads qualified this session</CardDescription>
          </CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <p className="py-8 text-center text-[13px] font-medium text-gray-400">Qualify a lead to see it here.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {leads.map((lead) => (
                  <LeadCard key={lead.email + lead.createdAt} lead={lead} onPlanFollowUp={planFollowUp} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Follow-Up Timeline</CardTitle>
            <CardDescription>Prioritized by qualification band</CardDescription>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <p className="py-8 text-center text-[13px] font-medium text-gray-400">No follow-ups planned yet.</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {timeline.map(({ lead, plan }) => (
                  <li key={lead.email} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-3">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[11px] font-bold uppercase',
                        plan.priority === 'high' ? 'bg-red-50 text-red-700' : plan.priority === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600',
                      )}
                    >
                      {plan.priority}
                    </span>
                    <div className="flex-1">
                      <p className="text-[13.5px] font-bold text-gray-900">{lead.name} · {lead.company}</p>
                      <p className="text-[12px] font-medium text-gray-500">
                        Follow up by {new Date(plan.nextFollowUpAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}

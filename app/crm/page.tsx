'use client'

import { Briefcase, Loader2, Send, Sparkles } from 'lucide-react'
import { useState } from 'react'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

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

function LeadForm({ onCreated }: { onCreated: (lead: LeadView) => void }) {
  const [form, setForm] = useState({ name: '', email: '', company: '', budget: '', timelineDays: '30', fitNotes: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (!form.name || !form.email || !form.company || isSubmitting) return
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
          budget: Number(form.budget) || 0,
          timelineDays: Number(form.timelineDays) || 30,
          fitNotes: form.fitNotes,
          source: 'crm-dashboard',
        }),
      })
      if (!response.ok) {
        setError(await readError(response, 'Could not qualify lead'))
        return
      }
      const { lead } = (await response.json()) as { lead: LeadView }
      onCreated(lead)
      setForm({ name: '', email: '', company: '', budget: '', timelineDays: '30', fitNotes: '' })
    } catch (submitError) {
      setError((submitError as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Qualify a Lead</CardTitle>
        <CardDescription>Score budget, urgency and fit automatically.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Input placeholder="Contact name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Budget ($)" type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
          <Input placeholder="Timeline (days)" type="number" value={form.timelineDays} onChange={(e) => setForm({ ...form, timelineDays: e.target.value })} />
        </div>
        <Textarea placeholder="Fit notes — decision maker, budget approved, urgent…" rows={3} value={form.fitNotes} onChange={(e) => setForm({ ...form, fitNotes: e.target.value })} />
        {error && <p className="text-[13px] font-bold text-red-500">{error}</p>}
        <Button className="bg-[#F5CA50] font-bold text-[#111111] hover:brightness-95" disabled={isSubmitting} onClick={submit}>
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          Qualify lead
        </Button>
      </CardContent>
    </Card>
  )
}

function ProposalGenerator() {
  const [form, setForm] = useState({ leadName: '', company: '', requirements: '', budget: '' })
  const [proposal, setProposal] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    if (!form.leadName || !form.company || !form.requirements || isGenerating) return
    setIsGenerating(true)
    setError(null)
    try {
      const response = await fetch('/api/automation/crm/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, budget: Number(form.budget) || 0 }),
      })
      if (!response.ok) {
        setError(await readError(response, 'Could not generate proposal'))
        return
      }
      const { proposal: text } = (await response.json()) as { proposal: string }
      setProposal(text)
    } catch (generateError) {
      setError((generateError as Error).message)
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
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Lead name" value={form.leadName} onChange={(e) => setForm({ ...form, leadName: e.target.value })} />
          <Input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        </div>
        <Textarea placeholder="Requirements and scope…" rows={3} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
        <Input placeholder="Budget ($)" type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
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
          <ProposalGenerator />
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

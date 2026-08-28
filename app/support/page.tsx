'use client'

import { Headset, Loader2, Send, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type Urgency = 'low' | 'medium' | 'high' | 'critical'
type Sentiment = 'positive' | 'neutral' | 'negative'
type ReplyStatus = 'none' | 'sent'

interface Ticket {
  _id: string
  subject: string
  message: string
  category: string
  sentimentScore: number
  sentimentLabel: Sentiment
  urgency: Urgency
  escalate: boolean
  status: string
  reply: string | null
  replyStatus: ReplyStatus
  createdAt: string
}

const URGENCY_STYLES: Record<Urgency, string> = {
  critical: 'bg-red-50 text-red-700 border-red-100',
  high: 'bg-orange-50 text-orange-700 border-orange-100',
  medium: 'bg-amber-50 text-amber-700 border-amber-100',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
}

const SENTIMENT_STYLES: Record<Sentiment, string> = {
  positive: 'bg-green-50 text-green-700',
  neutral: 'bg-gray-100 text-gray-600',
  negative: 'bg-red-50 text-red-700',
}

async function readError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null)
  return (body as { error?: string } | null)?.error ?? fallback
}

function TicketCard({
  ticket,
  isActive,
  onGenerateReply,
}: {
  ticket: Ticket
  isActive: boolean
  onGenerateReply: (ticket: Ticket) => void
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm',
        isActive ? 'border-[#F5CA50]' : 'border-gray-100',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[13.5px] font-bold text-gray-900">{ticket.subject}</p>
          <p className="mt-1 line-clamp-2 text-[12.5px] font-medium text-gray-500">{ticket.message}</p>
        </div>
        <span className={cn('shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase', URGENCY_STYLES[ticket.urgency])}>
          {ticket.urgency}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-600 uppercase">{ticket.category}</span>
        <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-bold', SENTIMENT_STYLES[ticket.sentimentLabel])}>
          {ticket.sentimentLabel}
        </span>
        {ticket.escalate && <span className="rounded-md bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">Escalated</span>}
        {ticket.replyStatus === 'sent' && (
          <span className="rounded-md bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">Replied</span>
        )}
      </div>
      <Button variant="outline" size="sm" onClick={() => onGenerateReply(ticket)}>
        <Sparkles className="size-3.5" /> Generate reply
      </Button>
    </div>
  )
}

function urgencyRank(urgency: Urgency): number {
  return { critical: 3, high: 2, medium: 1, low: 0 }[urgency]
}

function sortByUrgency(list: Ticket[]): Ticket[] {
  return [...list].sort((a, b) => urgencyRank(b.urgency) - urgencyRank(a.urgency))
}

export default function SupportPage() {
  const [form, setForm] = useState({ subject: '', message: '' })
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [activeTicketId, setActiveTicketId] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const generationTokenRef = useRef(0)

  const activeTicket = tickets.find((t) => t._id === activeTicketId) ?? null

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const response = await fetch('/api/automation/support/tickets')
        if (!response.ok || cancelled) return
        const { tickets: data } = (await response.json()) as { tickets: Ticket[] }
        if (!cancelled) setTickets(sortByUrgency(data))
      } catch {}
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  async function submitTicket() {
    if (!form.subject.trim() || !form.message.trim() || isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    try {
      const response = await fetch('/api/automation/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!response.ok) {
        setError(await readError(response, 'Could not submit ticket'))
        return
      }
      const { ticket } = (await response.json()) as { ticket: Ticket }
      setTickets((prev) => sortByUrgency([ticket, ...prev]))
      setForm({ subject: '', message: '' })
    } catch (submitError) {
      setError((submitError as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function generateReply(ticket: Ticket) {
    const token = ++generationTokenRef.current
    setActiveTicketId(ticket._id)
    setIsGenerating(true)
    setReply('')
    setError(null)
    try {
      const response = await fetch('/api/automation/support/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: ticket.subject, message: ticket.message, category: ticket.category, escalate: ticket.escalate }),
      })
      if (token !== generationTokenRef.current) return
      if (!response.ok) {
        setError(await readError(response, 'Could not generate reply'))
        return
      }
      const { reply: text } = (await response.json()) as { reply: string }
      if (token !== generationTokenRef.current) return
      setReply(text)
    } catch (replyError) {
      if (token !== generationTokenRef.current) return
      setError((replyError as Error).message)
    } finally {
      if (token === generationTokenRef.current) setIsGenerating(false)
    }
  }

  async function sendReply() {
    if (!activeTicket || !reply.trim() || isSending) return
    const ticketId = activeTicket._id
    setIsSending(true)
    setError(null)
    try {
      const response = await fetch('/api/automation/support/reply/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, reply: reply.trim() }),
      })
      if (!response.ok) {
        setError(await readError(response, 'Could not send reply'))
        return
      }
      const { ticket: updated } = (await response.json()) as { ticket: Ticket }
      setTickets((prev) => sortByUrgency(prev.map((t) => (t._id === ticketId ? updated : t))))
    } catch (sendError) {
      setError((sendError as Error).message)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-gray-900">
            <Headset className="size-6 text-[#D4A017]" /> Support & Tickets
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">Sentiment-aware triage with one-click AI resolution replies.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>New Ticket</CardTitle>
              <CardDescription>Auto-classified for sentiment, urgency and routing.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              <Textarea placeholder="Customer message…" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              {error && <p className="text-[13px] font-bold text-red-500">{error}</p>}
              <Button className="bg-[#F5CA50] font-bold text-[#111111] hover:brightness-95" disabled={isSubmitting} onClick={submitTicket}>
                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Submit & triage
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>AI Resolution Reply</CardTitle>
              <CardDescription>{activeTicket ? activeTicket.subject : 'Select a ticket to draft a reply'}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {isGenerating ? (
                <div className="flex items-center gap-2 py-10 justify-center text-gray-500">
                  <Loader2 className="size-4 animate-spin" /> <span className="text-[13px] font-medium">Drafting reply…</span>
                </div>
              ) : (
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Generated reply will appear here - fully editable before sending."
                  rows={9}
                  disabled={!activeTicket}
                />
              )}
              {activeTicket?.replyStatus === 'sent' && (
                <p className="text-[12.5px] font-bold text-green-600">Reply sent - this ticket is marked Replied.</p>
              )}
              <Button variant="outline" disabled={!reply.trim() || !activeTicket || isSending} onClick={sendReply}>
                {isSending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                Send reply
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Ticket Sentiment Queue</CardTitle>
            <CardDescription>Sorted by urgency - critical and escalated tickets surface first.</CardDescription>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <p className="py-8 text-center text-[13px] font-medium text-gray-400">No tickets submitted yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tickets.map((ticket) => (
                  <TicketCard
                    key={ticket._id}
                    ticket={ticket}
                    isActive={ticket._id === activeTicketId}
                    onGenerateReply={generateReply}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}

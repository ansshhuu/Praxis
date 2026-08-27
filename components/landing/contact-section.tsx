'use client'

import { ArrowRight, Check, Loader2 } from 'lucide-react'
import { useState } from 'react'

import DotField from '@/components/landing/DotField'
import { Reveal, ScaleIn } from '@/components/motion/primitives'
import { cn } from '@/lib/utils'

const CONTACT_EMAIL = 'hello@praxis.ai'

const INTERESTS = [
  'Workflow Automation',
  'Document AI',
  'Resume Screening',
  'Custom Integration',
  'Enterprise Pricing',
  'Other',
]

const fieldClass =
  'w-full rounded-xl border border-neutral-200 bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-neutral-900 transition placeholder:text-neutral-400 focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-200/50 focus:outline-none'



function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [company, setCompany] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleInterest(topic: string) {
    setInterests((current) =>
      current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic],
    )
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (sending) return

    setSending(true)
    setError(null)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, interests, company }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error ?? 'Could not send your message.')

      setSent(true)
      setName('')
      setEmail('')
      setMessage('')
      setInterests([])
    } catch (submitError) {
      setError((submitError as Error).message)
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="relative z-10 mx-auto flex max-w-lg flex-col items-center rounded-3xl border border-neutral-200/80 bg-white/90 p-8 text-center shadow-xl backdrop-blur-md">
        <span className="flex size-12 items-center justify-center rounded-full bg-[#ECFDF5] text-[#059669]">
          <Check className="size-6" strokeWidth={3} />
        </span>
        <p className="mt-5 text-xl font-bold text-neutral-900">Message sent!</p>
        <p className="mt-2 text-sm text-neutral-600">We&apos;ll be in touch within 24 hours.</p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-6 rounded-full bg-neutral-100 px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-200"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      id="contact-form"
      className="relative z-10 mx-auto flex max-w-lg flex-col gap-5 rounded-3xl border border-neutral-200/80 bg-white/90 p-6 shadow-xl backdrop-blur-md md:p-8"
    >
      <div className="hidden" aria-hidden="true">
        <label htmlFor="contact-company">Company (leave blank)</label>
        <input
          id="contact-company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-name" className="text-xs font-semibold text-neutral-700">
            Full name
          </label>
          <input
            id="contact-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            autoComplete="name"
            required
            maxLength={120}
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-email" className="text-xs font-semibold text-neutral-700">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@company.com"
            autoComplete="email"
            required
            maxLength={200}
            className={fieldClass}
          />
        </div>
      </div>

      <fieldset>
        <legend className="text-xs font-semibold text-neutral-700">I need help with…</legend>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {INTERESTS.map((topic) => {
            const activeChip = interests.includes(topic)
            return (
              <button
                key={topic}
                type="button"
                aria-pressed={activeChip}
                onClick={() => toggleInterest(topic)}
                className={cn(
                  'cursor-pointer rounded-full px-3 py-1.5 text-xs transition duration-200',
                  activeChip
                    ? 'border border-black bg-[#0F172A] font-semibold text-white shadow-xs'
                    : 'border border-neutral-200 bg-neutral-100 text-neutral-700 hover:bg-neutral-200',
                )}
              >
                {topic}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact-message" className="text-xs font-semibold text-neutral-700">
          Message
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us about your project or inquiry…"
          rows={3}
          required
          maxLength={4000}
          className={cn(fieldClass, 'resize-y')}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0F172A] py-3 font-semibold text-white transition duration-200 hover:scale-[1.02] hover:bg-neutral-800 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {sending ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            Send message <ArrowRight className="size-4" aria-hidden="true" />
          </>
        )}
      </button>
    </form>
  )
}

export function ContactSection() {
  return (
    <section
      id="contact"
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#FAF8F5] py-24 md:py-28"
      aria-labelledby="contact-heading"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 40%, rgba(245,202,80,0.10), transparent 70%)',
        }}
      />

      <DotField
        dotRadius={1.5}
        dotSpacing={16}
        cursorRadius={300}
        cursorForce={0.13}
        bulgeOnly
        bulgeStrength={22}
        glowRadius={0}
        glowColor="transparent"
        sparkle={false}
        waveAmplitude={0}
        gradientFrom="#FACC15"
        gradientTo="#D97706"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      />

      <div className="relative z-10 mx-auto w-full max-w-lg px-4 md:px-6">
        <div className="text-center">
          <Reveal y={12} duration={0.35}>
            <h2 id="contact-heading" className="text-4xl text-neutral-900 md:text-5xl">
              <span className="font-serif italic text-neutral-800">Let&apos;s connect!</span>{' '}
              <span className="font-sans font-extrabold">Say hello 👋</span>
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-2 mb-8 text-sm text-neutral-600">
              Drop us a line at{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-semibold text-[#D97706] underline-offset-4 hover:underline"
              >
                {CONTACT_EMAIL}
              </a>{' '}
              or fill out the form below.
            </p>
          </Reveal>
        </div>

        <ScaleIn delay={0.12}>
          <ContactForm />
        </ScaleIn>
      </div>
    </section>
  )
}

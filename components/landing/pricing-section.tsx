'use client'

import { ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { Reveal, ScaleIn } from '@/components/motion/primitives'
import { cn } from '@/lib/utils'

type BillingCycle = 'yearly' | 'monthly'

type Plan = {
  id: string
  name: string
  subtitle: string
  price: Record<BillingCycle, string>
  cadence: Record<BillingCycle, string>
  cta: { label: string; href: string; withArrow?: boolean }
  features: string[]
  featured?: boolean
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    subtitle: 'Perfect for trying out no-code AI workflows.',
    price: { yearly: '$0', monthly: '$0' },
    cadence: { yearly: '/ month', monthly: '/ month' },
    cta: { label: 'Get Started Free', href: '/register' },
    features: [
      'Up to 5 active workflows',
      'Basic AI document extraction',
      '1,000 AI executions / mo',
      'Community support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    subtitle: 'Unlimited tools for scaling teams and automation.',
    price: { yearly: '$49', monthly: '$61' },
    cadence: { yearly: '/ month, billed annually', monthly: '/ month, billed monthly' },
    cta: { label: 'Start 14-Day Free Trial', href: '/register', withArrow: true },
    features: [
      'Unlimited active workflows',
      'Advanced Doc Intelligence & OCR',
      '50,000 AI executions / mo',
      'Custom webhooks & integrations',
      'Priority email support',
    ],
    featured: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    subtitle: 'Custom security, dedicated LLMs, and SLA guarantees.',
    price: { yearly: 'Custom', monthly: 'Custom' },
    cadence: { yearly: '', monthly: '' },
    cta: { label: 'Request Demo', href: '#contact' },
    features: [
      'Dedicated LLM instances',
      'Custom SOC2 & HIPAA compliance',
      'Unlimited AI executions',
      'Dedicated Account Manager & 24/7 SLA',
    ],
  },
]

function FeatureCheck({ featured }: { featured?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full p-1',
        featured ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-neutral-100 text-neutral-500',
      )}
    >
      <Check className="size-3" strokeWidth={3} />
    </span>
  )
}

function PlanCard({ plan, cycle }: { plan: Plan; cycle: BillingCycle }) {
  const cadence = plan.cadence[cycle]

  return (
    <div
      className={cn(
        'relative flex h-full flex-col justify-between rounded-2xl bg-white p-8',
        'transition-all duration-300 ease-out hover:z-10 hover:-translate-y-2',
        plan.featured
          ? 'animate-pulse-glow border-2 border-[#FACC15] hover:scale-[1.03] hover:shadow-[0_0_35px_rgba(250,204,21,0.6)]'
          : 'border border-neutral-200/80 shadow-xs hover:scale-[1.02] hover:border-amber-300/60 hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.10),0_0_25px_rgba(250,204,21,0.15)]',
      )}
    >
      {plan.featured && (
        <span className="absolute -top-3.5 right-6 rounded-full border border-[#FDE047] bg-[#FEF08A] px-3 py-1 text-xs font-bold text-[#854D0E]">
          Most Popular
        </span>
      )}

      <div>
        <h3 className="text-xl font-bold text-neutral-900">{plan.name}</h3>
        <p className="mt-1.5 text-sm text-neutral-600">{plan.subtitle}</p>

        <p className="mt-4 flex flex-wrap items-baseline gap-x-2">
          <span className="text-4xl font-bold tracking-tight text-neutral-900">
            {plan.price[cycle]}
          </span>
          {cadence && <span className="text-sm text-neutral-500">{cadence}</span>}
        </p>

        <Link
          href={plan.cta.href}
          className={cn(
            'mt-6 flex w-full items-center justify-center gap-2 rounded-full py-3 font-semibold',
            'transition-all duration-200 hover:scale-[1.02] active:scale-95',
            plan.featured
              ? 'bg-[#0F172A] text-white shadow-sm hover:bg-neutral-800 hover:shadow-[0_0_15px_rgba(15,23,42,0.4)]'
              : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-900 hover:text-white',
          )}
        >
          {plan.cta.label}
          {plan.cta.withArrow && <ArrowRight className="size-4" aria-hidden="true" />}
        </Link>

        <ul className="mt-8 flex flex-col gap-3.5">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm text-neutral-700">
              <FeatureCheck featured={plan.featured} />
              <span className="min-w-0 flex-1">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function PricingSection() {
  const [cycle, setCycle] = useState<BillingCycle>('yearly')

  return (
    <section id="pricing" className="relative w-full bg-[#FAF8F5]" aria-labelledby="pricing-heading">
      <div className="mx-auto max-w-6xl px-4 py-24 md:px-6 md:py-28">
        <div className="text-center">
          <Reveal y={12} duration={0.35}>
            <h2
              id="pricing-heading"
              className="text-4xl font-extrabold tracking-tight text-neutral-900"
            >
              Plans
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-2 text-sm text-neutral-600">
              Choose the scale that fits your team&apos;s automation needs.
            </p>
          </Reveal>

          <Reveal delay={0.16}>
            <div
              role="radiogroup"
              aria-label="Billing cycle"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white p-1.5"
            >
              <button
                type="button"
                role="radio"
                aria-checked={cycle === 'yearly'}
                onClick={() => setCycle('yearly')}
                className={cn(
                  'flex items-center gap-2 rounded-full px-4 py-1.5 text-xs transition',
                  cycle === 'yearly'
                    ? 'bg-[#0F172A] font-semibold text-white'
                    : 'font-medium text-neutral-600 hover:text-neutral-900',
                )}
              >
                Yearly
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-bold',
                    cycle === 'yearly'
                      ? 'bg-[#FEF3C7] text-[#D97706]'
                      : 'bg-[#ECFDF5] text-[#059669]',
                  )}
                >
                  Save 20%
                </span>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={cycle === 'monthly'}
                onClick={() => setCycle('monthly')}
                className={cn(
                  'rounded-full px-4 py-1.5 text-xs transition',
                  cycle === 'monthly'
                    ? 'bg-[#0F172A] font-semibold text-white'
                    : 'font-medium text-neutral-600 hover:text-neutral-900',
                )}
              >
                Monthly
              </button>
            </div>
          </Reveal>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map((plan, index) => (
            <ScaleIn key={plan.id} delay={0.08 * index} className="h-full">
              <PlanCard plan={plan} cycle={cycle} />
            </ScaleIn>
          ))}
        </div>
      </div>
    </section>
  )
}

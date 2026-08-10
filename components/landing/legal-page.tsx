import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

function PraxisIcon({ size = 16, color = '#D4A017' }: { size?: number; color?: string }) {
  const c = size / 2
  const rays = 8
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden="true">
      {Array.from({ length: rays }, (_, i) => {
        const rad = ((i * 360) / rays) * (Math.PI / 180)
        const x1 = c + c * 0.35 * Math.cos(rad)
        const y1 = c + c * 0.35 * Math.sin(rad)
        const x2 = c + c * 0.82 * Math.cos(rad)
        const y2 = c + c * 0.82 * Math.sin(rad)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={size * 0.09} strokeLinecap="round" />
      })}
      <circle cx={c} cy={c} r={c * 0.28} fill={color} />
    </svg>
  )
}

export type LegalSection = {
  heading: string
  body: string[]
}

export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string
  updated: string
  intro: string
  sections: LegalSection[]
}) {
  return (
    <main className="min-h-screen w-full bg-[#FAF8F5]">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-600 transition hover:border-[#FACC15] hover:bg-[#FFFAEC] hover:text-[#D4A017]"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to Praxis
        </Link>

        <div className="mt-8 flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg border border-[#F5CA50]/40 bg-[#FFFAEC]">
            <PraxisIcon size={16} />
          </span>
          <span className="text-sm font-black tracking-[0.04em] text-neutral-900">PRAXIS</span>
        </div>

        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-neutral-900">{title}</h1>
        <p className="mt-2 text-sm text-neutral-500">Last updated: {updated}</p>

        <p className="mt-6 text-[15px] leading-relaxed text-neutral-600">{intro}</p>

        <div className="mt-10 flex flex-col gap-9">
          {sections.map((section, index) => (
            <section key={section.heading}>
              <h2 className="text-lg font-bold text-neutral-900">
                <span className="mr-2 text-sm font-bold text-[#D4A017] tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {section.heading}
              </h2>
              <div className="mt-3 flex flex-col gap-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-[15px] leading-relaxed text-neutral-600">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-14 border-t border-neutral-200/80 pt-6">
          <p className="text-xs text-neutral-500">
            Questions about this page?{' '}
            <Link href="/#contact" className="font-semibold text-[#D97706] underline-offset-4 hover:underline">
              Get in touch
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  )
}

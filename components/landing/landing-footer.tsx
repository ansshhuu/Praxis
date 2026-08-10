import Link from 'next/link'

function PraxisIcon({ size = 16, color = '#D4A017' }: { size?: number; color?: string }) {
  const c = size / 2
  const rays = 8
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden="true">
      {Array.from({ length: rays }, (_, i) => {
        const angle = (i * 360) / rays
        const rad = (angle * Math.PI) / 180
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

export function LandingFooter() {
  return (
    <footer className="w-full border-t border-neutral-200/60 bg-white/50 px-6 py-8" role="contentinfo">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        <Link href="/" className="lnav-logo" aria-label="Praxis home" style={{ marginRight: 0 }}>
          <div className="lnav-logo-mark">
            <PraxisIcon size={16} color="#D4A017" />
          </div>
          <span className="lnav-logo-text">PRAXIS</span>
        </Link>

        <nav className="flex items-center gap-8 text-sm text-neutral-600" aria-label="Footer navigation">
          <a href="#features" className="transition hover:text-neutral-900">Features</a>
          <a href="#pricing" className="transition hover:text-neutral-900">Pricing</a>
          <Link href="/privacy" className="transition hover:text-neutral-900">Privacy</Link>
          <Link href="/terms" className="transition hover:text-neutral-900">Terms</Link>
        </nav>

        <p className="m-0 text-xs text-neutral-500">
          &copy; {new Date().getFullYear()} Praxis Inc. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

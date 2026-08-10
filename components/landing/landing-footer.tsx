'use client'

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

const footerLinks = [
  { label: 'Features',      href: '#features' },
  { label: 'Modules',       href: '#modules'  },
  { label: 'Pricing',       href: '#pricing'  },
  { label: 'Privacy',       href: '#'         },
  { label: 'Terms',         href: '#'         },
]

export function LandingFooter() {
  return (
    <footer className="landing-footer" role="contentinfo">
      <div
        style={{
          maxWidth: 1060,
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <Link href="/" aria-label="Praxis" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: '#111111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PraxisIcon size={14} color="#D4A017" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em', color: '#111111' }}>PRAXIS</span>
        </Link>

        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', justifyContent: 'center' }} aria-label="Footer navigation">
          {footerLinks.map((link) => (
            <a key={link.label} href={link.href} className="footer-link">{link.label}</a>
          ))}
        </nav>

        <p style={{ fontSize: 12, color: '#B5AFA9', margin: 0 }}>
          © {new Date().getFullYear()} EAWMP. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

function PraxisIcon({ size = 20, color = '#D4A017' }: { size?: number; color?: string }) {
  const c = size / 2
  const rays = 8
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden="true">
      {Array.from({ length: rays }, (_, i) => {
        const angle = (i * 360) / rays
        const rad   = (angle * Math.PI) / 180
        const inner = c * 0.35
        const outer = c * 0.82
        const x1 = c + inner * Math.cos(rad)
        const y1 = c + inner * Math.sin(rad)
        const x2 = c + outer * Math.cos(rad)
        const y2 = c + outer * Math.sin(rad)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={size * 0.09} strokeLinecap="round" />
      })}
      <circle cx={c} cy={c} r={c * 0.28} fill={color} />
    </svg>
  )
}

const NAV_LINKS = [
  { label: 'Home',          href: '#hero' },
  { label: 'Modules',       href: '#modules' },
  { label: 'Solutions',     href: '#features' },
  { label: 'Pricing',       href: '#pricing' },
  { label: 'Documentation', href: '#docs' },
]

export function LandingNav() {
  const [scrolled, setScrolled]       = useState(false)
  const [hidden, setHidden]           = useState(false)
  const [mobileOpen, setMobileOpen]   = useState(false)
  const lastScrollY                   = useRef(0)
  const scrollDelta                   = useRef(0)
  const HIDE_THRESHOLD                = 12
  const TOP_LOCK                      = 50

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY

      if (current < TOP_LOCK) {
        setHidden(false)
        setScrolled(false)
        lastScrollY.current = current
        scrollDelta.current = 0
        return
      }

      setScrolled(true)

      const delta = current - lastScrollY.current
      scrollDelta.current += delta

      if (Math.abs(scrollDelta.current) >= HIDE_THRESHOLD) {
        setHidden(scrollDelta.current > 0)
        scrollDelta.current = 0
      }

      lastScrollY.current = current
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <div className={`lnav-wrap${hidden ? ' lnav-hidden' : ''}`}>
        <nav className={`lnav${scrolled ? ' scrolled' : ''}`} aria-label="Main navigation">
          <Link href="/" className="lnav-logo" aria-label="Praxis home">
            <div className="lnav-logo-mark">
              <PraxisIcon size={16} color="#D4A017" />
            </div>
            <span className="lnav-logo-text">PRAXIS</span>
          </Link>

          <div className="lnav-links">
            {NAV_LINKS.map((link) => (
              <a key={link.label} href={link.href} className="lnav-link">
                {link.label}
              </a>
            ))}
          </div>

          <div className="lnav-actions">
            <Link href="/login" className="lnav-btn-ghost">Login</Link>
            <Link href="/login" id="nav-signup-btn" className="lnav-btn-solid">Sign Up</Link>
          </div>

          <button
            className="lnav-mobile-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </nav>
      </div>

      <div className={`lnav-mobile-drawer${mobileOpen ? ' open' : ''}`} aria-hidden={!mobileOpen}>
        <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="lnav-link"
              onClick={() => setMobileOpen(false)}
              style={{ display: 'block' }}
            >
              {link.label}
            </a>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
            <Link href="/login" className="lnav-btn-ghost" style={{ flex: 1, textAlign: 'center' }}>
              Login
            </Link>
            <Link href="/login" className="lnav-btn-solid" style={{ flex: 1, textAlign: 'center' }}>
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

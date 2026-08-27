'use client'

import Link from 'next/link'
import { useState } from 'react'

function PraxisIcon({ size = 24, color = '#D4A017' }: { size?: number; color?: string }) {
  const c = size / 2
  const rays = 8
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden="true">
      {Array.from({ length: rays }, (_, i) => {
        const angle = (i * 360) / rays
        const rad = (angle * Math.PI) / 180
        const inner = c * 0.35
        const outer = c * 0.82
        return (
          <line
            key={i}
            x1={c + inner * Math.cos(rad)} y1={c + inner * Math.sin(rad)}
            x2={c + outer * Math.cos(rad)} y2={c + outer * Math.sin(rad)}
            stroke={color} strokeWidth={size * 0.09} strokeLinecap="round"
          />
        )
      })}
      <circle cx={c} cy={c} r={c * 0.28} fill={color} />
    </svg>
  )
}

const baseInput: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1.5px solid #E5E2DC', fontSize: 14, color: '#111111',
  background: '#FAFAF8', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit', transition: 'border-color 0.15s',
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } finally {
      setLoading(false)
      setSubmitted(true)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans, Inter, ui-sans-serif, system-ui, sans-serif)', background: '#fff', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 44, textDecoration: 'none' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FFFAEC', border: '1.5px solid rgba(245,202,80,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PraxisIcon size={17} color="#D4A017" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: '0.05em', color: '#111111' }}>PRAXIS</span>
        </Link>

        <h1 style={{ fontSize: 25, fontWeight: 800, color: '#111111', letterSpacing: '-0.03em', margin: '0 0 6px' }}>Forgot password?</h1>
        <p style={{ fontSize: 14, color: '#66615B', margin: '0 0 28px', lineHeight: 1.5 }}>
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        {submitted ? (
          <div role="status" id="forgot-password-success" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '14px 16px', fontSize: 13.5, color: '#166534', lineHeight: 1.5 }}>
            If an account exists for that email, we&apos;ve sent a password reset link. Please check your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit} id="forgot-password-form">
            <div style={{ marginBottom: 20 }}>
              <label htmlFor="email-input" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#111111', marginBottom: 6 }}>
                Email address
              </label>
              <input id="email-input" type="email" placeholder="name@company.com" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)} style={baseInput} />
            </div>

            <button type="submit" id="send-reset-link-button" disabled={loading}
              style={{ width: '100%', padding: '12px', borderRadius: 10, background: '#111111', color: '#fff', fontSize: 14.5, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, letterSpacing: '-0.01em', transition: 'opacity 0.15s' }}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: '#66615B' }}>
          Remembered your password?{' '}
          <Link href="/login" id="back-to-login-link" style={{ color: '#D4A017', fontWeight: 700, textDecoration: 'none' }}>Back to login</Link>
        </p>
      </div>
    </div>
  )
}

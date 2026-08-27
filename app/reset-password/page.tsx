'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

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
const errInput: React.CSSProperties = { ...baseInput, border: '1.5px solid #dc2626' }

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('This reset link is missing or invalid. Please request a new one.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data?.error || 'Invalid or expired token.')
        setLoading(false)
        return
      }

      router.push('/login')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
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

        <h1 style={{ fontSize: 25, fontWeight: 800, color: '#111111', letterSpacing: '-0.03em', margin: '0 0 6px' }}>Reset your password</h1>
        <p style={{ fontSize: 14, color: '#66615B', margin: '0 0 28px', lineHeight: 1.5 }}>Choose a new password for your account.</p>

        <form onSubmit={handleSubmit} id="reset-password-form">
          <div style={{ marginBottom: 18 }}>
            <label htmlFor="new-password-input" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#111111', marginBottom: 6 }}>
              New password
            </label>
            <input id="new-password-input" type="password" placeholder="••••••••" autoComplete="new-password" required
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={error ? errInput : baseInput} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label htmlFor="confirm-password-input" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#111111', marginBottom: 6 }}>
              Confirm new password
            </label>
            <input id="confirm-password-input" type="password" placeholder="••••••••" autoComplete="new-password" required
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={error ? errInput : baseInput} />
          </div>

          {error && (
            <div role="alert" id="reset-password-error" style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button type="submit" id="reset-password-button" disabled={loading}
            style={{ width: '100%', padding: '12px', borderRadius: 10, background: '#111111', color: '#fff', fontSize: 14.5, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, letterSpacing: '-0.01em', transition: 'opacity 0.15s' }}>
            {loading ? 'Resetting…' : 'Reset password'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: '#66615B' }}>
          <Link href="/login" id="back-to-login-link" style={{ color: '#D4A017', fontWeight: 700, textDecoration: 'none' }}>Back to login</Link>
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}

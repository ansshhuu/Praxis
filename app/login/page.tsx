'use client'

import { Eye, EyeOff } from 'lucide-react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { AuthTransitionOverlay } from '@/components/auth/auth-transition-overlay'
import { CREDENTIALS_ERRORS } from '@/lib/auth/errors'

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

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [navigating, setNavigating] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await signIn('credentials', { email, password, redirect: false })
    if (!result || result.error) {
      if (result?.error === CREDENTIALS_ERRORS.userNotFound) {
        router.replace(`/register?email=${encodeURIComponent(email)}&reason=no-account`)
        return
      }
      setLoading(false)
      setError('Invalid email or password. Please try again.')
      return
    }
    setNavigating(true)
    window.location.assign('/dashboard')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-sans, Inter, ui-sans-serif, system-ui, sans-serif)', background: '#fff' }}>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 44, textDecoration: 'none' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FFFAEC', border: '1.5px solid rgba(245,202,80,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PraxisIcon size={17} color="#D4A017" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: '0.05em', color: '#111111' }}>PRAXIS</span>
          </Link>

          <h1 style={{ fontSize: 25, fontWeight: 800, color: '#111111', letterSpacing: '-0.03em', margin: '0 0 6px' }}>Login to Praxis</h1>
          <p style={{ fontSize: 14, color: '#66615B', margin: '0 0 28px', lineHeight: 1.5 }}>Welcome back! Please login to your account.</p>

          <form onSubmit={handleSubmit} id="login-form">
            <div style={{ marginBottom: 18 }}>
              <label htmlFor="email-input" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#111111', marginBottom: 6 }}>
                Email address
              </label>
              <input id="email-input" type="email" placeholder="name@company.com" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)} style={error ? errInput : baseInput} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label htmlFor="password-input" style={{ fontSize: 13, fontWeight: 600, color: '#111111' }}>Password</label>
                <a href="#" id="forgot-password-link" style={{ fontSize: 12, color: '#D4A017', textDecoration: 'none', fontWeight: 600 }}>Forgot password?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <input id="password-input" type={showPw ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  style={{ ...(error ? errInput : baseInput), paddingRight: 44 }} />
                <button type="button" id="toggle-password-btn" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#66615B', padding: 0, display: 'flex', alignItems: 'center' }}
                  aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <input id="remember-me" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: 15, height: 15, accentColor: '#111111', cursor: 'pointer', flexShrink: 0 }} />
              <label htmlFor="remember-me" style={{ fontSize: 13, color: '#66615B', cursor: 'pointer' }}>Remember me</label>
            </div>

            {error && (
              <div role="alert" id="login-error" style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button type="submit" id="sign-in-button" disabled={loading}
              style={{ width: '100%', padding: '12px', borderRadius: 10, background: '#111111', color: '#fff', fontSize: 14.5, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, letterSpacing: '-0.01em', transition: 'opacity 0.15s' }}>
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#EAE3D9' }} />
            <span style={{ fontSize: 12, color: '#9F9A93', whiteSpace: 'nowrap' }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: '#EAE3D9' }} />
          </div>

          <button id="google-login-btn" type="button" disabled={oauthLoading}
            onClick={() => { setOauthLoading(true); void signIn('google', { callbackUrl: '/dashboard' }) }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E5E2DC', background: '#fff', fontSize: 13.5, fontWeight: 600, color: '#111111', cursor: oauthLoading ? 'not-allowed' : 'pointer', opacity: oauthLoading ? 0.7 : 1, boxSizing: 'border-box' }}>
            <GoogleIcon /> {oauthLoading ? 'Redirecting…' : 'Google'}
          </button>

          <p style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: '#66615B' }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" id="signup-link" style={{ color: '#D4A017', fontWeight: 700, textDecoration: 'none' }}>Sign up</Link>
          </p>
        </div>
      </div>

      <div className="auth-brand-panel"
        style={{ flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#EAE3D9', position: 'relative', overflow: 'hidden', padding: '48px 40px' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translateX(-50%)', width: 480, height: 380, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(245,202,80,0.25) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

        <div style={{ position: 'absolute', top: 80,  right: 80,  width: 10, height: 10, borderRadius: '50%', background: '#F5CA50', boxShadow: '0 0 10px rgba(245,202,80,0.55)' }} />
        <div style={{ position: 'absolute', top: 160, left: 60,  width: 6,  height: 6,  borderRadius: '50%', background: '#D4A017', opacity: 0.45 }} />
        <div style={{ position: 'absolute', bottom: 120, right: 100, width: 8, height: 8, borderRadius: '50%', background: '#F5CA50', opacity: 0.5 }} />
        <div style={{ position: 'absolute', bottom: 80,  left: 80,  width: 5,  height: 5,  borderRadius: '50%', background: '#D4A017', opacity: 0.35 }} />
        <div style={{ position: 'absolute', top: 40,   left: '42%', width: 4,  height: 4,  borderRadius: '50%', background: '#F5CA50', opacity: 0.6 }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 360 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 52 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#FFFAEC', border: '2px solid rgba(245,202,80,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(212,160,23,0.2)' }}>
              <PraxisIcon size={24} color="#D4A017" />
            </div>
            <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: '0.06em', color: '#111111' }}>PRAXIS</span>
          </div>

          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#111111', letterSpacing: '-0.04em', lineHeight: 1.1, margin: '0 0 16px' }}>
            Automate. Collaborate.<br />Accelerate.
          </h2>
          <p style={{ fontSize: 16, color: '#66615B', lineHeight: 1.65, margin: '0 0 40px' }}>
            One platform to power all your enterprise workflows.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {['AI Processing', 'Workflow Automation', 'Resume Screening', 'AI Assistant'].map((feat) => (
              <span key={feat} style={{ padding: '6px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(0,0,0,0.09)', fontSize: 12, fontWeight: 600, color: '#66615B' }}>
                {feat}
              </span>
            ))}
          </div>
        </div>
      </div>

      {navigating && <AuthTransitionOverlay label="Signing you in…" />}
    </div>
  )
}

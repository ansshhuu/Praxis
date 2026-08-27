'use client'

function PraxisRays({ size, color }: { size: number; color: string }) {
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

export function AuthTransitionOverlay({ label = 'Loading your workspace…' }: { label?: string }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 999, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: '#FAFAF8', animation: 'authOverlayFadeIn 0.25s ease-out',
      }}
    >
      <style>{`
        @keyframes authOverlayFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes authOverlaySpin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes authOverlayPulse { 0%, 100% { transform: scale(1); opacity: 0.55 } 50% { transform: scale(1.15); opacity: 0.9 } }
        @keyframes authOverlayRise { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      <div style={{ position: 'relative', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245,202,80,0.45) 0%, transparent 70%)',
            animation: 'authOverlayPulse 1.6s ease-in-out infinite',
          }}
        />
        <div style={{ animation: 'authOverlaySpin 1.4s linear infinite', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PraxisRays size={40} color="#D4A017" />
        </div>
      </div>

      <p
        style={{
          marginTop: 22, fontSize: 14, fontWeight: 600, color: '#66615B',
          animation: 'authOverlayRise 0.4s ease-out 0.1s both',
        }}
      >
        {label}
      </p>
    </div>
  )
}

'use client'

import { CheckCircle2, X, XCircle } from 'lucide-react'
import { useEffect } from 'react'

import { cn } from '@/lib/utils'

export type Toast = { id: number; kind: 'success' | 'error'; message: string }

export function RunToast({
  toast,
  onDismiss,
}: {
  toast: Toast | null
  onDismiss: () => void
}) {
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(onDismiss, 5000)
    return () => window.clearTimeout(timer)
  }, [toast, onDismiss])

  if (!toast) return null

  const Icon = toast.kind === 'success' ? CheckCircle2 : XCircle

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-lg"
    >
      <Icon
        className={cn(
          'mt-0.5 size-4 shrink-0',
          toast.kind === 'success' ? 'text-[#16a34a]' : 'text-destructive',
        )}
      />
      <p className="max-w-xs text-sm text-foreground">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="-mr-1 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

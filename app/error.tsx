'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app] unhandled error:', error)
  }, [error])

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-[#FAF8F5] px-6 text-center">
      <p className="text-[13px] font-bold tracking-[0.14em] text-red-600 uppercase">Error</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-[15px] text-neutral-600">
        The page failed to load. Trying again often resolves it.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-neutral-400">Reference: {error.digest}</p>
      )}
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-full bg-[#111111] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-125"
      >
        Try again
      </button>
    </main>
  )
}

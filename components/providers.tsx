'use client'

import { MotionConfig } from 'framer-motion'
import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {/*
        reducedMotion="user" makes framer-motion honour the OS setting app-wide:
        transform and layout animations are dropped, opacity still crossfades,
        so nothing appears or disappears abruptly. Non-transform effects (the
        stat count-up, the chat typewriter) check the query themselves.
      */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </SessionProvider>
  )
}

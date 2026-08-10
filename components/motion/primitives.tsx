'use client'

import {
  animate,
  useInView,
  useMotionValue,
  useReducedMotion,
  motion,
  type Variants,
} from 'framer-motion'
import React, { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

export const EASE_OUT = [0.22, 1, 0.36, 1] as const

export function Reveal({
  children,
  delay = 0,
  y = 20,
  duration = 0.4,
  once = true,
  amount = 0.3,
  className,
  as = 'div',
}: {
  children: React.ReactNode
  delay?: number
  y?: number
  duration?: number
  once?: boolean
  amount?: number
  className?: string
  as?: 'div' | 'span' | 'section' | 'li' | 'p'
}) {
  const Component = motion[as] as typeof motion.div
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: EASE_OUT }}
    >
      {children}
    </Component>
  )
}

const wordContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.05 } },
}

const wordChild: Variants = {
  hidden: { opacity: 0, y: '0.4em' },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: EASE_OUT } },
}

export function WordReveal({
  text,
  className,
  once = true,
}: {
  text: string
  className?: string
  once?: boolean
}) {
  const words = text.split(' ')
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <motion.span
        aria-hidden="true"
        variants={wordContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once, amount: 0.5 }}
        style={{ display: 'inline-block' }}
      >
        {words.map((word, i) => (
          <span
            key={`${word}-${i}`}
            style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }}
          >
            <motion.span variants={wordChild} style={{ display: 'inline-block' }}>
              {word}
              {i < words.length - 1 ? ' ' : ''}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </span>
  )
}

export function StaggerGroup({
  children,
  className,
  stagger = 0.06,
  delayChildren = 0,
  once = true,
  inView = false,
}: {
  children: React.ReactNode
  className?: string
  stagger?: number
  delayChildren?: number
  once?: boolean
  inView?: boolean
}) {
  const variants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren } },
  }
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      {...(inView
        ? { whileInView: 'visible', viewport: { once, amount: 0.2 } }
        : { animate: 'visible' })}
    >
      {children}
    </motion.div>
  )
}

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: EASE_OUT } },
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div className={className} variants={staggerItem}>
      {children}
    </motion.div>
  )
}

export function parseStatValue(value: string): {
  prefix: string
  target: number
  suffix: string
  decimals: number
  grouped: boolean
} | null {
  const match = /^([^\d-]*)(-?[\d,]*\.?\d+)(.*)$/.exec(value.trim())
  if (!match) return null

  const [, prefix, rawNumber, suffix] = match
  const target = Number(rawNumber.replace(/,/g, ''))
  if (!Number.isFinite(target)) return null

  const decimals = rawNumber.includes('.') ? rawNumber.split('.')[1].length : 0
  return { prefix, target, suffix, decimals, grouped: rawNumber.includes(',') }
}

function formatValue(
  value: number,
  decimals: number,
  grouped: boolean,
): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: grouped,
  })
}

export function CountUp({
  value,
  duration = 1.2,
  className,
}: {
  value: string
  duration?: number
  className?: string
}) {
  const parsed = parseStatValue(value)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const prefersReduced = useReducedMotion()
  const motionValue = useMotionValue(0)
  const [display, setDisplay] = useState(() =>
    parsed ? `${parsed.prefix}${formatValue(0, parsed.decimals, parsed.grouped)}${parsed.suffix}` : value,
  )

  useEffect(() => {
    if (!parsed || !inView) return

    if (prefersReduced) {
      setDisplay(value)
      return
    }

    const controls = animate(motionValue, parsed.target, {
      duration,
      ease: 'easeOut',
      onUpdate: (latest) => {
        setDisplay(
          `${parsed.prefix}${formatValue(latest, parsed.decimals, parsed.grouped)}${parsed.suffix}`,
        )
      },
      onComplete: () => setDisplay(value),
    })
    return () => controls.stop()
  }, [inView, parsed, value, duration, motionValue, prefersReduced])

  if (!parsed) return <span className={className}>{value}</span>

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" className="tabular-nums">{display}</span>
    </span>
  )
}

export function useTypewriter(
  text: string,
  { enabled = true, minMs = 800, maxMs = 1500 }: { enabled?: boolean; minMs?: number; maxMs?: number } = {},
): { shown: string; done: boolean } {
  const prefersReduced = useReducedMotion()
  const [shown, setShown] = useState(enabled ? '' : text)

  useEffect(() => {
    if (!enabled || prefersReduced) {
      setShown(text)
      return
    }

    const words = text.split(' ')
    if (words.length <= 1) {
      setShown(text)
      return
    }

    const total = Math.min(maxMs, Math.max(minMs, words.length * 28))
    const perWord = total / words.length

    let index = 0
    setShown('')
    const timer = setInterval(() => {
      index += 1
      setShown(words.slice(0, index).join(' '))
      if (index >= words.length) clearInterval(timer)
    }, perWord)

    return () => clearInterval(timer)
  }, [text, enabled, prefersReduced, minMs, maxMs])

  return { shown, done: shown === text }
}

export const hoverCardClass = 'hover-lift-glow'

export function HoverLift({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={cn(className)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.22, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  )
}

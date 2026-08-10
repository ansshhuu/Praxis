'use client'

import { useState } from 'react'

import { cn } from '@/lib/utils'

export function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join('') || '?'
  )
}

export function UserAvatar({
  name,
  src,
  className,
  textClassName = 'text-[10px]',
}: {
  name: string
  src: string | null
  className?: string
  textClassName?: string
}) {
  const [failed, setFailed] = useState(false)
  const [loadedSrc, setLoadedSrc] = useState(src)

  // Reset the fallback when the photo changes — React's documented
  // "adjusting state when a prop changes" pattern, not an effect.
  if (loadedSrc !== src) {
    setLoadedSrc(src)
    setFailed(false)
  }

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatars are <=96px, sized by an
      // arbitrary caller className, and may come from an external OAuth host; next/image would
      // need `fill` plus a positioned parent at every call site for no meaningful LCP gain.
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
        className={cn('shrink-0 rounded-full object-cover', className)}
      />
    )
  }

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-[#EAE3D9] font-bold text-[#66615B]',
        textClassName,
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  )
}

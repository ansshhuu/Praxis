'use client'

import { useEffect, useState } from 'react'

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

  useEffect(() => setFailed(false), [src])

  if (src && !failed) {
    return (
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

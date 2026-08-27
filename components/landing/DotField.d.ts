import type * as React from 'react'

export interface DotFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  dotRadius?: number
  dotSpacing?: number
  cursorRadius?: number
  cursorForce?: number
  bulgeOnly?: boolean
  bulgeStrength?: number
  glowRadius?: number
  sparkle?: boolean
  waveAmplitude?: number
  gradientFrom?: string
  gradientTo?: string
  glowColor?: string
}

declare const DotField: React.MemoExoticComponent<React.FC<DotFieldProps>>

export default DotField

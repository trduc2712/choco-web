import type { HTMLAttributes, Ref } from 'react'

import { cx } from '@/lib/cx'

import styles from './heading.module.scss'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6
export type HeadingSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'

export type HeadingTone = 'default' | 'muted'
export type HeadingAlign = 'start' | 'center' | 'end'

export type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  level: HeadingLevel
  size?: HeadingSize
  tone?: HeadingTone
  align?: HeadingAlign
  ref?: Ref<HTMLHeadingElement>
}

const DEFAULT_SIZES: Record<HeadingLevel, HeadingSize> = {
  1: '3xl',
  2: '2xl',
  3: 'xl',
  4: 'lg',
  5: 'md',
  6: 'sm',
}

export function Heading({
  level,
  size,
  tone = 'default',
  align,
  className,
  ...props
}: HeadingProps) {
  const Component = `h${level}` as const

  return (
    <Component
      {...props}
      className={cx(
        styles.root,
        styles[`size-${size ?? DEFAULT_SIZES[level]}`],
        tone === 'muted' && styles.muted,
        align && styles[`align-${align}`],
        className,
      )}
    />
  )
}

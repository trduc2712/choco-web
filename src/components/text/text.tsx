import type { HTMLAttributes } from 'react'

import { cx } from '@/lib/cx'

import styles from './text.module.scss'

export type TextElement = 'p' | 'span' | 'div' | 'strong' | 'em'
export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type TextWeight = 'regular' | 'medium' | 'semibold'
export type TextTone =
  'default' | 'muted' | 'primary' | 'danger' | 'success' | 'warning' | 'info'

export type TextAlign = 'start' | 'center' | 'end'

export type TextProps = HTMLAttributes<HTMLElement> & {
  as?: TextElement
  size?: TextSize
  weight?: TextWeight
  tone?: TextTone
  align?: TextAlign
  isTruncated?: boolean
}

export function Text({
  as: Component = 'p',
  size = 'md',
  weight = 'regular',
  tone = 'default',
  align,
  isTruncated = false,
  className,
  ...props
}: TextProps) {
  return (
    <Component
      {...props}
      className={cx(
        styles.root,
        styles[`size-${size}`],
        styles[`weight-${weight}`],
        styles[`tone-${tone}`],
        align && styles[`align-${align}`],
        isTruncated && styles.truncated,
        className,
      )}
    />
  )
}

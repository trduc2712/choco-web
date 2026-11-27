import type { HTMLAttributes } from 'react'

import { cx } from '@/lib/cx'

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
        'text-root',
        `text-size-${size}`,
        `text-weight-${weight}`,
        `text-tone-${tone}`,
        align && `text-align-${align}`,
        isTruncated && 'text-truncated',
        className,
      )}
    />
  )
}

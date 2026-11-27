import type { ComponentProps, HTMLAttributes } from 'react'

import { cx } from '@/lib/cx'

export type CardElement = 'div' | 'article' | 'section' | 'li'
export type CardVariant = 'outlined' | 'elevated' | 'filled'
export type CardPadding = 'sm' | 'md' | 'lg'

export type CardProps = HTMLAttributes<HTMLElement> & {
  as?: CardElement
  variant?: CardVariant
  padding?: CardPadding
}

export type CardPartProps = ComponentProps<'div'>

export function Card({
  as: Component = 'div',
  variant = 'outlined',
  padding = 'md',
  className,
  ...props
}: CardProps) {
  return (
    <Component
      {...props}
      className={cx(
        'card-root',
        `card-${variant}`,
        `card-padding-${padding}`,
        className,
      )}
    />
  )
}

export function CardHeader({ className, ...props }: CardPartProps) {
  return <div {...props} className={cx('card-header', className)} />
}

export function CardBody({ className, ...props }: CardPartProps) {
  return <div {...props} className={cx('card-body', className)} />
}

export function CardFooter({ className, ...props }: CardPartProps) {
  return <div {...props} className={cx('card-footer', className)} />
}

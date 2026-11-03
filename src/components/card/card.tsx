import type { ComponentProps, HTMLAttributes } from 'react'

import { cx } from '@/lib/cx'

import styles from './card.module.scss'

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
        styles.root,
        styles[variant],
        styles[`padding-${padding}`],
        className,
      )}
    />
  )
}

export function CardHeader({ className, ...props }: CardPartProps) {
  return <div {...props} className={cx(styles.header, className)} />
}

export function CardBody({ className, ...props }: CardPartProps) {
  return <div {...props} className={cx(styles.body, className)} />
}

export function CardFooter({ className, ...props }: CardPartProps) {
  return <div {...props} className={cx(styles.footer, className)} />
}

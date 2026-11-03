import { cx } from '@/lib/cx'

import styles from './divider.module.scss'

export type DividerOrientation = 'horizontal' | 'vertical'
export type DividerVariant = 'solid' | 'dashed'

export type DividerProps = {
  orientation?: DividerOrientation
  variant?: DividerVariant
  label?: string
  isDecorative?: boolean
  className?: string
}

export function Divider({
  orientation = 'horizontal',
  variant = 'solid',
  label,
  isDecorative = true,
  className,
}: DividerProps) {
  const lineClassName = cx(
    styles.root,
    styles[orientation],
    variant === 'dashed' && styles.dashed,
    !isDecorative && styles.semantic,
  )
  const semantics = isDecorative
    ? { 'aria-hidden': true }
    : { role: 'separator', 'aria-orientation': orientation }

  if (label && orientation === 'horizontal') {
    return (
      <div
        className={cx(styles.labelled, className)}
        role={isDecorative ? undefined : 'separator'}
      >
        <div className={cx(lineClassName, styles.line)} aria-hidden="true" />
        {label}
        <div className={cx(lineClassName, styles.line)} aria-hidden="true" />
      </div>
    )
  }

  return <div className={cx(lineClassName, className)} {...semantics} />
}

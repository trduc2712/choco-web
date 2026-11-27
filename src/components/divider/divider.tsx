import { cx } from '@/lib/cx'

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
    'divider-root',
    `divider-${orientation}`,
    variant === 'dashed' && 'divider-dashed',
    !isDecorative && 'divider-semantic',
  )
  const semantics = isDecorative
    ? { 'aria-hidden': true }
    : { role: 'separator', 'aria-orientation': orientation }

  if (label && orientation === 'horizontal') {
    return (
      <div
        className={cx('divider-labelled', className)}
        role={isDecorative ? undefined : 'separator'}
      >
        <div className={cx(lineClassName, 'divider-line')} aria-hidden="true" />
        {label}
        <div className={cx(lineClassName, 'divider-line')} aria-hidden="true" />
      </div>
    )
  }

  return <div className={cx(lineClassName, className)} {...semantics} />
}

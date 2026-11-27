import { useId } from 'react'

import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { cx } from '@/lib/cx'

export type ProgressTone = 'primary' | 'success' | 'danger'

export type ProgressProps = {
  label: string
  value?: number
  max?: number
  tone?: ProgressTone
  isLabelHidden?: boolean
  isValueShown?: boolean
  className?: string
}

const percentFormatter = new Intl.NumberFormat(undefined, {
  style: 'percent',
  maximumFractionDigits: 0,
})

export function Progress({
  label,
  value,
  max = 100,
  tone = 'primary',
  isLabelHidden = false,
  isValueShown = false,
  className,
}: ProgressProps) {
  const id = useId()
  const labelId = `${id}-label`
  const ratio =
    value === undefined ? undefined : Math.min(Math.max(value / max, 0), 1)
  const valueText =
    ratio === undefined ? undefined : percentFormatter.format(ratio)

  return (
    <div className={cx('progress-root', `progress-${tone}`, className)}>
      {isLabelHidden ? (
        <VisuallyHidden id={labelId}>{label}</VisuallyHidden>
      ) : (
        <div className="progress-header">
          <span id={labelId} className="progress-label">
            {label}
          </span>
          {isValueShown && valueText && (
            <span className="progress-value" aria-hidden="true">
              {valueText}
            </span>
          )}
        </div>
      )}
      <progress
        aria-labelledby={labelId}
        max={max}
        value={value}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={valueText}
      />
    </div>
  )
}

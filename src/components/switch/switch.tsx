import type { ComponentProps } from 'react'

import { cx } from '@/lib/cx'

export type SwitchLabelPosition = 'start' | 'end'

export type SwitchProps = Omit<ComponentProps<'input'>, 'type' | 'role'> & {
  label: string
  labelPosition?: SwitchLabelPosition
}

export function Switch({
  label,
  labelPosition = 'end',
  className,
  ...props
}: SwitchProps) {
  return (
    <label
      className={cx(
        'switch-root',
        labelPosition === 'start' && 'switch-end',
        className,
      )}
    >
      <input
        {...props}
        className="switch-input"
        type="checkbox"
        role="switch"
      />
      <span className="switch-track">
        <span className="switch-thumb" />
      </span>
      <span className="switch-label">{label}</span>
    </label>
  )
}

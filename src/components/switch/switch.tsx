import type { ComponentProps } from 'react'

import { cx } from '@/lib/cx'

import styles from './switch.module.scss'

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
        styles.root,
        labelPosition === 'start' && styles.end,
        className,
      )}
    >
      <input
        {...props}
        className={styles.input}
        type="checkbox"
        role="switch"
      />
      <span className={styles.track}>
        <span className={styles.thumb} />
      </span>
      <span className={styles.label}>{label}</span>
    </label>
  )
}

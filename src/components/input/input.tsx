import type { ComponentProps, ReactNode } from 'react'
import { useId } from 'react'

import { Field } from '@/components/field/field'
import { getDescribedBy } from '@/components/field/field-ids'
import { Icon } from '@/components/icon/icon'
import type { IconName } from '@/components/icon/icon-paths'
import { cx } from '@/lib/cx'

import styles from './input.module.scss'

export type InputSize = 'sm' | 'md' | 'lg'

export type InputProps = Omit<ComponentProps<'input'>, 'size'> & {
  label: string
  hint?: string
  error?: string
  size?: InputSize
  icon?: IconName
  trailing?: ReactNode
  isLabelHidden?: boolean
}

export function Input({
  label,
  hint,
  error,
  size = 'md',
  icon,
  trailing,
  isLabelHidden,
  id,
  required,
  className,
  ...props
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <Field
      id={inputId}
      label={label}
      hint={hint}
      error={error}
      isRequired={required}
      isLabelHidden={isLabelHidden}
      className={className}
    >
      <div className={styles.control}>
        {icon && <Icon className={styles.icon} name={icon} />}
        <input
          {...props}
          id={inputId}
          className={cx(
            styles.input,
            styles[size],
            icon && styles.withIcon,
            trailing !== undefined && styles.withTrailing,
          )}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={getDescribedBy(inputId, hint, error)}
        />
        {trailing !== undefined && (
          <div className={styles.trailing}>{trailing}</div>
        )}
      </div>
    </Field>
  )
}

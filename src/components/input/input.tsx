import type { ComponentProps, ReactNode } from 'react'
import { useId } from 'react'

import { Field } from '@/components/field/field'
import { getDescribedBy } from '@/components/field/field-ids'
import { Icon } from '@/components/icon/icon'
import type { IconName } from '@/components/icon/icon-paths'
import { cx } from '@/lib/cx'

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
      <div className="input-control">
        {icon && <Icon className="input-icon" name={icon} />}
        <input
          {...props}
          id={inputId}
          className={cx(
            'input-input',
            `input-${size}`,
            icon && 'input-withIcon',
            trailing !== undefined && 'input-withTrailing',
          )}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={getDescribedBy(inputId, hint, error)}
        />
        {trailing !== undefined && (
          <div className="input-trailing">{trailing}</div>
        )}
      </div>
    </Field>
  )
}

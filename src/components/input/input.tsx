import type { ComponentProps, ReactNode } from 'react'
import { useId } from 'react'

import { Field } from '@/components/field/field'
import { getDescribedBy } from '@/components/field/field-ids'
import type { SymbolName } from '@/lib/symbols'
import { symbols } from '@/lib/symbols'

export type InputProps = Omit<ComponentProps<'input'>, 'size'> & {
  label: string
  hint?: string
  error?: string
  icon?: SymbolName
  trailing?: ReactNode
  isLabelHidden?: boolean
}

export function Input({
  label,
  hint,
  error,
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
      <div>
        {icon && <span aria-hidden="true">{symbols[icon]}</span>}
        <input
          {...props}
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={getDescribedBy(inputId, hint, error)}
        />
        {trailing !== undefined && <div>{trailing}</div>}
      </div>
    </Field>
  )
}

import type { ComponentProps } from 'react'
import { useId } from 'react'

import { Field } from '@/components/field/field'
import { getDescribedBy } from '@/components/field/field-ids'

import styles from './textarea.module.scss'

export type TextareaProps = ComponentProps<'textarea'> & {
  label: string
  hint?: string
  error?: string
  isLabelHidden?: boolean
}

export function Textarea({
  label,
  hint,
  error,
  isLabelHidden,
  id,
  required,
  className,
  ...props
}: TextareaProps) {
  const generatedId = useId()
  const textareaId = id ?? generatedId

  return (
    <Field
      id={textareaId}
      label={label}
      hint={hint}
      error={error}
      isRequired={required}
      isLabelHidden={isLabelHidden}
      className={className}
    >
      <textarea
        {...props}
        id={textareaId}
        className={styles.textarea}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={getDescribedBy(textareaId, hint, error)}
      />
    </Field>
  )
}

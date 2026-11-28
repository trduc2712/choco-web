import { useId } from 'react'

import { Field } from '@/components/field/field'
import { getDescribedBy } from '@/components/field/field-ids'

export type SelectOption = {
  value: string
  label: string
  isDisabled?: boolean
}

export type SelectProps = {
  label: string
  options: SelectOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  placeholder?: string
  hint?: string
  error?: string
  name?: string
  id?: string
  isLabelHidden?: boolean
  isDisabled?: boolean
  isRequired?: boolean
  className?: string
}

export function Select({
  label,
  options,
  value,
  defaultValue,
  onChange,
  placeholder,
  hint,
  error,
  name,
  id,
  isLabelHidden,
  isDisabled = false,
  isRequired = false,
  className,
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const requestedValue = value ?? defaultValue ?? ''
  const selectedValue = options.some(
    (option) => option.value === requestedValue,
  )
    ? requestedValue
    : ''
  const hasEmptyOption = options.some((option) => option.value === '')

  return (
    <Field
      id={selectId}
      label={label}
      hint={hint}
      error={error}
      isRequired={isRequired}
      isLabelHidden={isLabelHidden}
      className={className}
    >
      <select
        id={selectId}
        name={name}
        value={value === undefined ? undefined : selectedValue}
        defaultValue={value === undefined ? selectedValue : undefined}
        disabled={isDisabled}
        required={isRequired}
        aria-invalid={error ? true : undefined}
        aria-describedby={getDescribedBy(selectId, hint, error)}
        onChange={(event) => onChange?.(event.currentTarget.value)}
      >
        {!hasEmptyOption && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.isDisabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

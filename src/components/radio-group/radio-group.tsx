import { useId } from 'react'

import type { SymbolName } from '@/lib/symbols'
import { symbols } from '@/lib/symbols'

export type RadioOption = {
  value: string
  label: string
  hint?: string
  icon?: SymbolName
  isDisabled?: boolean
}

export type RadioGroupProps = {
  label: string
  name: string
  options: RadioOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  error?: string
  isRequired?: boolean
  className?: string
}

export function RadioGroup({
  label,
  name,
  options,
  value,
  defaultValue,
  onChange,
  error,
  isRequired = false,
  className,
}: RadioGroupProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <fieldset
      className={className}
      aria-describedby={error ? errorId : undefined}
    >
      <legend>{label}</legend>
      <div>
        {options.map((option) => {
          const labelId = `${id}-${option.value}-label`
          const hintId = `${id}-${option.value}-hint`

          const input = (
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === undefined ? undefined : value === option.value}
              defaultChecked={
                value === undefined && defaultValue !== undefined
                  ? defaultValue === option.value
                  : undefined
              }
              disabled={option.isDisabled}
              required={isRequired}
              aria-labelledby={labelId}
              aria-describedby={option.hint ? hintId : undefined}
              onChange={() => onChange?.(option.value)}
            />
          )

          return (
            <label key={option.value}>
              {input}
              {option.icon && (
                <span aria-hidden="true">{symbols[option.icon]} </span>
              )}
              <span>
                <span id={labelId}>{option.label}</span>
                {option.hint && <span id={hintId}> {option.hint}</span>}
              </span>
            </label>
          )
        })}
      </div>
      {error && <p id={errorId}>{error}</p>}
    </fieldset>
  )
}

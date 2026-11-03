import { useId } from 'react'

import { cx } from '@/lib/cx'

import styles from './radio-group.module.scss'

export type RadioOption = {
  value: string
  label: string
  hint?: string
  isDisabled?: boolean
}

export type RadioGroupOrientation = 'vertical' | 'horizontal'

export type RadioGroupProps = {
  label: string
  name: string
  options: RadioOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  orientation?: RadioGroupOrientation
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
  orientation = 'vertical',
  error,
  isRequired = false,
  className,
}: RadioGroupProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <fieldset
      className={cx(styles.root, className)}
      aria-describedby={error ? errorId : undefined}
    >
      <legend className={styles.legend}>{label}</legend>
      <div className={cx(styles.options, styles[orientation])}>
        {options.map((option) => {
          const hintId = `${id}-${option.value}-hint`

          return (
            <div key={option.value} className={styles.item}>
              <label className={styles.option}>
                <input
                  className={styles.input}
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={
                    value === undefined ? undefined : value === option.value
                  }
                  defaultChecked={
                    value === undefined && defaultValue !== undefined
                      ? defaultValue === option.value
                      : undefined
                  }
                  disabled={option.isDisabled}
                  required={isRequired}
                  aria-describedby={option.hint ? hintId : undefined}
                  onChange={() => onChange?.(option.value)}
                />
                <span className={styles.circle} />
                <span className={styles.text}>{option.label}</span>
              </label>
              {option.hint && (
                <p id={hintId} className={styles.hint}>
                  {option.hint}
                </p>
              )}
            </div>
          )
        })}
      </div>
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </fieldset>
  )
}

import { useId } from 'react'

import { Icon } from '@/components/icon/icon'
import type { IconName } from '@/components/icon/icon-paths'
import { cx } from '@/lib/cx'

export type RadioOption = {
  value: string
  label: string
  hint?: string
  // Shown at the start of the option. Only the card variant draws it.
  icon?: IconName
  isDisabled?: boolean
}

export type RadioGroupOrientation = 'vertical' | 'horizontal'
// `card` draws each option as a bordered, selectable card with its hint
// inside, for choices that need more than a word to explain.
export type RadioGroupVariant = 'default' | 'card'

export type RadioGroupProps = {
  label: string
  name: string
  options: RadioOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  orientation?: RadioGroupOrientation
  variant?: RadioGroupVariant
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
  variant = 'default',
  error,
  isRequired = false,
  className,
}: RadioGroupProps) {
  const id = useId()
  const errorId = `${id}-error`
  const isCard = variant === 'card'

  return (
    <fieldset
      className={cx('radio-group-root', className)}
      aria-describedby={error ? errorId : undefined}
    >
      <legend
        className={cx('radio-group-legend', isCard && 'radio-group-cardLegend')}
      >
        {label}
      </legend>
      <div
        className={cx(
          'radio-group-options',
          `radio-group-${orientation}`,
          isCard && 'radio-group-cards',
        )}
      >
        {options.map((option) => {
          const labelId = `${id}-${option.value}-label`
          const hintId = `${id}-${option.value}-hint`

          const input = (
            <input
              className="radio-group-input"
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
              // A card holds its hint inside the label, so name the radio by
              // its label text alone.
              aria-labelledby={isCard ? labelId : undefined}
              aria-describedby={option.hint ? hintId : undefined}
              onChange={() => onChange?.(option.value)}
            />
          )

          if (isCard) {
            return (
              <label key={option.value} className="radio-group-card">
                {input}
                <span className="radio-group-circle" />
                {option.icon && (
                  <span className="radio-group-cardIcon">
                    <Icon name={option.icon} size="md" />
                  </span>
                )}
                <span className="radio-group-cardBody">
                  <span id={labelId} className="radio-group-cardLabel">
                    {option.label}
                  </span>
                  {option.hint && (
                    <span id={hintId} className="radio-group-cardHint">
                      {option.hint}
                    </span>
                  )}
                </span>
              </label>
            )
          }

          return (
            <div key={option.value} className="radio-group-item">
              <label className="radio-group-option">
                {input}
                <span className="radio-group-circle" />
                <span className="radio-group-text">{option.label}</span>
              </label>
              {option.hint && (
                <p id={hintId} className="radio-group-hint">
                  {option.hint}
                </p>
              )}
            </div>
          )
        })}
      </div>
      {error && (
        <p id={errorId} className="radio-group-error">
          {error}
        </p>
      )}
    </fieldset>
  )
}

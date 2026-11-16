import { useId } from 'react'

import { Icon } from '@/components/icon/icon'
import type { IconName } from '@/components/icon/icon-paths'
import { cx } from '@/lib/cx'

import styles from './radio-group.module.scss'

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
      className={cx(styles.root, className)}
      aria-describedby={error ? errorId : undefined}
    >
      <legend className={cx(styles.legend, isCard && styles.cardLegend)}>
        {label}
      </legend>
      <div
        className={cx(
          styles.options,
          styles[orientation],
          isCard && styles.cards,
        )}
      >
        {options.map((option) => {
          const labelId = `${id}-${option.value}-label`
          const hintId = `${id}-${option.value}-hint`

          const input = (
            <input
              className={styles.input}
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
              <label key={option.value} className={styles.card}>
                {input}
                <span className={styles.circle} />
                {option.icon && (
                  <span className={styles.cardIcon}>
                    <Icon name={option.icon} size="md" />
                  </span>
                )}
                <span className={styles.cardBody}>
                  <span id={labelId} className={styles.cardLabel}>
                    {option.label}
                  </span>
                  {option.hint && (
                    <span id={hintId} className={styles.cardHint}>
                      {option.hint}
                    </span>
                  )}
                </span>
              </label>
            )
          }

          return (
            <div key={option.value} className={styles.item}>
              <label className={styles.option}>
                {input}
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

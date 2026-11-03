import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Icon } from '@/components/icon/icon'
import { useControllableState } from '@/hooks/use-controllable-state'
import { cx } from '@/lib/cx'

import styles from './rating.module.scss'

export type RatingSize = 'sm' | 'md'

export type RatingProps = {
  label: string
  value?: number
  defaultValue?: number
  onChange?: (value: number) => void
  max?: number
  size?: RatingSize
  isReadOnly?: boolean
  isDisabled?: boolean
  name?: string
  className?: string
}

export function Rating({
  label,
  value: valueProp,
  defaultValue = 0,
  onChange,
  max = 5,
  size = 'md',
  isReadOnly = false,
  isDisabled = false,
  name,
  className,
}: RatingProps) {
  const { t } = useTranslation()
  const id = useId()
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
  })
  const [hovered, setHovered] = useState<number>()
  const stars = Array.from({ length: max }, (_, index) => index + 1)

  if (isReadOnly) {
    return (
      <span
        className={cx(styles.root, styles[size], className)}
        role="img"
        aria-label={`${label}: ${t('rating.value', { value, max })}`}
      >
        {stars.map((star) => (
          <Icon
            key={star}
            className={cx(
              styles.star,
              star <= Math.round(value) && styles.filled,
            )}
            name="star"
          />
        ))}
      </span>
    )
  }

  const shown = hovered ?? value

  return (
    <fieldset
      className={cx(styles.root, styles[size], styles.interactive, className)}
      disabled={isDisabled}
      onMouseLeave={() => setHovered(undefined)}
    >
      <legend className={styles.legend}>{label}</legend>
      {stars.map((star) => (
        <label
          key={star}
          className={styles.option}
          onMouseEnter={() => setHovered(star)}
        >
          <input
            className={styles.input}
            type="radio"
            name={name ?? id}
            value={star}
            checked={value === star}
            aria-label={t('rating.star', { count: star })}
            onChange={() => setValue(star)}
          />
          <Icon
            className={cx(styles.star, star <= shown && styles.filled)}
            name="star"
          />
        </label>
      ))}
    </fieldset>
  )
}

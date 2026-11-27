import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Icon } from '@/components/icon/icon'
import { useControllableState } from '@/hooks/use-controllable-state'
import { cx } from '@/lib/cx'

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
        className={cx('rating-root', `rating-${size}`, className)}
        role="img"
        aria-label={`${label}: ${t('rating.value', { value, max })}`}
      >
        {stars.map((star) => (
          <Icon
            key={star}
            className={cx(
              'rating-star',
              star <= Math.round(value) && 'rating-filled',
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
      className={cx(
        'rating-root',
        `rating-${size}`,
        'rating-interactive',
        className,
      )}
      disabled={isDisabled}
      onMouseLeave={() => setHovered(undefined)}
    >
      <legend className="rating-legend">{label}</legend>
      {stars.map((star) => (
        <label
          key={star}
          className="rating-option"
          onMouseEnter={() => setHovered(star)}
        >
          <input
            className="rating-input"
            type="radio"
            name={name ?? id}
            value={star}
            checked={value === star}
            aria-label={t('rating.star', { count: star })}
            onChange={() => setValue(star)}
          />
          <Icon
            className={cx('rating-star', star <= shown && 'rating-filled')}
            name="star"
          />
        </label>
      ))}
    </fieldset>
  )
}

import type { ReactNode } from 'react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import { Icon } from '@/components/icon/icon'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { cx } from '@/lib/cx'

export type FieldsetProps = {
  legend: string
  hint?: string
  error?: string
  isRequired?: boolean
  isLegendHidden?: boolean
  isDisabled?: boolean
  children: ReactNode
  className?: string
}

export function Fieldset({
  legend,
  hint,
  error,
  isRequired = false,
  isLegendHidden = false,
  isDisabled = false,
  children,
  className,
}: FieldsetProps) {
  const { t } = useTranslation()
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy =
    [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined

  return (
    <fieldset
      className={cx('fieldset-root', className)}
      disabled={isDisabled}
      aria-describedby={describedBy}
      aria-invalid={error ? true : undefined}
    >
      <legend
        className={cx('fieldset-legend', isLegendHidden && 'fieldset-hidden')}
      >
        {legend}
        {isRequired && (
          <>
            <span className="fieldset-required" aria-hidden="true">
              {' *'}
            </span>
            <VisuallyHidden> ({t('field.required')})</VisuallyHidden>
          </>
        )}
      </legend>
      {hint && (
        <p id={hintId} className="fieldset-hint">
          {hint}
        </p>
      )}
      <div className="fieldset-content">{children}</div>
      {error && (
        <p id={errorId} className="fieldset-error">
          <Icon name="alert-circle" size="sm" />
          {error}
        </p>
      )}
    </fieldset>
  )
}

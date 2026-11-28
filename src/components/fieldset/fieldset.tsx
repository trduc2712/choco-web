import type { ReactNode } from 'react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'

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
      className={className}
      disabled={isDisabled}
      aria-describedby={describedBy}
      aria-invalid={error ? true : undefined}
    >
      <legend className={cx(isLegendHidden && 'fieldset-hidden')}>
        {legend}
        {isRequired && (
          <>
            <span aria-hidden="true">{' *'}</span>
            <span className="visually-hidden"> ({t('field.required')})</span>
          </>
        )}
      </legend>
      {hint && <p id={hintId}>{hint}</p>}
      <div>{children}</div>
      {error && (
        <p id={errorId}>
          <span aria-hidden="true">!</span>
          {error}
        </p>
      )}
    </fieldset>
  )
}

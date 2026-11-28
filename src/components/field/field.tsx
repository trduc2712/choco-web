import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { getErrorId, getHintId } from './field-ids'

export type FieldProps = {
  id: string
  label: string
  hint?: string
  error?: string
  isRequired?: boolean
  isLabelHidden?: boolean
  className?: string
  children: ReactNode
}

export function Field({
  id,
  label,
  hint,
  error,
  isRequired = false,
  isLabelHidden = false,
  className,
  children,
}: FieldProps) {
  const { t } = useTranslation()
  const labelContent = (
    <>
      {label}
      {isRequired && (
        <>
          <span aria-hidden="true">{' *'}</span>
          <span className="visually-hidden"> ({t('field.required')})</span>
        </>
      )}
    </>
  )

  return (
    <div className={className}>
      {isLabelHidden ? (
        <span className="visually-hidden">
          <label htmlFor={id}>{labelContent}</label>
        </span>
      ) : (
        <label className="field-label" htmlFor={id}>
          {labelContent}
        </label>
      )}
      {children}
      {hint && <p id={getHintId(id)}>{hint}</p>}
      {error && (
        <p id={getErrorId(id)}>
          <span aria-hidden="true">!</span>
          {error}
        </p>
      )}
    </div>
  )
}

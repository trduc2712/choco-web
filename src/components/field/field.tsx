import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Icon } from '@/components/icon/icon'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { cx } from '@/lib/cx'

import styles from './field.module.scss'
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
          <span className={styles.required} aria-hidden="true">
            {' *'}
          </span>
          <VisuallyHidden> ({t('field.required')})</VisuallyHidden>
        </>
      )}
    </>
  )

  return (
    <div className={cx(styles.root, className)}>
      {isLabelHidden ? (
        <VisuallyHidden>
          <label htmlFor={id}>{labelContent}</label>
        </VisuallyHidden>
      ) : (
        <label className={styles.label} htmlFor={id}>
          {labelContent}
        </label>
      )}
      {children}
      {hint && (
        <p id={getHintId(id)} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={getErrorId(id)} className={styles.error}>
          <Icon name="alert-circle" size="sm" />
          {error}
        </p>
      )}
    </div>
  )
}

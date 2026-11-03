import { useTranslation } from 'react-i18next'

import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { cx } from '@/lib/cx'

import styles from './spinner.module.scss'

export type SpinnerSize = 'sm' | 'md' | 'lg'

export type SpinnerTone = 'current' | 'primary' | 'muted'

export type SpinnerProps = {
  size?: SpinnerSize
  tone?: SpinnerTone
  label?: string
  isDecorative?: boolean
  className?: string
}

export function Spinner({
  size = 'md',
  tone = 'current',
  label,
  isDecorative = false,
  className,
}: SpinnerProps) {
  const { t } = useTranslation()
  const classNames = cx(
    styles.root,
    tone !== 'current' && styles[tone],
    className,
  )
  const circle = (
    <span className={cx(styles.circle, styles[size])} aria-hidden="true" />
  )

  if (isDecorative) {
    return <span className={classNames}>{circle}</span>
  }

  return (
    <span className={classNames} role="status">
      {circle}
      <VisuallyHidden>{label ?? t('common.loading')}</VisuallyHidden>
    </span>
  )
}

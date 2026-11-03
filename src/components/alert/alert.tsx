import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { Icon } from '@/components/icon/icon'
import type { IconName } from '@/components/icon/icon-paths'
import { cx } from '@/lib/cx'

import styles from './alert.module.scss'

export type AlertTone = 'info' | 'success' | 'warning' | 'danger'
export type AlertVariant = 'subtle' | 'outline'

export type AlertProps = {
  tone?: AlertTone
  variant?: AlertVariant
  title?: string
  children?: ReactNode
  role?: 'alert' | 'status'
  onDismiss?: () => void
  className?: string
}

const TONE_ICONS: Record<AlertTone, IconName> = {
  info: 'info',
  success: 'check-circle',
  warning: 'alert-circle',
  danger: 'alert-circle',
}

export function Alert({
  tone = 'info',
  variant = 'subtle',
  title,
  children,
  role,
  onDismiss,
  className,
}: AlertProps) {
  const { t } = useTranslation()

  return (
    <div
      className={cx(styles.root, styles[tone], styles[variant], className)}
      role={role}
    >
      <Icon className={styles.icon} name={TONE_ICONS[tone]} />
      <div className={styles.content}>
        {title && <p className={styles.title}>{title}</p>}
        {children && <div>{children}</div>}
      </div>
      {onDismiss && (
        <Button
          className={styles.dismiss}
          icon="close"
          variant="ghost"
          size="sm"
          aria-label={t('common.dismiss')}
          onClick={onDismiss}
        />
      )}
    </div>
  )
}

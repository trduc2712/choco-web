import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { Icon } from '@/components/icon/icon'
import type { IconName } from '@/components/icon/icon-paths'
import { cx } from '@/lib/cx'

import styles from './banner.module.scss'

export type BannerTone = 'info' | 'success' | 'warning' | 'danger' | 'primary'

export type BannerProps = {
  children: ReactNode
  tone?: BannerTone
  title?: string
  icon?: IconName
  action?: ReactNode
  role?: 'alert' | 'status' | 'region'
  label?: string
  onDismiss?: () => void
  className?: string
}

const TONE_ICONS: Record<BannerTone, IconName> = {
  info: 'info',
  success: 'check-circle',
  warning: 'alert-triangle',
  danger: 'alert-octagon',
  primary: 'megaphone',
}

export function Banner({
  children,
  tone = 'info',
  title,
  icon,
  action,
  role = 'region',
  label,
  onDismiss,
  className,
}: BannerProps) {
  const { t } = useTranslation()

  return (
    <div
      className={cx(styles.root, styles[tone], className)}
      role={role}
      aria-label={role === 'region' ? (label ?? title) : undefined}
    >
      <div className={styles.inner}>
        <Icon className={styles.icon} name={icon ?? TONE_ICONS[tone]} />
        <p className={styles.message}>
          {title && <strong className={styles.title}>{title}</strong>}
          {children}
        </p>
        {action && <div className={styles.action}>{action}</div>}
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

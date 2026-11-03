import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Icon } from '@/components/icon/icon'
import type { IconName } from '@/components/icon/icon-paths'
import { cx } from '@/lib/cx'

import styles from './badge.module.scss'

export type BadgeTone =
  'neutral' | 'primary' | 'info' | 'success' | 'warning' | 'danger'
export type BadgeVariant = 'subtle' | 'solid' | 'outline'
export type BadgeSize = 'sm' | 'md'

type BadgeBaseProps = {
  tone?: BadgeTone
  variant?: BadgeVariant
  size?: BadgeSize
  icon?: IconName
  className?: string
}

type LabelBadgeProps = BadgeBaseProps & {
  children: ReactNode
  count?: never
  max?: never
}

type CountBadgeProps = BadgeBaseProps & {
  count: number
  max?: number
  children?: never
}

export type BadgeProps = LabelBadgeProps | CountBadgeProps

const DEFAULT_MAX = 99

export function Badge({
  tone = 'neutral',
  variant = 'subtle',
  size = 'sm',
  icon,
  className,
  children,
  count,
  max = DEFAULT_MAX,
}: BadgeProps) {
  const { t } = useTranslation()
  const content =
    count === undefined
      ? children
      : count > max
        ? t('badge.overflow', { max })
        : count

  return (
    <span
      className={cx(
        styles.root,
        styles[size],
        styles[variant],
        styles[`tone-${tone}`],
        className,
      )}
    >
      {icon && <Icon name={icon} size="sm" />}
      {content}
    </span>
  )
}

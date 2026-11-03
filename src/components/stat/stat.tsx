import { Icon } from '@/components/icon/icon'
import type { IconName } from '@/components/icon/icon-paths'
import { cx } from '@/lib/cx'

import styles from './stat.module.scss'

export type StatTrend = 'up' | 'down' | 'neutral'

export type StatProps = {
  label: string
  value: string
  change?: string
  changeLabel?: string
  trend?: StatTrend
  isTrendPositive?: boolean
  icon?: IconName
  className?: string
}

const TREND_ICONS: Record<StatTrend, IconName> = {
  up: 'trending-up',
  down: 'trending-down',
  neutral: 'arrow-right',
}

export function Stat({
  label,
  value,
  change,
  changeLabel,
  trend = 'neutral',
  isTrendPositive = trend === 'up',
  icon,
  className,
}: StatProps) {
  const tone =
    trend === 'neutral' ? 'neutral' : isTrendPositive ? 'positive' : 'negative'

  return (
    <dl className={cx(styles.root, className)}>
      <dt className={styles.label}>
        {icon && <Icon name={icon} size="sm" />}
        {label}
      </dt>
      <dd className={styles.value}>{value}</dd>
      {change && (
        <dd className={cx(styles.change, styles[tone])}>
          <Icon name={TREND_ICONS[trend]} size="sm" />
          <span>{change}</span>
          {changeLabel && (
            <span className={styles.changeLabel}>{changeLabel}</span>
          )}
        </dd>
      )}
    </dl>
  )
}

import type { ReactNode } from 'react'

import { Icon } from '@/components/icon/icon'
import type { IconName } from '@/components/icon/icon-paths'
import { cx } from '@/lib/cx'

import styles from './timeline.module.scss'

export type TimelineTone =
  'neutral' | 'primary' | 'success' | 'warning' | 'danger'

export type TimelineItem = {
  id: string
  title: string
  time: string
  dateTime?: string
  description?: ReactNode
  icon?: IconName
  tone?: TimelineTone
}

export type TimelineProps = {
  label: string
  items: TimelineItem[]
  className?: string
}

export function Timeline({ label, items, className }: TimelineProps) {
  return (
    <ol className={cx(styles.root, className)} aria-label={label}>
      {items.map((item) => (
        <li
          key={item.id}
          className={cx(styles.item, styles[item.tone ?? 'neutral'])}
        >
          <span
            className={cx(styles.marker, item.icon && styles.withIcon)}
            aria-hidden="true"
          >
            {item.icon && <Icon name={item.icon} size="sm" />}
          </span>
          <div className={styles.content}>
            <div className={styles.header}>
              <span className={styles.title}>{item.title}</span>
              <time className={styles.time} dateTime={item.dateTime}>
                {item.time}
              </time>
            </div>
            {item.description && (
              <div className={styles.description}>{item.description}</div>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}

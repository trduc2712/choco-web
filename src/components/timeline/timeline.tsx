import type { ReactNode } from 'react'

import { Icon } from '@/components/icon/icon'
import type { IconName } from '@/components/icon/icon-paths'
import { cx } from '@/lib/cx'

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
    <ol className={cx('timeline-root', className)} aria-label={label}>
      {items.map((item) => (
        <li
          key={item.id}
          className={cx('timeline-item', `timeline-${item.tone ?? 'neutral'}`)}
        >
          <span
            className={cx('timeline-marker', item.icon && 'timeline-withIcon')}
            aria-hidden="true"
          >
            {item.icon && <Icon name={item.icon} size="sm" />}
          </span>
          <div className="timeline-content">
            <div className="timeline-header">
              <span className="timeline-title">{item.title}</span>
              <time className="timeline-time" dateTime={item.dateTime}>
                {item.time}
              </time>
            </div>
            {item.description && (
              <div className="timeline-description">{item.description}</div>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}

import { useTranslation } from 'react-i18next'

import { Heading } from '@/components/heading/heading'
import type { TimelineTone } from '@/components/timeline/timeline'
import { Timeline } from '@/components/timeline/timeline'

import type { ActionTone } from '../audit-log-format'
import {
  actionMeta,
  describeEntry,
  formatTime,
  isResourceTarget,
  shortId,
  targetLabel,
} from '../audit-log-format'
import styles from './timeline-view.module.scss'
import type { ViewProps } from './view-props'

const TONES: Record<ActionTone, TimelineTone> = {
  danger: 'danger',
  success: 'success',
  warning: 'warning',
  purple: 'primary',
}

export function TimelineView({ groups }: ViewProps) {
  const { t } = useTranslation()

  return (
    <div className={styles.root}>
      {groups.map((group) => (
        <section key={group.key} className={styles.group}>
          <Heading level={2} size="md" className={styles.heading}>
            {group.label}
            <span className={styles.count}>
              {t('admin.auditLog.entryCount', { count: group.entries.length })}
            </span>
          </Heading>
          <Timeline
            label={group.label}
            items={group.entries.map((entry) => {
              const roles = entry.actorRoles.join(', ')
              const target = isResourceTarget(entry)
                ? `${targetLabel(entry.targetType, t)} ${shortId(entry.targetId)}`
                : targetLabel(entry.targetType, t)
              return {
                id: entry.id,
                title: describeEntry(entry, t),
                time: formatTime(entry.occurredAt),
                dateTime: entry.occurredAt,
                description: roles ? `${target} · ${roles}` : target,
                icon: actionMeta(entry.action).icon,
                tone: TONES[actionMeta(entry.action).tone],
              }
            })}
          />
        </section>
      ))}
    </div>
  )
}

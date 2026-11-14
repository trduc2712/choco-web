import type { KeyboardEvent } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cx } from '@/lib/cx'

import type { AuditEntry } from '../audit-log-api'
import {
  actionMeta,
  formatTime,
  isResourceTarget,
  shortId,
  userName,
} from '../audit-log-format'
import styles from './log-view.module.scss'
import type { ViewProps } from './view-props'

export function LogView({ groups }: ViewProps) {
  const { t } = useTranslation()
  const [openIds, setOpenIds] = useState<string[]>([])

  function toggle(id: string) {
    setOpenIds((current) =>
      current.includes(id)
        ? current.filter((openId) => openId !== id)
        : [...current, id],
    )
  }

  function handleKeyDown(event: KeyboardEvent, entry: AuditEntry) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggle(entry.id)
    }
  }

  return (
    <div className={styles.root}>
      {groups.map((group) => (
        <section key={group.key}>
          <h2 className={styles.day}>
            {t('admin.auditLog.dayCount', {
              day: group.label,
              count: group.entries.length,
            })}
          </h2>
          <ul className={styles.lines}>
            {group.entries.map((entry) => {
              const isOpen = openIds.includes(entry.id)
              const fields: [string, string][] = [
                ['roles', entry.actorRoles.join(', ') || '–'],
                [
                  'affected',
                  entry.affectedUser ? userName(entry.affectedUser, t) : '–',
                ],
                ['client', entry.clientId ?? '–'],
                ['trace', entry.traceId ?? '–'],
              ]
              return (
                <li key={entry.id}>
                  <div
                    className={cx(styles.line, isOpen && styles.open)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isOpen}
                    onClick={() => toggle(entry.id)}
                    onKeyDown={(event) => handleKeyDown(event, entry)}
                  >
                    <time dateTime={entry.occurredAt} className={styles.time}>
                      {formatTime(entry.occurredAt, true)}
                    </time>
                    <span>{userName(entry.actor, t)}</span>
                    <span
                      className={cx(
                        styles.action,
                        styles[actionMeta(entry.action).tone],
                      )}
                    >
                      {entry.action}
                    </span>
                    <span
                      className={styles.target}
                      title={
                        isResourceTarget(entry) ? entry.targetId : undefined
                      }
                    >
                      {isResourceTarget(entry) ? shortId(entry.targetId) : '–'}
                    </span>
                  </div>
                  {isOpen ? (
                    <dl className={styles.fields}>
                      {fields.map(([key, value]) => (
                        <div key={key}>
                          <dt>{key}:</dt> <dd>{value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

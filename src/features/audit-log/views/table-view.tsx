import type { KeyboardEvent } from 'react'
import { Fragment, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Icon } from '@/components/icon/icon'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { cx } from '@/lib/cx'

import type { AuditEntry } from '../audit-log-api'
import { formatFull, formatTime } from '../audit-log-format'
import { ActionBadge, Actor, EntryDetail, Target } from '../audit-parts'
import styles from './table-view.module.scss'
import type { ViewProps } from './view-props'

const COLUMNS = 5

export function TableView({ groups, onFilter }: ViewProps) {
  const { t, i18n } = useTranslation()
  const [openIds, setOpenIds] = useState<string[]>([])

  function toggle(id: string) {
    setOpenIds((current) =>
      current.includes(id)
        ? current.filter((openId) => openId !== id)
        : [...current, id],
    )
  }

  function handleKeyDown(event: KeyboardEvent, entry: AuditEntry) {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggle(entry.id)
    }
  }

  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <caption>
          <VisuallyHidden>{t('admin.auditLog.tableCaption')}</VisuallyHidden>
        </caption>
        <thead>
          <tr>
            <th scope="col">{t('admin.auditLog.columns.time')}</th>
            <th scope="col">{t('admin.auditLog.columns.actor')}</th>
            <th scope="col">{t('admin.auditLog.columns.action')}</th>
            <th scope="col" className={styles.target}>
              {t('admin.auditLog.columns.target')}
            </th>
            <th scope="col">
              <VisuallyHidden>
                {t('admin.auditLog.columns.details')}
              </VisuallyHidden>
            </th>
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.key}>
            <tr>
              <th scope="colgroup" colSpan={COLUMNS} className={styles.day}>
                {t('admin.auditLog.dayCount', {
                  day: group.label,
                  count: group.entries.length,
                })}
              </th>
            </tr>
            {group.entries.map((entry) => {
              const isOpen = openIds.includes(entry.id)
              return (
                <Fragment key={entry.id}>
                  <tr
                    className={cx(styles.row, isOpen && styles.open)}
                    tabIndex={0}
                    aria-expanded={isOpen}
                    onClick={() => toggle(entry.id)}
                    onKeyDown={(event) => handleKeyDown(event, entry)}
                  >
                    <td>
                      <time
                        className={styles.time}
                        dateTime={entry.occurredAt}
                        title={formatFull(entry.occurredAt, i18n.language)}
                      >
                        {formatTime(entry.occurredAt)}
                      </time>
                    </td>
                    <td>
                      <Actor entry={entry} />
                    </td>
                    <td>
                      <ActionBadge action={entry.action} />
                    </td>
                    <td className={styles.target}>
                      <Target entry={entry} />
                    </td>
                    <td className={styles.chevron}>
                      <Icon
                        name={isOpen ? 'chevron-up' : 'chevron-down'}
                        size="sm"
                      />
                    </td>
                  </tr>
                  {isOpen ? (
                    <tr>
                      <td colSpan={COLUMNS} className={styles.expanded}>
                        <EntryDetail entry={entry} onFilter={onFilter} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              )
            })}
          </tbody>
        ))}
      </table>
    </div>
  )
}

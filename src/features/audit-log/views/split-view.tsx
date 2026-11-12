import { useTranslation } from 'react-i18next'

import { Dialog } from '@/components/dialog/dialog'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cx } from '@/lib/cx'

import { describeEntry, formatTime } from '../audit-log-format'
import { ActionBadge, EntryDetail, Target } from '../audit-parts'
import styles from './split-view.module.scss'
import type { ViewProps } from './view-props'

export function SplitView({
  groups,
  entries,
  selectedId,
  onSelect,
  onFilter,
}: ViewProps) {
  const { t } = useTranslation()
  const isNarrow = useMediaQuery('(width < 768px)')
  const selected = entries.find((entry) => entry.id === selectedId)
  // Beside the list the first entry is open until another is chosen; on a
  // narrow screen nothing opens until it is tapped.
  const open = isNarrow ? selected : (selected ?? entries.at(0))

  const list = (
    <div className={styles.list}>
      {groups.map((group) => (
        <section key={group.key}>
          <h2 className={styles.day}>{group.label}</h2>
          <ul className={styles.items}>
            {group.entries.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  className={cx(
                    styles.item,
                    entry.id === open?.id && styles.selected,
                  )}
                  aria-pressed={entry.id === open?.id}
                  aria-label={describeEntry(entry, t)}
                  onClick={() => onSelect(entry.id)}
                >
                  <span className={styles.top}>
                    <ActionBadge action={entry.action} />
                    <time dateTime={entry.occurredAt} className={styles.time}>
                      {formatTime(entry.occurredAt)}
                    </time>
                  </span>
                  <span className={styles.meta}>
                    {entry.actor
                      ? (entry.actor.username ??
                        t('admin.auditLog.deletedUser'))
                      : t('admin.auditLog.system')}
                    {' · '}
                    <Target entry={entry} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )

  if (isNarrow) {
    return (
      <>
        {list}
        <Dialog
          isOpen={selected !== undefined}
          onClose={() => onSelect(null)}
          title={selected ? describeEntry(selected, t) : ''}
          size="lg"
        >
          {selected ? (
            <EntryDetail entry={selected} onFilter={onFilter} hasExtraFilters />
          ) : null}
        </Dialog>
      </>
    )
  }

  return (
    <div className={styles.root}>
      {list}
      <aside className={styles.panel} aria-label={t('admin.auditLog.detail')}>
        {open ? (
          <EntryDetail entry={open} onFilter={onFilter} hasExtraFilters />
        ) : null}
      </aside>
    </div>
  )
}

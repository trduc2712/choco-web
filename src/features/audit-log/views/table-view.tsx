import { useTranslation } from 'react-i18next'

import type { TableColumn, TableRowGroup } from '@/components/table/table'
import { Table } from '@/components/table/table'

import type { AuditEntry } from '../audit-log-api'
import { describeEntry, formatFull, formatTime } from '../audit-log-format'
import {
  ActionBadge,
  Actor,
  ChangeCount,
  EntryDetail,
  Target,
} from '../audit-parts'
import styles from './table-view.module.scss'
import type { ViewProps } from './view-props'

// The entries as Ares' Table: one group per day, and a row opens into what
// the entry changed.
export function TableView({ groups, entries, onFilter }: ViewProps) {
  const { t, i18n } = useTranslation()

  // Each entry's day, as the group heading: "Today · 20".
  const dayOf = new Map<string, TableRowGroup>()
  for (const group of groups) {
    const heading = {
      id: group.key,
      label: t('admin.auditLog.dayCount', {
        day: group.label,
        count: group.entries.length,
      }),
    }
    for (const entry of group.entries) dayOf.set(entry.id, heading)
  }

  const columns: TableColumn<AuditEntry>[] = [
    {
      id: 'time',
      header: t('admin.auditLog.columns.time'),
      cell: (entry) => (
        <time
          className={styles.time}
          dateTime={entry.occurredAt}
          title={formatFull(entry.occurredAt, i18n.language)}
        >
          {formatTime(entry.occurredAt)}
        </time>
      ),
    },
    {
      id: 'actor',
      header: t('admin.auditLog.columns.actor'),
      cell: (entry) => <Actor entry={entry} />,
    },
    {
      id: 'action',
      header: t('admin.auditLog.columns.action'),
      cell: (entry) => (
        <>
          <ActionBadge action={entry.action} />
          <ChangeCount entry={entry} />
        </>
      ),
    },
    {
      id: 'target',
      header: t('admin.auditLog.columns.target'),
      cell: (entry) => <Target entry={entry} />,
    },
  ]

  return (
    <Table
      caption={t('admin.auditLog.tableCaption')}
      isCaptionHidden
      columns={columns}
      rows={entries}
      getRowId={(entry) => entry.id}
      getRowLabel={(entry) => describeEntry(entry, t)}
      getRowGroup={(entry) =>
        dayOf.get(entry.id) ?? { id: entry.occurredAt, label: '' }
      }
      renderExpanded={(entry) => (
        <EntryDetail entry={entry} onFilter={onFilter} />
      )}
    />
  )
}

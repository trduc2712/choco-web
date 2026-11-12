import { useTranslation } from 'react-i18next'

import { Avatar } from '@/components/avatar/avatar'
import { Button } from '@/components/button/button'
import { CopyButton } from '@/components/copy-button/copy-button'
import { DescriptionList } from '@/components/description-list/description-list'
import { Icon } from '@/components/icon/icon'
import { cx } from '@/lib/cx'

import type { AuditAction, AuditEntry, AuditUser } from './audit-log-api'
import {
  ACTION_META,
  formatDetail,
  formatFull,
  shortId,
} from './audit-log-format'
import styles from './audit-parts.module.scss'

export type EntryFilter = 'target' | 'actor' | 'action'

export function ActionBadge({
  action,
  className,
}: {
  action: AuditAction
  className?: string
}) {
  const { t } = useTranslation()
  const { icon, tone } = ACTION_META[action]

  return (
    <span className={cx(styles.badge, styles[tone], className)}>
      <Icon name={icon} size="sm" />
      {t(`admin.auditLog.actions.${action}`)}
    </span>
  )
}

// Who did it: an avatar with the username, or a gear for the system. A
// username of null is an account that was deleted.
export function Actor({ entry }: { entry: AuditEntry }) {
  const { t } = useTranslation()

  if (!entry.actor) {
    return (
      <span className={styles.actor}>
        <Icon name="gear" size="sm" />
        {t('admin.auditLog.system')}
      </span>
    )
  }
  if (entry.actor.username === null) {
    return (
      <span className={styles.actor}>
        <Avatar name="?" size="xs" />
        <em>{t('admin.auditLog.deletedUser')}</em>
      </span>
    )
  }
  return (
    <span className={styles.actor}>
      <Avatar name={entry.actor.username} size="xs" />
      {entry.actor.username}
    </span>
  )
}

export function Target({
  entry,
  className,
}: {
  entry: AuditEntry
  className?: string
}) {
  const { t } = useTranslation()

  return (
    <span className={className} title={entry.targetId}>
      {t(`admin.auditLog.targets.${entry.targetType}`)}{' '}
      <code className={styles.id}>{shortId(entry.targetId)}</code>
    </span>
  )
}

function UserValue({ user }: { user: AuditUser | null }) {
  const { t } = useTranslation()
  if (!user) return <>–</>
  if (user.username === null) {
    return (
      <span title={user.id}>
        <em>{t('admin.auditLog.deletedUser')}</em>{' '}
        <code className={styles.id}>{shortId(user.id)}</code>
      </span>
    )
  }
  return <span title={user.id}>{user.username}</span>
}

type EntryDetailProps = {
  entry: AuditEntry
  onFilter: (kind: EntryFilter, entry: AuditEntry) => void
  // Adds "Filter by actor" and "Filter by action", for the side panel.
  hasExtraFilters?: boolean
}

// Every field of an entry, shown when a row is opened.
export function EntryDetail({
  entry,
  onFilter,
  hasExtraFilters = false,
}: EntryDetailProps) {
  const { t, i18n } = useTranslation()
  const roles = entry.actorRoles.join(', ')

  const items = [
    {
      id: 'actor',
      term: t('admin.auditLog.fields.actor'),
      description: (
        <>
          <Actor entry={entry} />
          {roles ? <span className={styles.muted}> · {roles}</span> : null}
        </>
      ),
    },
    {
      id: 'target',
      term: t('admin.auditLog.fields.target'),
      description: (
        <span className={styles.value}>
          <Target entry={entry} />
          <code className={styles.id}>{entry.targetId}</code>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFilter('target', entry)}
          >
            {t('admin.auditLog.filterLink')}
          </Button>
        </span>
      ),
    },
    {
      id: 'affected',
      term: t('admin.auditLog.fields.affected'),
      description: <UserValue user={entry.affectedUser} />,
    },
    ...(entry.detail
      ? [
          {
            id: 'detail',
            term: t('admin.auditLog.fields.detail'),
            description: formatDetail(entry, t),
          },
        ]
      : []),
    {
      id: 'client',
      term: t('admin.auditLog.fields.client'),
      description: entry.clientId ?? '–',
    },
    {
      id: 'time',
      term: t('admin.auditLog.fields.time'),
      description: formatFull(entry.occurredAt, i18n.language),
    },
    {
      id: 'trace',
      term: t('admin.auditLog.fields.trace'),
      description: entry.traceId ? (
        <span className={styles.value}>
          <code className={styles.id}>{entry.traceId}</code>
          <CopyButton
            value={entry.traceId}
            label={t('admin.auditLog.copyTrace')}
            size="sm"
            variant="ghost"
          />
        </span>
      ) : (
        '–'
      ),
    },
  ]

  return (
    <div className={styles.detail}>
      <DescriptionList items={items} />
      {hasExtraFilters ? (
        <div className={styles.links}>
          {entry.actor ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFilter('actor', entry)}
            >
              {t('admin.auditLog.filterByActor')}
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFilter('action', entry)}
          >
            {t('admin.auditLog.filterByAction')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

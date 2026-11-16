import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

import { Avatar } from '@/components/avatar/avatar'
import { Badge } from '@/components/badge/badge'
import { Button } from '@/components/button/button'
import { CopyButton } from '@/components/copy-button/copy-button'
import { DescriptionList } from '@/components/description-list/description-list'
import { Icon } from '@/components/icon/icon'
import { Link } from '@/components/link/link'
import { ADMIN_POSTS_PATH } from '@/constants/routes'
import { AdminUsernameLink } from '@/features/users-admin'
import { cx } from '@/lib/cx'

import { ChangeList } from './audit-changes'
import type { AuditEntry, AuditUser } from './audit-log-api'
import type { AuditTimeZone } from './audit-log-dates'
import {
  actionLabel,
  actionMeta,
  changesOf,
  describeEntry,
  formatDetail,
  formatFull,
  isResourceTarget,
  shortId,
  targetLabel,
  userName,
} from './audit-log-format'
import styles from './audit-parts.module.scss'

export type EntryFilter = 'target' | 'actor' | 'action'

// A user named in the log: a link with the preview card other admin lists
// show on hover, or plain words for the system or a deleted account.
export function AuditUserName({
  user,
  asChip = false,
}: {
  user: AuditUser | null
  asChip?: boolean
}) {
  const { t } = useTranslation()
  if (!user?.username) {
    return <span>{userName(user, t)}</span>
  }
  const link = (
    <AdminUsernameLink
      userId={user.id}
      username={user.username}
      className={cx(
        styles.userLink,
        asChip && styles.entityChip,
        asChip && styles.userChip,
      )}
      showUserIcon={asChip}
    />
  )
  return asChip ? <span className={styles.chipSlot}>{link}</span> : link
}

// Markers that stand in for the names while the sentence is translated; never
// in a translation or a name (Unicode private use).
const ACTOR_MARK = '\uE000'
const AFFECTED_MARK = '\uE001'
const ROLE_MARK = '\uE002'
const TARGET_MARK = '\uE003'

// The translated sentence with linked users and the recorded role.
export function EntrySentence({
  entry,
  target,
}: {
  entry: AuditEntry
  target?: ReactElement
}) {
  const { t } = useTranslation()
  const role =
    entry.action === 'RoleAssigned' || entry.action === 'RoleRevoked'
      ? formatDetail(entry, t)
      : null
  const text = describeEntry(entry, t, {
    actor: entry.actor?.username ? ACTOR_MARK : undefined,
    affected: entry.affectedUser?.username ? AFFECTED_MARK : undefined,
    role: role ? ROLE_MARK : undefined,
    target: target ? TARGET_MARK : undefined,
  })

  return (
    <>
      {text.split(/([\uE000\uE001\uE002\uE003])/u).map((part, index) =>
        part === ACTOR_MARK ? (
          <AuditUserName key={index} user={entry.actor} asChip />
        ) : part === AFFECTED_MARK ? (
          <AuditUserName key={index} user={entry.affectedUser} asChip />
        ) : part === ROLE_MARK ? (
          <span key={index} className={styles.entityChip}>
            <Icon name="shield" size="sm" />
            {role}
          </span>
        ) : part === TARGET_MARK ? (
          <span key={index}>{target}</span>
        ) : (
          part
        ),
      )}
    </>
  )
}

export function ActionBadge({
  action,
  className,
}: {
  action: string
  className?: string
}) {
  const { t } = useTranslation()
  const { icon, tone } = actionMeta(action)

  return (
    <span className={cx(styles.badge, styles[tone], className)}>
      <Icon name={icon} size="sm" />
      {actionLabel(action, t)}
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
        <Avatar name="?" fallback="person" size="xs" />
        <em>{t('admin.auditLog.deletedUser')}</em>
      </span>
    )
  }
  return (
    <span className={styles.actor}>
      <Avatar
        name={entry.actor.username}
        src={entry.actor.avatarUrl}
        fallback="person"
        size="xs"
      />
      {entry.actor.username}
    </span>
  )
}

export function ChangeCount({ entry }: { entry: AuditEntry }) {
  const { t } = useTranslation()
  const count = changesOf(entry).length
  if (count === 0) return null
  return <Badge>{t('admin.auditLog.changeCount', { count })}</Badge>
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
    <span
      className={className}
      title={isResourceTarget(entry) ? entry.targetId : undefined}
    >
      {targetLabel(entry.targetType, t)}
      {isResourceTarget(entry) ? (
        <>
          {' '}
          <code className={styles.id}>{shortId(entry.targetId)}</code>
        </>
      ) : null}
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
  canBrowsePosts?: boolean
  zone?: AuditTimeZone
}

// Every field of an entry, shown when a row is opened.
export function EntryDetail({
  entry,
  onFilter,
  hasExtraFilters = false,
  canBrowsePosts = false,
  zone = 'local',
}: EntryDetailProps) {
  const { t, i18n } = useTranslation()

  const changes = changesOf(entry)
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
          {isResourceTarget(entry) ? (
            <>
              <code className={styles.id}>{entry.targetId}</code>
              {entry.targetType === 'Post' && canBrowsePosts ? (
                <Link
                  to={`${ADMIN_POSTS_PATH}?${new URLSearchParams({
                    selected: entry.targetId,
                    state:
                      entry.action === 'PostDeleted' ? 'deleted' : 'visible',
                  })}`}
                >
                  {t('admin.content.browsePosts')}
                </Link>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFilter('target', entry)}
              >
                {t('admin.auditLog.filterLink')}
              </Button>
            </>
          ) : null}
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
    ...(changes.length > 0
      ? [
          {
            id: 'changes',
            term: t('admin.auditLog.fields.changes'),
            description: <ChangeList changes={changes} />,
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
      description: formatFull(entry.occurredAt, i18n.language, zone),
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

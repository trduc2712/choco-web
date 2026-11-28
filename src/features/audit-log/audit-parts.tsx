import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router'

import { Avatar } from '@/components/avatar/avatar'
import { CopyButton } from '@/components/copy-button/copy-button'
import { ADMIN_POSTS_PATH } from '@/constants/routes'
import { AdminUsernameLink } from '@/features/users-admin'
import { cx } from '@/lib/cx'
import { symbols } from '@/lib/symbols'

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
        'audit-parts-userLink',
        asChip && 'audit-parts-entityChip',
        asChip && 'audit-parts-userChip',
      )}
      showUserIcon={asChip}
    />
  )
  return asChip ? <span>{link}</span> : link
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
          <span key={index}>
            <span aria-hidden="true">⛨</span>
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
    <span className={cx('audit-parts-badge', `audit-parts-${tone}`, className)}>
      <span aria-hidden="true">{symbols[icon]}</span>
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
      <span>
        <span aria-hidden="true">⚙</span>
        {t('admin.auditLog.system')}
      </span>
    )
  }
  if (entry.actor.username === null) {
    return (
      <span>
        <Avatar name="?" fallback="person" />
        <em>{t('admin.auditLog.deletedUser')}</em>
      </span>
    )
  }
  return (
    <span>
      <Avatar
        name={entry.actor.username}
        src={entry.actor.avatarUrl}
        fallback="person"
      />
      {entry.actor.username}
    </span>
  )
}

export function ChangeCount({ entry }: { entry: AuditEntry }) {
  const { t } = useTranslation()
  const count = changesOf(entry).length
  if (count === 0) return null
  return <span>{t('admin.auditLog.changeCount', { count })}</span>
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
          <code>{shortId(entry.targetId)}</code>
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
        <code>{shortId(user.id)}</code>
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
          {roles ? <span> · {roles}</span> : null}
        </>
      ),
    },
    {
      id: 'target',
      term: t('admin.auditLog.fields.target'),
      description: (
        <span>
          <Target entry={entry} />
          {isResourceTarget(entry) ? (
            <>
              <code>{entry.targetId}</code>
              {entry.targetType === 'Post' && canBrowsePosts ? (
                <RouterLink
                  to={`${ADMIN_POSTS_PATH}?${new URLSearchParams({
                    selected: entry.targetId,
                    state:
                      entry.action === 'PostDeleted' ? 'deleted' : 'visible',
                  })}`}
                >
                  {t('admin.content.browsePosts')}
                </RouterLink>
              ) : null}
              <button type="button" onClick={() => onFilter('target', entry)}>
                {t('admin.auditLog.filterLink')}
              </button>
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
        <span>
          <code>{entry.traceId}</code>
          <CopyButton
            value={entry.traceId}
            label={t('admin.auditLog.copyTrace')}
          />
        </span>
      ) : (
        '–'
      ),
    },
  ]

  return (
    <div>
      <dl>
        {items.map(({ id, term, description }) => (
          <div key={id}>
            <dt>{term}</dt>
            <dd>{description}</dd>
          </div>
        ))}
      </dl>
      {hasExtraFilters ? (
        <div>
          {entry.actor ? (
            <button type="button" onClick={() => onFilter('actor', entry)}>
              {t('admin.auditLog.filterByActor')}
            </button>
          ) : null}
          <button type="button" onClick={() => onFilter('action', entry)}>
            {t('admin.auditLog.filterByAction')}
          </button>
        </div>
      ) : null}
    </div>
  )
}

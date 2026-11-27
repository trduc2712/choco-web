import type { TFunction } from 'i18next'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Avatar } from '@/components/avatar/avatar'
import type { BadgeTone } from '@/components/badge/badge'
import { Badge } from '@/components/badge/badge'
import { Button } from '@/components/button/button'
import { CopyButton } from '@/components/copy-button/copy-button'
import { HoverCard } from '@/components/hover-card/hover-card'
import { Icon } from '@/components/icon/icon'
import type { IconName } from '@/components/icon/icon-paths'
import { Link } from '@/components/link/link'
import { Skeleton } from '@/components/skeleton/skeleton'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { ADMIN_POSTS_PATH } from '@/constants/routes'
import { CATEGORY_BADGES, STATUS_BADGES } from '@/features/feedback'
import { cx } from '@/lib/cx'
import { formatRelativeTime } from '@/lib/relative-time'

import type {
  AuditChange,
  AuditEntry,
  AuditTargetHistory,
  AuditTargetSummary,
  AuditUser,
} from './audit-log-api'
import { useAuditLogEntry } from './audit-log-api'
import type { AuditTimeZone } from './audit-log-dates'
import {
  feedbackStatus,
  formatDetail,
  formatFull,
  formatTime,
  isResourceTarget,
  parseFeedbackStatus,
  shortId,
  targetLabel,
} from './audit-log-format'
import type { EntryFilter } from './audit-parts'
import { AuditUserName, Target } from './audit-parts'

// The icon of each kind of target, on its chip.
const TARGET_ICONS: Record<string, IconName> = {
  Post: 'file-text',
  Comment: 'comment',
  Feedback: 'message-smile',
  User: 'user',
  Report: 'flag',
  Role: 'shield',
  Request: 'globe',
  AuditLog: 'clipboard-list',
}

const CHIP_PREVIEW = 8

// "2 days", "5 hours", "12 minutes": the largest whole unit of a span.
function formatSpan(ms: number, language: string | undefined) {
  const minutes = Math.max(1, Math.round(ms / 60_000))
  const [unit, value] =
    minutes >= 60 * 24
      ? (['day', Math.round(minutes / (60 * 24))] as const)
      : minutes >= 60
        ? (['hour', Math.round(minutes / 60)] as const)
        : (['minute', minutes] as const)
  return new Intl.NumberFormat(language, {
    style: 'unit',
    unit,
    unitDisplay: 'long',
  }).format(value)
}

// A value of a field as a person reads it: a feedback status in words, a
// suspension as Suspended or Active, anything else as recorded.
function readValue(
  field: string,
  value: string,
  isFeedback: boolean,
  t: TFunction,
) {
  if (isFeedback && field === 'status') {
    const status = parseFeedbackStatus(value)
    if (status) return t(`admin.feedback.statuses.${status}`)
  }
  if (field === 'isSuspended') {
    if (value === 'true') return t('admin.auditLog.changes.suspended')
    if (value === 'false') return t('admin.auditLog.changes.active')
  }
  return value
}

// A value drawn as the badge it has elsewhere in the admin, when it has one.
function ValuePill({
  field,
  value,
  isFeedback,
  isBefore,
}: {
  field: string
  value: string
  isFeedback: boolean
  isBefore: boolean
}) {
  const { t } = useTranslation()
  const status =
    isFeedback && field === 'status' ? parseFeedbackStatus(value) : undefined
  const look = status ? STATUS_BADGES[status] : undefined

  return (
    <span
      className={cx(
        'audit-record-value',
        isBefore ? 'audit-record-before' : 'audit-record-after',
      )}
      data-tone={look?.tone}
    >
      {look ? <Icon name={look.icon} size="sm" /> : null}
      {readValue(field, value, isFeedback, t)}
    </span>
  )
}

function CodeChips({ sign, codes }: { sign: '+' | '-'; codes: string[] }) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  if (codes.length === 0) return null
  const shown = isExpanded ? codes : codes.slice(0, CHIP_PREVIEW)
  const hidden = codes.length - CHIP_PREVIEW

  return (
    <ul>
      {shown.map((code) => (
        <li key={code}>
          <Badge
            tone={sign === '+' ? 'success' : 'danger'}
            icon={sign === '+' ? 'plus' : 'minus'}
          >
            <VisuallyHidden>
              {t(
                sign === '+'
                  ? 'admin.auditLog.changes.added'
                  : 'admin.auditLog.changes.removed',
              )}{' '}
            </VisuallyHidden>
            {code}
          </Badge>
        </li>
      ))}
      {hidden > 0 ? (
        <li>
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((current) => !current)}
          >
            {isExpanded
              ? t('admin.auditLog.changes.showFewer')
              : t('admin.auditLog.changes.more', { count: hidden })}
          </Button>
        </li>
      ) : null}
    </ul>
  )
}

// One changed field, large: the old value struck through, an arrow, the new
// value as it looks elsewhere, and how long the old one had stood.
function Change({
  change,
  isFeedback,
  occurredAt,
}: {
  change: AuditChange
  isFeedback: boolean
  occurredAt: string
}) {
  const { t, i18n } = useTranslation()
  const label = String(
    t(`admin.auditLog.changes.fields.${change.field}` as never, {
      defaultValue: change.field,
    }),
  )

  if (change.added !== undefined || change.removed !== undefined) {
    return (
      <div>
        <span>{label}</span>
        <CodeChips sign="+" codes={change.added ?? []} />
        <CodeChips sign="-" codes={change.removed ?? []} />
      </div>
    )
  }

  if (change.before === undefined && change.after === undefined) {
    return (
      <div>
        <span>
          {t('admin.auditLog.changes.changed', { field: label })} ·{' '}
          {t('admin.auditLog.changes.notRecorded')}
        </span>
      </div>
    )
  }

  const stood =
    change.previousChangedAt && change.before !== undefined
      ? t('admin.auditLog.record.previous', {
          duration: formatSpan(
            new Date(occurredAt).getTime() -
              new Date(change.previousChangedAt).getTime(),
            i18n.language,
          ),
          value: readValue(change.field, change.before, isFeedback, t),
        })
      : undefined

  return (
    <div>
      <span>{label}</span>
      <div>
        {change.before !== undefined ? (
          <>
            <VisuallyHidden>{t('admin.auditLog.beforeValue')}</VisuallyHidden>
            <ValuePill
              field={change.field}
              value={change.before}
              isFeedback={isFeedback}
              isBefore
            />
          </>
        ) : null}
        {change.after !== undefined ? (
          <span>
            {change.before !== undefined ? (
              <Icon name="arrow-right" size="sm" />
            ) : null}
            <VisuallyHidden>{t('admin.auditLog.afterValue')}</VisuallyHidden>
            <ValuePill
              field={change.field}
              value={change.after}
              isFeedback={isFeedback}
              isBefore={false}
            />
          </span>
        ) : null}
        {stood ? <span>{stood}</span> : null}
      </div>
    </div>
  )
}

// Someone in the flow line: avatar, name with its preview card, and a role.
function Person({
  user,
  note,
}: {
  user: AuditUser | null
  note: string | undefined
}) {
  const { t } = useTranslation()
  return (
    <span title={user?.id}>
      {user ? (
        <Avatar
          name={user.username ?? '?'}
          src={user.avatarUrl}
          fallback="person"
          size="xs"
        />
      ) : (
        <span>
          <Icon name="gear" size="sm" />
        </span>
      )}
      <span>
        {user?.username === null ? (
          <em>{t('admin.auditLog.deletedUser')}</em>
        ) : (
          <AuditUserName user={user} />
        )}
        {note ? <span>{note}</span> : null}
      </span>
    </span>
  )
}

// The user a User target is, by name: from its summary, or the actor or
// affected user it is. Undefined until the name is known.
function targetUser(
  entry: AuditEntry,
  summary: AuditTargetSummary | undefined,
): AuditUser | undefined {
  if (entry.targetType !== 'User') return undefined
  if (summary?.username)
    return {
      id: entry.targetId,
      username: summary.username,
      avatarUrl: summary.avatarUrl,
    }
  return [entry.actor, entry.affectedUser].find(
    (user) => user?.id === entry.targetId,
  ) as AuditUser | undefined
}

// The target as a chip: its kind's icon, its name, and its state.
function TargetChip({
  entry,
  summary,
}: {
  entry: AuditEntry
  summary: AuditTargetSummary | undefined
}) {
  const { t } = useTranslation()
  const user = targetUser(entry, summary)
  const name = user ? (
    <AuditUserName user={user} />
  ) : entry.targetType === 'Role' && summary?.name ? (
    summary.name
  ) : isResourceTarget(entry) && entry.targetType !== 'User' ? (
    `${targetLabel(entry.targetType, t)} ${shortId(entry.targetId)}`
  ) : (
    targetLabel(entry.targetType, t)
  )

  return (
    <span>
      <Icon name={TARGET_ICONS[entry.targetType] ?? 'circle'} size="sm" />
      <span>{name}</span>
      {summary?.isDeleted ? (
        <Badge tone="danger" size="sm">
          {t('admin.auditLog.record.deleted')}
        </Badge>
      ) : null}
    </span>
  )
}

// What the target is now: the start of its text, who wrote it, its state.
function TargetPreview({
  entry,
  summary,
  isHover = false,
}: {
  entry: AuditEntry
  summary: AuditTargetSummary
  isHover?: boolean
}) {
  const { t } = useTranslation()
  // A reported user is the entry's affected user, which carries the name.
  const reportedUser =
    summary.reportedType === 'User' &&
    entry.affectedUser?.username &&
    entry.affectedUser.id === summary.reportedId
      ? entry.affectedUser
      : undefined
  const category =
    summary.category && summary.category in CATEGORY_BADGES
      ? (summary.category as keyof typeof CATEGORY_BADGES)
      : undefined
  const status =
    entry.targetType === 'Feedback'
      ? parseFeedbackStatus(summary.status)
      : undefined

  const tags: {
    key: string
    tone: BadgeTone
    icon?: IconName
    label: string
  }[] = []
  if (category) {
    tags.push({
      key: 'category',
      ...CATEGORY_BADGES[category],
      label: t(`feedback.categories.${category}`),
    })
  }
  if (status) {
    tags.push({
      key: 'status',
      ...STATUS_BADGES[status],
      label: t(`admin.feedback.statuses.${status}`),
    })
  }
  if (summary.reason) {
    tags.push({
      key: 'reason',
      tone: 'warning',
      icon: 'flag',
      label: String(
        t(`admin.reports.reasons.${summary.reason}` as never, {
          defaultValue: summary.reason,
        }),
      ),
    })
  }
  if (entry.targetType === 'Report' && summary.status) {
    tags.push({
      key: 'report-status',
      tone: summary.status === 'Resolved' ? 'success' : 'info',
      label: summary.outcome
        ? String(
            t(`admin.auditLog.reportOutcomes.${summary.outcome}` as never, {
              defaultValue: summary.outcome,
            }),
          )
        : summary.status === 'Resolved'
          ? t('admin.auditLog.record.resolved')
          : t('admin.auditLog.record.open'),
    })
  }
  if (summary.isSuspended) {
    tags.push({
      key: 'suspended',
      tone: 'danger',
      icon: 'ban',
      label: t('admin.auditLog.record.suspended'),
    })
  }
  if (summary.permissionCount !== undefined) {
    tags.push({
      key: 'permissions',
      tone: 'neutral',
      icon: 'key',
      label: t('admin.auditLog.record.permissions', {
        count: summary.permissionCount,
      }),
    })
  }
  if (summary.holderCount !== undefined) {
    tags.push({
      key: 'holders',
      tone: 'neutral',
      icon: 'users',
      label: t('admin.auditLog.record.holders', { count: summary.holderCount }),
    })
  }

  const person = summary.author ?? summary.reporter
  const hasUser = entry.targetType === 'User' && summary.username
  if (!summary.excerpt && !person && !hasUser && tags.length === 0) return null

  return (
    <div>
      {hasUser ? (
        <div>
          <Avatar
            name={summary.displayName ?? summary.username ?? '?'}
            src={summary.avatarUrl}
            fallback="person"
            size="md"
          />
          <span>
            {summary.displayName ? (
              <strong>{summary.displayName}</strong>
            ) : null}
            {isHover ? (
              <span>@{summary.username}</span>
            ) : (
              <AuditUserName
                user={{
                  id: entry.targetId,
                  username: summary.username ?? null,
                }}
              />
            )}
          </span>
        </div>
      ) : null}
      {summary.excerpt ? <blockquote>{summary.excerpt}</blockquote> : null}
      <div>
        {person ? (
          <span>
            {t(
              summary.reporter
                ? 'admin.auditLog.record.reporter'
                : 'admin.auditLog.record.author',
            )}{' '}
            {isHover ? (
              <span>
                {person.username
                  ? `@${person.username}`
                  : t('admin.auditLog.deletedUser')}
              </span>
            ) : (
              <AuditUserName user={person} />
            )}
          </span>
        ) : null}
        {tags.map((tag) => (
          <Badge key={tag.key} tone={tag.tone} icon={tag.icon} size="sm">
            {tag.label}
          </Badge>
        ))}
        {entry.targetType === 'Report' && summary.reportedType ? (
          <span>
            {t('admin.auditLog.record.reported')}{' '}
            {reportedUser ? (
              isHover ? (
                <span>@{reportedUser.username}</span>
              ) : (
                <AuditUserName user={reportedUser} />
              )
            ) : summary.reportedType === 'User' ? (
              targetLabel(summary.reportedType, t)
            ) : (
              <code>
                {targetLabel(summary.reportedType, t)}{' '}
                {summary.reportedId ? shortId(summary.reportedId) : null}
              </code>
            )}
          </span>
        ) : null}
      </div>
    </div>
  )
}

function AuditTargetPreviewCard({ entry }: { entry: AuditEntry }) {
  const { t } = useTranslation()
  const { data, isPending } = useAuditLogEntry(entry.id)
  const summary = data?.targetSummary ?? entry.targetSummary
  const userTarget = targetUser(entry, summary)

  return (
    <div>
      <strong>
        {entry.targetType !== 'User'
          ? `${targetLabel(entry.targetType, t)} ${shortId(entry.targetId)}`
          : userTarget?.username
            ? `@${userTarget.username}`
            : targetLabel(entry.targetType, t)}
      </strong>
      {summary?.name ? <span>{summary.name}</span> : null}
      {summary?.isDeleted ? (
        <Badge tone="danger" size="sm">
          {t('admin.auditLog.record.deleted')}
        </Badge>
      ) : null}
      {isPending && !summary ? <Skeleton lines={2} /> : null}
      {summary ? (
        <TargetPreview entry={entry} summary={summary} isHover />
      ) : null}
    </div>
  )
}

export function AuditTargetChip({
  entry,
  className,
  isOpen,
  onToggle,
}: {
  entry: AuditEntry
  className?: string
  isOpen: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  if (!isResourceTarget(entry))
    return <Target entry={entry} className={className} />

  return (
    <span className={cx('audit-parts-chipSlot', className)}>
      <HoverCard
        placement="bottom-start"
        trigger={
          <Button
            className={cx(
              'audit-parts-entityChip',
              'audit-record-previewTrigger',
            )}
            variant="outline"
            size="sm"
            iconStart={TARGET_ICONS[entry.targetType] ?? 'circle'}
            aria-expanded={isOpen}
            onClick={onToggle}
          >
            {targetLabel(entry.targetType, t)}
          </Button>
        }
      >
        <AuditTargetPreviewCard entry={entry} />
      </HoverCard>
    </span>
  )
}

// The label of one step of the target's history: the value it set, in words,
// or what was done.
function stepLabel(
  event: AuditTargetHistory['recent'][number],
  isFeedback: boolean,
  t: TFunction,
) {
  const status = isFeedback ? parseFeedbackStatus(event.value) : undefined
  if (status) return t(`admin.feedback.statuses.${status}`)
  return String(
    t(`admin.auditLog.events.${event.action}` as never, {
      defaultValue: event.action,
    }),
  )
}

// The target's recent history as milestones, this entry marked.
function HistoryStrip({
  history,
  currentId,
  isFeedback,
  zone,
}: {
  history: AuditTargetHistory
  currentId: string
  isFeedback: boolean
  zone: AuditTimeZone
}) {
  const { t, i18n } = useTranslation()
  if (history.recent.length < 2) return null

  return (
    <div>
      <span>{t('admin.auditLog.record.history')}</span>
      <ol>
        {history.recent.map((event) => {
          const status = isFeedback
            ? parseFeedbackStatus(event.value)
            : undefined
          const isCurrent = event.id === currentId
          return (
            <li
              key={event.id}
              data-current={isCurrent || undefined}
              data-tone={status ? STATUS_BADGES[status].tone : undefined}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span />
              <span>{stepLabel(event, isFeedback, t)}</span>
              <time dateTime={event.occurredAt}>
                {isCurrent
                  ? t('admin.auditLog.record.thisEvent')
                  : `${new Intl.DateTimeFormat(i18n.language, {
                      month: 'short',
                      day: 'numeric',
                      timeZone: zone === 'UTC' ? 'UTC' : undefined,
                    }).format(new Date(event.occurredAt))} ${formatTime(
                      event.occurredAt,
                      false,
                      zone,
                    )}`}
              </time>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

type AuditRecordProps = {
  entry: AuditEntry
  onFilter: (kind: EntryFilter, entry: AuditEntry) => void
  canBrowsePosts: boolean
  zone: AuditTimeZone
}

// An entry opened in the timeline. What the list holds shows at once; the
// target's summary and history arrive with the entry's own request.
export function AuditRecord({
  entry: listed,
  onFilter,
  canBrowsePosts,
  zone,
}: AuditRecordProps) {
  const { t, i18n } = useTranslation()
  const detail = useAuditLogEntry(listed.id)
  const entry = detail.data ?? listed
  const summary = entry.targetSummary
  const history = entry.targetHistory
  const isFeedback = entry.targetType === 'Feedback'
  const isResource = isResourceTarget(entry)
  const userTarget = targetUser(entry, summary)
  // A feedback status already reads in the sentence, the badge and the change.
  const note = feedbackStatus(entry) ? null : formatDetail(entry, t)
  const actorRoles = entry.actorRoles.join(', ')
  const affectedRoles = (entry.affectedUserRoles ?? []).join(', ')
  const zoneLabel =
    zone === 'UTC'
      ? 'UTC'
      : t('admin.auditLog.localTime', {
          zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })

  return (
    <div>
      {entry.changes.length > 0 ? (
        <div>
          {entry.changes.map((change, index) => (
            <Change
              key={`${change.field}-${index}`}
              change={change}
              isFeedback={isFeedback}
              occurredAt={entry.occurredAt}
            />
          ))}
        </div>
      ) : null}

      <div>
        <Person
          user={entry.actor}
          note={actorRoles || t('admin.auditLog.record.actorRole')}
        />
        <span>
          <Icon name="arrow-right" size="sm" />
          <TargetChip entry={entry} summary={summary} />
        </span>
        {entry.affectedUser ? (
          <span>
            <Icon name="arrow-right" size="sm" />
            <Person
              user={entry.affectedUser}
              note={affectedRoles || t('admin.auditLog.record.affectedRole')}
            />
          </span>
        ) : null}
      </div>

      {note ? <p>{note}</p> : null}

      {detail.isPending && isResource ? (
        <div aria-busy="true">
          <Skeleton lines={2} />
        </div>
      ) : summary ? (
        <TargetPreview entry={entry} summary={summary} />
      ) : null}

      {history ? (
        <HistoryStrip
          history={history}
          currentId={entry.id}
          isFeedback={isFeedback}
          zone={zone}
        />
      ) : null}

      <div>
        <ul>
          <li title={formatFull(entry.occurredAt, i18n.language, zone)}>
            <Icon name="clock" size="sm" />
            <span>
              {formatRelativeTime(entry.occurredAt, i18n.language)} ·{' '}
              {formatFull(entry.occurredAt, i18n.language, zone)} · {zoneLabel}
            </span>
          </li>
          {entry.clientId ? (
            <li>
              <Icon name="monitor" size="sm" />
              {entry.clientId}
            </li>
          ) : null}
          {isResource ? (
            <li title={entry.targetId}>
              {userTarget ? (
                <>
                  <Icon name="user" size="sm" />
                  <AuditUserName user={userTarget} />
                </>
              ) : (
                <>
                  <Icon name="hash" size="sm" />
                  <code>{shortId(entry.targetId)}…</code>
                </>
              )}
              <CopyButton
                value={entry.targetId}
                label={t('admin.auditLog.record.copyId')}
                size="sm"
                variant="ghost"
              />
            </li>
          ) : null}
          {entry.traceId ? (
            <li title={entry.traceId}>
              <Icon name="activity" size="sm" />
              <code>{entry.traceId.slice(0, 8)}…</code>
              <CopyButton
                value={entry.traceId}
                label={t('admin.auditLog.copyTrace')}
                size="sm"
                variant="ghost"
              />
            </li>
          ) : null}
        </ul>
        <div>
          {entry.targetType === 'Post' && canBrowsePosts ? (
            <Link
              to={`${ADMIN_POSTS_PATH}?${new URLSearchParams({
                selected: entry.targetId,
                state:
                  (summary?.isDeleted ?? entry.action === 'PostDeleted')
                    ? 'deleted'
                    : 'visible',
              })}`}
            >
              {t('admin.content.browsePosts')}
            </Link>
          ) : null}
          {isResource ? (
            <Button
              variant="outline"
              size="sm"
              iconStart="history"
              onClick={() => onFilter('target', entry)}
            >
              {history && history.totalCount > 1
                ? t('admin.auditLog.record.allEvents', {
                    count: history.totalCount,
                  })
                : t('admin.auditLog.targetHistory')}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

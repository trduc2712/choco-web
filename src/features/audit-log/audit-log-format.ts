import type { TFunction } from 'i18next'

import type { IconName } from '@/components/icon/icon-paths'

import type { AuditAction, AuditEntry, AuditUser } from './audit-log-api'
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from './audit-log-api'
import type { AuditTimeZone } from './audit-log-dates'
import { auditDayKey } from './audit-log-dates'

export type ActionTone =
  'danger' | 'success' | 'warning' | 'purple' | 'info' | 'neutral'

type ActionMeta = { icon: IconName; tone: ActionTone }

// Color and icon of every action; the icon is what tells two actions of the
// same color apart.
export const ACTION_META: Record<AuditAction, ActionMeta> = {
  PostCreated: { icon: 'file-plus', tone: 'success' },
  CommentCreated: { icon: 'comment', tone: 'success' },
  ReportResolved: { icon: 'check-circle', tone: 'success' },
  PostEdited: { icon: 'pencil', tone: 'info' },
  ProfileUpdated: { icon: 'user-circle', tone: 'warning' },
  BioUpdated: { icon: 'align-left', tone: 'warning' },
  AvatarUploaded: { icon: 'camera', tone: 'warning' },
  AvatarRemoved: { icon: 'eraser', tone: 'warning' },
  FeedbackStatusChanged: { icon: 'message-smile', tone: 'warning' },
  PostReported: { icon: 'flag', tone: 'warning' },
  UserReported: { icon: 'alert-triangle', tone: 'warning' },
  PostDeleted: { icon: 'trash', tone: 'danger' },
  CommentDeleted: { icon: 'close-circle', tone: 'danger' },
  AccountDeleted: { icon: 'user-x', tone: 'danger' },
  RoleCreated: { icon: 'shield-check', tone: 'success' },
  RoleUpdated: { icon: 'shield', tone: 'warning' },
  RoleDeleted: { icon: 'shield-alert', tone: 'danger' },
  RoleAssigned: { icon: 'user-plus', tone: 'purple' },
  RoleRevoked: { icon: 'user-minus', tone: 'danger' },
  UserBlocked: { icon: 'ban', tone: 'purple' },
  UserUnblocked: { icon: 'unlock', tone: 'purple' },
  UserSuspended: { icon: 'ban', tone: 'danger' },
  UserUnsuspended: { icon: 'unlock', tone: 'success' },
  PostLiked: { icon: 'heart', tone: 'success' },
  PostUnliked: { icon: 'thumbs-down', tone: 'warning' },
  UserFollowed: { icon: 'user-plus', tone: 'success' },
  UserUnfollowed: { icon: 'user-minus', tone: 'warning' },
  FeedbackSent: { icon: 'send', tone: 'success' },
  UserCreated: { icon: 'user-circle', tone: 'success' },
  AccessDenied: { icon: 'lock', tone: 'danger' },
  AuditLogRead: { icon: 'eye', tone: 'neutral' },
}

const UNKNOWN_ACTION_META: ActionMeta = { icon: 'info', tone: 'purple' }

export function isKnownAction(action: string): action is AuditAction {
  return (AUDIT_ACTIONS as readonly string[]).includes(action)
}

export function isKnownTargetType(type: string) {
  return (AUDIT_TARGET_TYPES as readonly string[]).includes(type)
}

// An action added by a newer API gets a neutral look; its raw name still shows.
export function actionMeta(action: string): ActionMeta {
  return isKnownAction(action) ? ACTION_META[action] : UNKNOWN_ACTION_META
}

// A Request or AuditLog target is the caller, not a resource that can be
// opened, so its id is not shown as a target.
export function isResourceTarget(entry: AuditEntry) {
  return entry.targetType !== 'Request' && entry.targetType !== 'AuditLog'
}

// The label of an action or target type; a value this app has no words for
// shows as the API sent it.
export function actionLabel(action: string, t: TFunction) {
  return String(
    t(`admin.auditLog.actions.${action}` as never, { defaultValue: action }),
  )
}

export function targetLabel(type: string, t: TFunction) {
  return String(
    t(`admin.auditLog.targets.${type}` as never, { defaultValue: type }),
  )
}

// The request an AccessDenied entry refused, from its "Request: <name>" detail;
// shown to a person only, never used for logic.
export function attemptedRequest(entry: AuditEntry): string | undefined {
  if (entry.action !== 'AccessDenied') return undefined
  return /^Request: (.+)$/.exec(entry.detail ?? '')?.[1]
}

const REPORT_OUTCOMES = ['Dismissed', 'ContentRemoved', 'UserSuspended']

export function feedbackStatus(entry: AuditEntry) {
  if (entry.action !== 'FeedbackStatusChanged') return undefined
  return parseFeedbackStatus(/^Status: (\w+)$/.exec(entry.detail ?? '')?.[1])
}

// Older entries name the status in PascalCase ("Status: InProgress").
const LEGACY_FEEDBACK_STATUSES: Record<string, string> = {
  New: 'new',
  InProgress: 'in_progress',
  Resolved: 'resolved',
  WontFix: 'wont_fix',
}

export function parseFeedbackStatus(value: string | undefined) {
  const status =
    value && Object.hasOwn(LEGACY_FEEDBACK_STATUSES, value)
      ? LEGACY_FEEDBACK_STATUSES[value]
      : value
  switch (status) {
    case 'new':
    case 'in_progress':
    case 'resolved':
    case 'wont_fix':
      return status
    default:
      return undefined
  }
}

// The outcome of a ReportResolved entry, from its "Outcome: <outcome>" detail;
// undefined for any other entry or an outcome this app has no words for.
export function reportOutcome(entry: AuditEntry): string | undefined {
  if (entry.action !== 'ReportResolved') return undefined
  const outcome = /^Outcome: (\w+)$/.exec(entry.detail ?? '')?.[1]
  return outcome && REPORT_OUTCOMES.includes(outcome) ? outcome : undefined
}

// The detail as a person reads it: "Outcome: ContentRemoved" becomes the
// outcome's words; every other detail shows as the API sent it.
export function formatDetail(entry: AuditEntry, t: TFunction) {
  const status = feedbackStatus(entry)
  if (status) return t(`admin.feedback.statuses.${status}`)
  const request = attemptedRequest(entry)
  if (request) return String(t('admin.auditLog.attempted', { request }))
  const outcome = reportOutcome(entry)
  if (outcome)
    return String(t(`admin.auditLog.reportOutcomes.${outcome}` as never))
  return entry.action === 'RoleAssigned' || entry.action === 'RoleRevoked'
    ? roleName(entry.detail)
    : entry.detail
}

export function changesOf(entry: AuditEntry) {
  return entry.changes ?? []
}

// The first characters of an id, enough to tell rows apart.
export function shortId(id: string) {
  return id.slice(0, 4)
}

export function userName(user: AuditUser | null, t: TFunction) {
  if (!user) return t('admin.auditLog.system')
  return user.username ?? t('admin.auditLog.deletedUser')
}

// The short word on a timeline badge; an action without one shows its label.
export function badgeLabel(action: string, t: TFunction) {
  return String(
    t(`admin.auditLog.badges.${action}` as never, {
      defaultValue: actionLabel(action, t),
    }),
  )
}

// The role named by a RoleAssigned or RoleRevoked entry. Newer entries write
// "Role: <name>", older ones the name alone.
function roleName(detail: string | null) {
  return (detail ?? '').replace(/^Role: /, '')
}

// "daemon assigned role Moderator to trduc", built from the entry. An action
// without a sentence shows its own name.
// `names` puts something else in place of a name, such as a marker the
// timeline swaps for a link.
// The actions whose sentence has a place for the target (sentencesWithTarget).
const TARGET_SENTENCES = new Set<string>([
  'PostCreated',
  'PostEdited',
  'PostDeleted',
  'CommentCreated',
  'CommentDeleted',
  'AccountDeleted',
  'PostReported',
  'UserReported',
  'ReportResolved',
  'FeedbackStatusChanged',
  'RoleCreated',
  'RoleUpdated',
  'RoleDeleted',
  'PostLiked',
  'PostUnliked',
  'FeedbackSent',
])

// A target that is the actor or the affected user is already named in the
// sentence, as that user.
function isNamedUser(entry: AuditEntry) {
  return (
    entry.targetType === 'User' &&
    (entry.targetId === entry.actor?.id ||
      entry.targetId === entry.affectedUser?.id)
  )
}

// Where the target shows: in the sentence, after it when the sentence has no
// place for it, or not at all when it is a user the sentence names or not a
// resource.
export function targetPlacement(
  entry: AuditEntry,
): 'sentence' | 'apart' | 'none' {
  if (!isResourceTarget(entry) || isNamedUser(entry)) return 'none'
  return TARGET_SENTENCES.has(entry.action) ? 'sentence' : 'apart'
}

function namesTarget(entry: AuditEntry) {
  return targetPlacement(entry) === 'sentence'
}

// The sentence of an entry. Pass a name for the target to put it in the
// sentence, where the action's sentence has a place for it.
export function describeEntry(
  entry: AuditEntry,
  t: TFunction,
  names: {
    actor?: string
    affected?: string
    role?: string
    target?: string
  } = {},
) {
  const actor = names.actor ?? userName(entry.actor, t)
  const target = names.target && namesTarget(entry) ? names.target : undefined
  const sentences = target
    ? 'admin.auditLog.sentencesWithTarget'
    : 'admin.auditLog.sentences'
  const outcome = reportOutcome(entry)
  if (outcome) {
    return String(
      t(`${sentences}.ReportResolvedWith` as never, {
        actor,
        target,
        outcome: t(`admin.auditLog.reportOutcomes.${outcome}` as never),
      }),
    )
  }
  return String(
    t(`${sentences}.${entry.action}` as never, {
      defaultValue: entry.action,
      actor,
      target,
      affected:
        names.affected ??
        (entry.affectedUser
          ? userName(entry.affectedUser, t)
          : t('admin.auditLog.someone')),
      detail: feedbackStatus(entry)
        ? formatDetail(entry, t)
        : entry.action === 'RoleAssigned' || entry.action === 'RoleRevoked'
          ? (names.role ?? roleName(entry.detail))
          : (entry.detail ?? ''),
    }),
  )
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

// "14:05" or "14:05:09", in the viewer's time zone.
export function formatTime(
  date: string,
  withSeconds = false,
  zone: AuditTimeZone = 'local',
) {
  const value = new Date(date)
  if (zone === 'UTC')
    return value.toISOString().slice(11, withSeconds ? 19 : 16)
  const time = `${pad(value.getHours())}:${pad(value.getMinutes())}`
  return withSeconds ? `${time}:${pad(value.getSeconds())}` : time
}

export function formatFull(
  date: string,
  language: string | undefined,
  zone: AuditTimeZone = 'local',
) {
  return new Intl.DateTimeFormat(language, {
    timeZone: zone === 'UTC' ? zone : undefined,
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(date))
}

export type DayGroup = {
  key: string
  label: string
  dateLabel: string
  entries: AuditEntry[]
}

// Groups the entries of the page on screen by the viewer's calendar day:
// Today, Yesterday, or the full date. The page keeps its order.
export function groupByDay(
  entries: AuditEntry[],
  language: string | undefined,
  t: TFunction,
  now: Date = new Date(),
  zone: AuditTimeZone = 'local',
): DayGroup[] {
  const yesterday = new Date(now)
  if (zone === 'UTC') yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  else yesterday.setDate(yesterday.getDate() - 1)
  const todayKey = auditDayKey(now, zone)
  const yesterdayKey = auditDayKey(yesterday, zone)
  const dateFormat = new Intl.DateTimeFormat(language, {
    dateStyle: 'medium',
    timeZone: zone === 'UTC' ? zone : undefined,
  })
  const groups: DayGroup[] = []
  for (const entry of entries) {
    const date = new Date(entry.occurredAt)
    const key = auditDayKey(date, zone)
    let group = groups.at(-1)
    if (group?.key !== key) {
      const dateLabel = dateFormat.format(date)
      let label = dateLabel
      if (key === todayKey) {
        label = t('admin.auditLog.today')
      } else if (key === yesterdayKey) {
        label = t('admin.auditLog.yesterday')
      }
      group = { key, label, dateLabel, entries: [] }
      groups.push(group)
    }
    group.entries.push(entry)
  }
  return groups
}

// How many entries of each action a day holds, most first: the day's summary.
export function actionTally(entries: AuditEntry[]) {
  const counts = new Map<string, number>()
  for (const entry of entries) {
    counts.set(entry.action, (counts.get(entry.action) ?? 0) + 1)
  }
  return [...counts]
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
}

import type { TFunction } from 'i18next'

import type { IconName } from '@/components/icon/icon-paths'

import type { AuditAction, AuditEntry, AuditUser } from './audit-log-api'
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from './audit-log-api'

export type ActionTone = 'danger' | 'success' | 'warning' | 'purple'

type ActionMeta = { icon: IconName; tone: ActionTone }

// Color and icon of every action; the icon is what tells two actions of the
// same color apart.
export const ACTION_META: Record<AuditAction, ActionMeta> = {
  PostCreated: { icon: 'file-plus', tone: 'success' },
  CommentCreated: { icon: 'comment', tone: 'success' },
  ReportResolved: { icon: 'check-circle', tone: 'success' },
  PostEdited: { icon: 'pencil', tone: 'warning' },
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
  RoleRevoked: { icon: 'user-minus', tone: 'purple' },
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
  AuditLogRead: { icon: 'eye', tone: 'purple' },
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
  const request = attemptedRequest(entry)
  if (request) return String(t('admin.auditLog.attempted', { request }))
  const outcome = reportOutcome(entry)
  return outcome
    ? String(t(`admin.auditLog.reportOutcomes.${outcome}` as never))
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

// "daemon assigned role Moderator to trduc", built from the entry. An action
// without a sentence shows its own name.
export function describeEntry(entry: AuditEntry, t: TFunction) {
  const outcome = reportOutcome(entry)
  if (outcome) {
    return String(
      t('admin.auditLog.sentences.ReportResolvedWith' as never, {
        actor: userName(entry.actor, t),
        outcome: t(`admin.auditLog.reportOutcomes.${outcome}` as never),
      }),
    )
  }
  return String(
    t(`admin.auditLog.sentences.${entry.action}` as never, {
      defaultValue: entry.action,
      actor: userName(entry.actor, t),
      affected: entry.affectedUser
        ? userName(entry.affectedUser, t)
        : t('admin.auditLog.someone'),
      detail: entry.detail ?? '',
    }),
  )
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

// "14:05" or "14:05:09", in the viewer's time zone.
export function formatTime(date: string, withSeconds = false) {
  const value = new Date(date)
  const time = `${pad(value.getHours())}:${pad(value.getMinutes())}`
  return withSeconds ? `${time}:${pad(value.getSeconds())}` : time
}

export function formatFull(date: string, language: string | undefined) {
  return new Intl.DateTimeFormat(language, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(date))
}

function dayKey(value: Date) {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}

export type DayGroup = {
  key: string
  label: string
  entries: AuditEntry[]
}

// Groups the entries of the page on screen by the viewer's calendar day:
// Today, Yesterday, or the full date. The page keeps its order.
export function groupByDay(
  entries: AuditEntry[],
  language: string | undefined,
  t: TFunction,
  now: Date = new Date(),
): DayGroup[] {
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const groups: DayGroup[] = []
  for (const entry of entries) {
    const date = new Date(entry.occurredAt)
    const key = dayKey(date)
    let group = groups.at(-1)
    if (group?.key !== key) {
      let label: string
      if (key === dayKey(now)) {
        label = t('admin.auditLog.today')
      } else if (key === dayKey(yesterday)) {
        label = t('admin.auditLog.yesterday')
      } else {
        label = new Intl.DateTimeFormat(language, { dateStyle: 'full' }).format(
          date,
        )
      }
      group = { key, label, entries: [] }
      groups.push(group)
    }
    group.entries.push(entry)
  }
  return groups
}

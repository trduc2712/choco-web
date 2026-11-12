import type { TFunction } from 'i18next'

import type { IconName } from '@/components/icon/icon-paths'

import type { AuditAction, AuditEntry, AuditUser } from './audit-log-api'

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

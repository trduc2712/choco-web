import { expect, test } from 'vitest'

import { i18n } from '@/i18n/i18n'

import type { AuditEntry } from './audit-log-api'
import { AUDIT_TARGET_TYPES } from './audit-log-api'
import { auditDateBounds, parseAuditDay } from './audit-log-dates'
import {
  ACTION_META,
  badgeLabel,
  describeEntry,
  feedbackStatus,
  formatDetail,
  formatTime,
  groupByDay,
  shortId,
} from './audit-log-format'

function entry(overrides: Partial<AuditEntry>): AuditEntry {
  return {
    id: 'e1',
    occurredAt: '2026-11-12T10:00:00',
    actorType: 'User',
    actor: { id: 'a1', username: 'daemon' },
    actorRoles: ['Administrator'],
    clientId: null,
    action: 'RoleAssigned',
    targetType: 'User',
    targetId: '1a2b3c4d-0000-0000-0000-000000000000',
    affectedUser: { id: 'u1', username: 'trduc' },
    detail: 'Moderator',
    changes: [],
    traceId: null,
    ...overrides,
  }
}

test('describes an entry from its actor, affected user and detail', () => {
  expect(describeEntry(entry({}), i18n.t)).toBe(
    'daemon assigned role Moderator to trduc',
  )
  expect(
    describeEntry(
      entry({ action: 'AccountDeleted', actor: null, actorType: 'System' }),
      i18n.t,
    ),
  ).toBe('System removed an account')
})

test('names a deleted account', () => {
  expect(
    describeEntry(
      entry({ affectedUser: { id: 'u1', username: null } }),
      i18n.t,
    ),
  ).toBe('daemon assigned role Moderator to Deleted user')
})

test('shortens an id to four characters', () => {
  expect(shortId('1a2b3c4d-0000')).toBe('1a2b')
})

test('groups entries by the viewer day, keeping their order', () => {
  const now = new Date('2026-11-12T12:00:00')
  const groups = groupByDay(
    [
      entry({ id: 'a', occurredAt: '2026-11-12T11:00:00' }),
      entry({ id: 'b', occurredAt: '2026-11-12T09:00:00' }),
      entry({ id: 'c', occurredAt: '2026-11-11T23:00:00' }),
      entry({ id: 'd', occurredAt: '2026-11-01T08:00:00' }),
    ],
    'en',
    i18n.t,
    now,
  )

  expect(groups.map((group) => group.label).slice(0, 2)).toEqual([
    'Today',
    'Yesterday',
  ])
  expect(groups.map((group) => group.entries.map((e) => e.id))).toEqual([
    ['a', 'b'],
    ['c'],
    ['d'],
  ])
})

test('uses the UTC date and time for a near-midnight event', () => {
  const event = entry({ occurredAt: '2026-11-14T00:42:09+07:00' })
  const groups = groupByDay(
    [event],
    'en',
    i18n.t,
    new Date('2026-11-14T12:00:00Z'),
    'UTC',
  )
  expect(groups[0]).toMatchObject({ key: '2026-11-13', label: 'Yesterday' })
  expect(formatTime(event.occurredAt, true, 'UTC')).toBe('17:42:09')
})

test('uses the next midnight as the exclusive API bound for an inclusive date range', () => {
  expect(auditDateBounds('2026-11-14', '2026-11-14', 'UTC')).toEqual({
    from: '2026-11-14T00:00:00.000Z',
    to: '2026-11-15T00:00:00.000Z',
  })
  expect(auditDateBounds(undefined, '2026-11-14', 'local').to).toBe(
    new Date(2026, 10, 15).toISOString(),
  )
  expect(parseAuditDay('2026-02-30')).toBeUndefined()
})

test('describes the role actions and keeps an icon for each', () => {
  expect(
    describeEntry(
      entry({ action: 'RoleCreated', targetType: 'Role', affectedUser: null }),
      i18n.t,
    ),
  ).toBe('daemon created a role')
  expect(
    describeEntry(entry({ action: 'RoleUpdated', targetType: 'Role' }), i18n.t),
  ).toBe('daemon updated a role')
  expect(
    describeEntry(entry({ action: 'RoleDeleted', targetType: 'Role' }), i18n.t),
  ).toBe('daemon deleted a role')
  expect(ACTION_META.RoleDeleted.tone).toBe('danger')
  expect(AUDIT_TARGET_TYPES).toContain('Role')
})

test('renders the outcome of a resolved report readably', () => {
  const resolved = (detail: string | null) =>
    entry({ action: 'ReportResolved', targetType: 'Report', detail })

  expect(describeEntry(resolved('Outcome: ContentRemoved'), i18n.t)).toBe(
    'daemon resolved a report: removed the post',
  )
  expect(describeEntry(resolved('Outcome: UserSuspended'), i18n.t)).toBe(
    'daemon resolved a report: suspended the user',
  )
  expect(describeEntry(resolved('Outcome: Dismissed'), i18n.t)).toBe(
    'daemon resolved a report: dismissed',
  )
  expect(formatDetail(resolved('Outcome: ContentRemoved'), i18n.t)).toBe(
    'removed the post',
  )
})

test('keeps the old sentence for a resolved report with no known outcome', () => {
  const resolved = (detail: string | null) =>
    entry({ action: 'ReportResolved', targetType: 'Report', detail })

  expect(describeEntry(resolved(null), i18n.t)).toBe('daemon resolved a report')
  expect(describeEntry(resolved('Outcome: ActionTaken'), i18n.t)).toBe(
    'daemon resolved a report',
  )
  expect(formatDetail(resolved('Outcome: ActionTaken'), i18n.t)).toBe(
    'Outcome: ActionTaken',
  )
})

test('reads the role from a "Role: <name>" detail', () => {
  const assigned = entry({ detail: 'Role: Moderator' })
  expect(describeEntry(assigned, i18n.t)).toBe(
    'daemon assigned role Moderator to trduc',
  )
  expect(formatDetail(assigned, i18n.t)).toBe('Moderator')
})

test('reads a feedback status written in PascalCase by older entries', () => {
  const changed = entry({
    action: 'FeedbackStatusChanged',
    targetType: 'Feedback',
    detail: 'Status: InProgress',
  })
  expect(feedbackStatus(changed)).toBe('in_progress')
  expect(formatDetail(changed, i18n.t)).toBe('In progress')
  expect(feedbackStatus({ ...changed, detail: 'Status: Resolved' })).toBe(
    'resolved',
  )
  expect(feedbackStatus({ ...changed, detail: 'Status: toString' })).toBe(
    undefined,
  )
})

test('labels a badge with a short word, or the action without one', () => {
  expect(badgeLabel('RoleRevoked', i18n.t)).toBe('Role revoked')
  expect(badgeLabel('SomethingNew', i18n.t)).toBe('SomethingNew')
})

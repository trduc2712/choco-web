import { expect, test } from 'vitest'

import { i18n } from '@/i18n/i18n'

import type { AuditEntry } from './audit-log-api'
import { AUDIT_TARGET_TYPES } from './audit-log-api'
import {
  ACTION_META,
  describeEntry,
  formatDetail,
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

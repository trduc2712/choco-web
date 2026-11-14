import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

import { i18n } from '@/i18n/i18n'

import type { AuditEntry } from './audit-log-api'
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from './audit-log-api'
import { actionMeta, describeEntry } from './audit-log-format'
import { ActionBadge, EntryDetail } from './audit-parts'

function entry(overrides: Partial<AuditEntry>): AuditEntry {
  return {
    id: 'e1',
    occurredAt: '2026-11-12T10:00:00',
    actorType: 'User',
    actor: { id: 'a1', username: 'daemon' },
    actorRoles: [],
    clientId: null,
    action: 'PostLiked',
    targetType: 'Post',
    targetId: '1a2b3c4d-0000-0000-0000-000000000000',
    affectedUser: { id: 'u1', username: 'trduc' },
    detail: null,
    changes: [],
    traceId: 'trace-1',
    ...overrides,
  }
}

function renderDetail(value: AuditEntry) {
  return render(
    <EntryDetail entry={value} onFilter={vi.fn()} hasExtraFilters />,
  )
}

test('lists 31 actions and 8 target types', () => {
  expect(AUDIT_ACTIONS).toHaveLength(31)
  expect(AUDIT_TARGET_TYPES).toHaveLength(8)
})

test('shows a System entry without an actor and offers no actor filter', () => {
  const system = entry({
    action: 'UserCreated',
    actorType: 'System',
    actor: null,
    targetType: 'User',
    detail: null,
  })
  expect(describeEntry(system, i18n.t)).toBe(
    'System created the account of trduc',
  )
  renderDetail(system)
  expect(screen.getByText('System')).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Filter by actor' }),
  ).not.toBeInTheDocument()
})

test('shows an AccessDenied entry with the attempted request and no target link', () => {
  renderDetail(
    entry({
      action: 'AccessDenied',
      targetType: 'Request',
      targetId: 'a1',
      affectedUser: null,
      detail: 'Request: ResolveReportCommand',
    }),
  )
  expect(screen.getByText('Attempted: ResolveReportCommand')).toBeVisible()
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Filter' }),
  ).not.toBeInTheDocument()
})

test('shows an AuditLogRead entry as a read of the audit log', () => {
  const read = entry({
    action: 'AuditLogRead',
    targetType: 'AuditLog',
    targetId: 'a1',
    affectedUser: null,
  })
  expect(describeEntry(read, i18n.t)).toBe('daemon read the audit log')
  renderDetail(read)
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
})

test('describes a PostLiked entry whose affected user is null', () => {
  const liked = entry({ affectedUser: null })
  expect(describeEntry(liked, i18n.t)).toBe('daemon liked a post')
  renderDetail(liked)
  expect(screen.getAllByText('–').length).toBeGreaterThan(0)
})

test('renders an unknown action and target type as the raw strings', () => {
  const unknown = entry({ action: 'SomethingNew', targetType: 'Gadget' })
  expect(describeEntry(unknown, i18n.t)).toBe('SomethingNew')
  expect(actionMeta('SomethingNew').icon).toBeTruthy()
  render(<ActionBadge action="SomethingNew" />)
  expect(screen.getByText('SomethingNew')).toBeInTheDocument()
  renderDetail(unknown)
  expect(screen.getByText(/Gadget/)).toBeInTheDocument()
})

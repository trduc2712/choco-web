import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import type { AuditChange, AuditEntry } from './audit-log-api'
import { ChangeCount, EntryDetail } from './audit-parts'

function entry(changes: AuditChange[]): AuditEntry {
  return {
    id: 'e1',
    occurredAt: '2026-11-12T10:00:00',
    actorType: 'User',
    actor: { id: 'a1', username: 'daemon' },
    actorRoles: [],
    clientId: null,
    action: 'RoleUpdated',
    targetType: 'Role',
    targetId: '1a2b3c4d-0000-0000-0000-000000000000',
    affectedUser: null,
    detail: null,
    changes,
    traceId: null,
  }
}

function renderDetail(changes: AuditChange[]) {
  return render(<EntryDetail entry={entry(changes)} onFilter={vi.fn()} />)
}

test('shows no changes row and no badge for an empty list', () => {
  renderDetail([])
  expect(screen.queryByText('Changes')).not.toBeInTheDocument()
  const { container } = render(<ChangeCount entry={entry([])} />)
  expect(container).toBeEmptyDOMElement()
})

test('counts the changes in a badge', () => {
  render(<ChangeCount entry={entry([{ field: 'name' }, { field: 'bio' }])} />)
  expect(screen.getByText('2 changes')).toBeInTheDocument()
})

test('shows before and after', () => {
  renderDetail([
    { field: 'name', before: 'Reviewer', after: 'Senior Reviewer' },
  ])
  expect(screen.getByText('Name')).toBeInTheDocument()
  expect(screen.getByText('Reviewer')).toBeInTheDocument()
  expect(screen.getByText('Senior Reviewer')).toBeInTheDocument()
})

test('shows a change with only after, and only before', () => {
  renderDetail([
    { field: 'outcome', after: 'ContentRemoved' },
    { field: 'name', before: 'Old' },
  ])
  expect(screen.getByText('set to ContentRemoved')).toBeInTheDocument()
  expect(screen.getByText('was Old')).toBeInTheDocument()
})

test('says a value is not recorded when only the field is present', () => {
  renderDetail([{ field: 'username' }, { field: 'firstName' }])
  expect(
    screen.getByText('Username changed · value not recorded'),
  ).toBeInTheDocument()
  expect(
    screen.getByText('First name changed · value not recorded'),
  ).toBeInTheDocument()
})

test('maps isSuspended to Active and Suspended', () => {
  renderDetail([{ field: 'isSuspended', before: 'false', after: 'true' }])
  expect(screen.getByText('Suspension')).toBeInTheDocument()
  expect(screen.getByText('Active')).toBeInTheDocument()
  expect(screen.getByText('Suspended')).toBeInTheDocument()
})

test('shows an unknown field by its raw name', () => {
  renderDetail([{ field: 'someNewField', before: 'a', after: 'b' }])
  expect(screen.getByText('someNewField')).toBeInTheDocument()
})

test('shows added and removed permissions, 10 at a time', async () => {
  const added = Array.from({ length: 25 }, (_, i) => `perm.code-${i}`)
  renderDetail([{ field: 'permissions', added, removed: ['reports.handle'] }])

  expect(screen.getAllByText(/^perm\.code-/)).toHaveLength(10)
  expect(screen.getByText('reports.handle')).toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: 'and 15 more' }))
  expect(screen.getAllByText(/^perm\.code-/)).toHaveLength(25)

  await userEvent.click(screen.getByRole('button', { name: 'Show fewer' }))
  expect(screen.getAllByText(/^perm\.code-/)).toHaveLength(10)
})

test('does not break on an entry with no changes key', () => {
  const legacy = { ...entry([]), changes: undefined } as unknown as AuditEntry
  const { container } = render(
    <EntryDetail entry={legacy} onFilter={vi.fn()} />,
  )
  expect(within(container).queryByText('Changes')).not.toBeInTheDocument()
})

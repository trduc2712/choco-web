import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ReactNode, useState } from 'react'
import { MemoryRouter } from 'react-router'
import { expect, test, vi } from 'vitest'

import { i18n } from '@/i18n/i18n'

import type { AuditEntry } from './audit-log-api'
import {
  AUDIT_ACTIONS,
  AUDIT_TARGET_TYPES,
  auditLogEntryQueryOptions,
} from './audit-log-api'
import { actionMeta, describeEntry, groupByDay } from './audit-log-format'
import { ActionBadge, EntryDetail } from './audit-parts'
import { AuditRecord } from './audit-record'
import { TimelineView } from './views/timeline-view'

vi.mock('@clerk/react', () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'clerk-admin',
    getToken: () => Promise.resolve('token'),
  }),
}))

// Names link to profiles; without the permission to view users they do so
// without a preview card, which needs no request.
vi.mock('@/features/current-user', () => ({
  PERMISSIONS: { readAnyUser: 'users.read-any' },
  usePermissions: () => ({
    isLoading: false,
    can: () => false,
    canAny: () => false,
  }),
}))

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

function renderWithQuery(ui: ReactNode, detail: Promise<AuditEntry>) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  const query = auditLogEntryQueryOptions(vi.fn(), 'clerk-admin', 'e1')
  void client.prefetchQuery({ ...query, queryFn: () => detail })

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

test('opens a timeline event and filters to its target from the inline details', async () => {
  const event = entry({
    action: 'PostEdited',
    changes: [{ field: 'name', before: 'Draft', after: 'Published' }],
  })
  const onFilter = vi.fn()
  const groups = groupByDay([event], 'en', i18n.t)

  function Timeline() {
    const [id, setId] = useState<string | null>(null)
    return (
      <TimelineView
        groups={groups}
        zone="local"
        selectedId={id}
        onSelect={setId}
        onFilter={onFilter}
        canBrowsePosts={false}
      />
    )
  }

  renderWithQuery(<Timeline />, Promise.resolve(event))
  const summary = screen.getByRole('button', { name: /daemon.*post/i })
  expect(summary).toHaveAttribute('aria-expanded', 'false')
  await userEvent.click(summary)
  expect(summary).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByText('Published')).toBeVisible()
  await userEvent.click(
    screen.getByRole('button', { name: 'View target history' }),
  )
  expect(onFilter).toHaveBeenCalledWith('target', event)
})

test('enriches an open record with the previous change, target preview and ordered history', async () => {
  const change = { field: 'status', before: 'New', after: 'Resolved' }
  const listed = entry({
    action: 'FeedbackStatusChanged',
    targetType: 'Feedback',
    occurredAt: '2026-11-12T10:00:00Z',
    changes: [change],
  })
  let loadDetail!: (value: AuditEntry) => void
  const detail = new Promise<AuditEntry>((resolve) => {
    loadDetail = resolve
  })
  const onFilter = vi.fn()
  renderWithQuery(
    <AuditRecord
      entry={listed}
      zone="UTC"
      onFilter={onFilter}
      canBrowsePosts={false}
    />,
    detail,
  )

  expect(screen.getByText('New')).toBeVisible()
  expect(screen.getByText('Resolved')).toBeVisible()
  expect(screen.queryByText('History')).not.toBeInTheDocument()

  const full: AuditEntry = {
    ...listed,
    changes: [{ ...change, previousChangedAt: '2026-11-12T08:00:00Z' }],
    targetSummary: {
      excerpt: 'The page stopped loading.',
      author: { id: 'u2', username: 'ada' },
      category: 'bug',
      status: 'Resolved',
    },
    targetHistory: {
      totalCount: 7,
      recent: [
        {
          id: 'e0',
          action: listed.action,
          occurredAt: '2026-11-12T08:00:00Z',
          value: 'New',
        },
        {
          id: listed.id,
          action: listed.action,
          occurredAt: listed.occurredAt,
          value: 'Resolved',
        },
      ],
    },
  }
  loadDetail(full)

  expect(await screen.findByText('after 2 hours as New')).toBeVisible()
  expect(screen.getByRole('blockquote')).toHaveTextContent(
    'The page stopped loading.',
  )
  expect(screen.getByRole('link', { name: '@ada' })).toBeVisible()
  expect(screen.getByText('Bug')).toBeVisible()
  const history = screen.getByText('This event').closest('ol')!
  const [previous, current] = within(history).getAllByRole('listitem')
  expect(previous).toHaveTextContent('New')
  expect(current).toHaveTextContent('Resolved')
  expect(current).toHaveAttribute('aria-current', 'step')
  await userEvent.click(screen.getByRole('button', { name: 'All 7 events' }))
  expect(onFilter).toHaveBeenCalledWith('target', full)
})

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

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ToastProvider } from '@/components/toast/toast-provider'
import type * as CurrentUser from '@/features/current-user'
import { i18n } from '@/i18n/i18n'

import type { ReportedTarget } from './reports-api'
import { ReportsQueue } from './reports-queue'

vi.mock('@clerk/react', () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'clerk-viewer',
    sessionId: 'session',
    getToken: () => Promise.resolve('token'),
  }),
}))

let granted: string[] = []

vi.mock('@/features/current-user', async (importOriginal) => {
  const original = await importOriginal<typeof CurrentUser>()
  return {
    ...original,
    useRefreshCurrentUser: () => () => Promise.resolve(),
    usePermissions: () => ({
      isLoading: false,
      granted,
      can: (permission: string) => granted.includes(permission),
      canAny: (list: readonly string[]) =>
        list.some((permission) => granted.includes(permission)),
    }),
  }
})

const fetchMock = vi.fn<typeof fetch>()
let client: QueryClient
let rows: ReportedTarget[]

const POST_ROW: ReportedTarget = {
  targetType: 'Post',
  targetPostId: 'post-1',
  targetUserId: null,
  openReportCount: 12,
  reasons: [
    { reason: 'Spam', count: 9 },
    { reason: 'Harassment', count: 3 },
  ],
  oldestReportedAt: '2026-11-01T10:00:00Z',
  reportId: 'report-post',
  post: {
    content: 'Buy cheap watches',
    author: { id: 'a1', username: 'spammer' },
  },
  user: null,
  reports: Array.from({ length: 10 }, (_, n) => ({
    id: `r${n}`,
    reason: 'Spam' as const,
    details: n === 0 ? 'Sells things' : null,
    reporterId: `u${n}`,
    reporterUsername: n === 1 ? null : `reporter${n}`,
    createdAt: '2026-11-01T10:00:00Z',
  })),
}

const USER_ROW: ReportedTarget = {
  targetType: 'User',
  targetPostId: null,
  targetUserId: 'user-1',
  openReportCount: 1,
  reasons: [{ reason: 'Harassment', count: 1 }],
  oldestReportedAt: '2026-11-02T10:00:00Z',
  reportId: 'report-user',
  post: null,
  user: { username: 'bully', displayName: 'Bully', isSuspended: false },
  reports: [
    {
      id: 'r-user',
      reason: 'Harassment',
      details: null,
      reporterId: 'u9',
      reporterUsername: 'victim',
      createdAt: '2026-11-02T10:00:00Z',
    },
  ],
}

function Location() {
  const { search } = useLocation()
  return <p data-testid="search">{search}</p>
}

function listCalls() {
  return fetchMock.mock.calls
    .map(([input]) => new URL(String(input), 'http://localhost'))
    .filter((url) => url.pathname.endsWith('/reports'))
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('scrollTo', vi.fn())
  granted = ['reports.handle', 'posts.delete-any', 'users.suspend']
  rows = [POST_ROW, USER_ROW]
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  fetchMock.mockImplementation((input, init) => {
    const url = new URL(String(input), 'http://localhost')
    if (init?.method === 'PUT') {
      return Promise.resolve(new Response(null, { status: 204 }))
    }
    return Promise.resolve(
      Response.json({
        items: rows,
        page: 1,
        pageSize: Number(url.searchParams.get('pageSize') ?? 20),
        totalCount: rows.length,
      }),
    )
  })
})

afterEach(() => {
  client.clear()
  vi.unstubAllGlobals()
})

function renderQueue(url = '/admin/reports') {
  render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[url]}>
          <ReportsQueue />
          <Location />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

const text = (key: string, options?: object) =>
  String(i18n.t(key as never, options as never))

test('lists one row per target with its reasons and counts', async () => {
  renderQueue()

  const post = (await screen.findByText('Buy cheap watches')).closest('tr')
  expect(within(post as HTMLElement).getByText('by @spammer')).toBeVisible()
  expect(within(post as HTMLElement).getByText('Spam · 9')).toBeVisible()
  expect(within(post as HTMLElement).getByText('Harassment · 3')).toBeVisible()
  const user = screen.getByText('Bully').closest('tr')
  expect(within(user as HTMLElement).getByText('@bully')).toBeVisible()
  expect(listCalls()[0].searchParams.get('page')).toBe('1')
})

test('links to all open reports when the queue only shows the oldest ten', async () => {
  renderQueue()
  const post = (await screen.findByText('Buy cheap watches')).closest('tr')

  await userEvent.click(
    within(post as HTMLElement).getByRole('button', {
      name: text('admin.reports.queue.showReports', { count: 12 }),
    }),
  )

  expect(within(post as HTMLElement).getByText('Sells things')).toBeVisible()
  expect(
    within(post as HTMLElement).getByRole('link', {
      name: text('admin.reports.all.viewTargetReports', { count: 12 }),
    }),
  ).toHaveAttribute(
    'href',
    '/admin/reports?view=all&targetType=Post&targetId=post-1&status=Open',
  )
  expect(
    within(post as HTMLElement).getByText(
      new RegExp(text('admin.reports.queue.reporterDeleted')),
    ),
  ).toBeVisible()
})

test('marks a suspended user and offers no Suspend outcome for them', async () => {
  rows = [
    {
      ...USER_ROW,
      user: { username: 'bully', displayName: 'Bully', isSuspended: true },
    },
  ]
  renderQueue()
  const row = (await screen.findByText('Bully')).closest('tr')

  expect(
    within(row as HTMLElement).getByText(text('admin.users.states.suspended')),
  ).toBeVisible()
  await userEvent.click(
    within(row as HTMLElement).getByRole('button', {
      name: text('admin.reports.queue.resolve'),
    }),
  )

  expect(
    screen.getByRole('radio', {
      name: text('admin.reports.outcomes.Dismissed'),
    }),
  ).toBeVisible()
  expect(
    screen.queryByRole('radio', {
      name: text('admin.reports.outcomes.UserSuspended'),
    }),
  ).toBeNull()
})

test('the filters write the URL, return to page 1 and are sent to the API', async () => {
  renderQueue('/admin/reports?page=2')
  await screen.findByText('Buy cheap watches')

  await userEvent.click(
    screen.getByRole('combobox', {
      name: text('admin.reports.queue.columns.target'),
    }),
  )
  await userEvent.click(
    screen.getByRole('option', {
      name: text('admin.reports.targetTypes.Post'),
    }),
  )
  await userEvent.click(
    screen.getByRole('combobox', {
      name: text('admin.reports.queue.columns.reasons'),
    }),
  )
  await userEvent.click(
    screen.getByRole('option', {
      name: text('admin.reports.reasons.HateSpeech'),
    }),
  )

  await waitFor(() => {
    const last = listCalls().at(-1)
    expect(last?.searchParams.get('targetType')).toBe('Post')
    expect(last?.searchParams.get('reason')).toBe('HateSpeech')
    expect(last?.searchParams.get('page')).toBe('1')
  })
  expect(screen.getByTestId('search')).toHaveTextContent('targetType=Post')
  expect(screen.getByTestId('search')).toHaveTextContent('reason=HateSpeech')
  expect(screen.getByTestId('search')).not.toHaveTextContent('page=')
})

test('ignores a filter value in the URL that the API would refuse', async () => {
  renderQueue('/admin/reports?targetType=post&reason=spam')
  await screen.findByText('Buy cheap watches')

  const [first] = listCalls()
  expect(first.searchParams.has('targetType')).toBe(false)
  expect(first.searchParams.has('reason')).toBe(false)
})

test('resolving sends the row reportId and asks the list again so the row goes', async () => {
  renderQueue()
  const post = (await screen.findByText('Buy cheap watches')).closest('tr')
  const before = listCalls().length

  await userEvent.click(
    within(post as HTMLElement).getByRole('button', {
      name: text('admin.reports.queue.resolve'),
    }),
  )
  await userEvent.click(
    screen.getByRole('radio', {
      name: text('admin.reports.outcomes.ContentRemoved'),
    }),
  )
  await userEvent.click(
    screen.getByRole('button', { name: text('admin.reports.continue') }),
  )
  rows = [USER_ROW]
  await userEvent.click(
    screen.getByRole('button', {
      name: text('admin.reports.confirm.ContentRemoved'),
    }),
  )

  await waitFor(() => {
    const put = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT')
    expect(String(put?.[0])).toContain('/reports/report-post/resolution')
    expect(JSON.parse(String(put?.[1]?.body))).toEqual({
      outcome: 'ContentRemoved',
    })
  })
  await waitFor(() => expect(listCalls().length).toBeGreaterThan(before))
  await waitFor(() =>
    expect(screen.queryByText('Buy cheap watches')).toBeNull(),
  )
})

test('shows the empty state', async () => {
  rows = []
  renderQueue()

  expect(
    await screen.findByText(text('admin.reports.queue.empty')),
  ).toBeVisible()
})

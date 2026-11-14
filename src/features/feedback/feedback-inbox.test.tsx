import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ToastProvider } from '@/components/toast/toast-provider'
import { i18n } from '@/i18n/i18n'

import type {
  FeedbackItem,
  FeedbackStatus,
  FeedbackSummary,
} from './feedback-admin-api'
import { FeedbackInbox } from './feedback-inbox'

vi.mock('@clerk/react', () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'clerk-admin',
    sessionId: 'session',
    getToken: () => Promise.resolve('token'),
  }),
}))

vi.mock('@/features/current-user', () => ({
  PERMISSIONS: { changeFeedbackStatus: 'feedback.change-status' },
  usePermissions: () => ({
    isLoading: false,
    can: () => true,
    canAny: () => true,
  }),
}))

const fetchMock = vi.fn<typeof fetch>()
let client: QueryClient

function feedbackId(n: number) {
  return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
}

// A row of the list: the message is only a preview.
function feedback(n: number): FeedbackSummary {
  return {
    id: feedbackId(n),
    author: {
      id: 'u1',
      username: 'ada',
      displayName: 'Ada Lovelace',
      avatarUrl: null,
    },
    category: 'bug',
    messagePreview: `Message ${n}`,
    status: 'new',
    createdAt: '2026-11-01T10:00:00Z',
  }
}

// The whole feedback, as the detail and the status change return it.
function fullFeedback(
  n: number,
  status: FeedbackItem['status'] = 'new',
): FeedbackItem {
  return {
    id: feedbackId(n),
    author: {
      id: 'u1',
      username: 'ada',
      displayName: 'Ada Lovelace',
      avatarUrl: null,
    },
    category: 'bug',
    message: `Full message ${n}`,
    context: {
      path: '/search',
      locale: 'en',
      theme: 'dark',
      userAgent: 'TestAgent/1.0',
      viewport: { width: 800, height: 600 },
      appVersion: 'abc1234def',
    },
    status,
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-01T10:00:00Z',
  }
}

// Answers like choco-api does: the slice of `total` items the page asks for,
// and the total itself. A page past the end has no items.
function serveFeedback(total: number) {
  fetchMock.mockImplementation((input) => {
    const url = new URL(String(input), 'http://localhost')
    const page = Number(url.searchParams.get('page') ?? 1)
    const pageSize = Number(url.searchParams.get('pageSize') ?? 20)
    const first = (page - 1) * pageSize + 1
    const items = Array.from(
      { length: Math.max(0, Math.min(pageSize, total - first + 1)) },
      (_, index) => feedback(first + index),
    )
    return Promise.resolve(
      Response.json({ items, page, pageSize, totalCount: total }),
    )
  })
}

function requestedUrls() {
  return fetchMock.mock.calls.map(
    ([input]) => new URL(String(input), 'http://localhost'),
  )
}

// One of the status choices in the dialog (the toolbar has a status filter,
// which is a select, not a radio).
async function dialogStatus(status: FeedbackStatus) {
  const dialog = await screen.findByRole('dialog')
  return within(dialog).findByRole('radio', {
    name: i18n.t(`admin.feedback.statuses.${status}`),
  })
}

function Location() {
  const { search } = useLocation()
  return <p data-testid="search">{search}</p>
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('scrollTo', vi.fn())
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.open = false
  }
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
})

afterEach(() => {
  client.clear()
  vi.unstubAllGlobals()
})

const PAGE_SIZE = 10

function renderInbox(url = '/admin/feedback') {
  const [path, query = ''] = url.split('?')
  const params = new URLSearchParams(query)
  if (!params.has('pageSize')) params.set('pageSize', String(PAGE_SIZE))
  const entry = path + '?' + params.toString()

  render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[entry]}>
          <FeedbackInbox />
          <Location />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

test('shows the first page with its range, and asks for page 1', async () => {
  serveFeedback(24)

  renderInbox()

  expect(await screen.findByText('Message 1')).toBeInTheDocument()
  expect(screen.getByText(`Message ${PAGE_SIZE}`)).toBeInTheDocument()
  expect(screen.queryByText(`Message ${PAGE_SIZE + 1}`)).not.toBeInTheDocument()
  expect(
    screen.getByText(
      i18n.t('admin.pager.range', { from: 1, to: 10, total: 24 }),
    ),
  ).toBeInTheDocument()
  expect(requestedUrls()[0].searchParams.get('page')).toBe('1')
  expect(requestedUrls()[0].searchParams.get('pageSize')).toBe(
    String(PAGE_SIZE),
  )
  expect(requestedUrls()[0].searchParams.has('cursor')).toBe(false)
})

test('opens a middle page from the URL and keeps the page in it', async () => {
  serveFeedback(24)

  renderInbox('/admin/feedback?page=2')

  expect(await screen.findByText('Message 11')).toBeInTheDocument()
  expect(
    screen.getByText(
      i18n.t('admin.pager.range', { from: 11, to: 20, total: 24 }),
    ),
  ).toBeInTheDocument()

  await userEvent.click(
    screen.getByRole('button', {
      name: i18n.t('pagination.page', { page: 3 }),
    }),
  )

  expect(await screen.findByText('Message 21')).toBeInTheDocument()
  expect(screen.getByTestId('search')).toHaveTextContent('page=3')
})

test('shows a short last page', async () => {
  serveFeedback(24)

  renderInbox('/admin/feedback?page=3')

  expect(await screen.findByText('Message 24')).toBeInTheDocument()
  expect(
    screen.getByText(
      i18n.t('admin.pager.range', { from: 21, to: 24, total: 24 }),
    ),
  ).toBeInTheDocument()
})

test('steps back to the last page when the page is past the total', async () => {
  serveFeedback(24)

  renderInbox('/admin/feedback?page=9')

  expect(await screen.findByText('Message 21')).toBeInTheDocument()
  expect(screen.getByTestId('search')).toHaveTextContent('page=3')
})

test('goes back to page 1 when a filter changes', async () => {
  serveFeedback(24)

  renderInbox('/admin/feedback?page=2')
  await screen.findByText('Message 11')

  await userEvent.click(
    screen.getByRole('combobox', {
      name: i18n.t('admin.feedback.columns.status'),
    }),
  )
  await userEvent.click(
    screen.getByRole('option', {
      name: i18n.t('admin.feedback.statuses.new'),
    }),
  )

  await waitFor(() => {
    const last = requestedUrls().at(-1)
    expect(last?.searchParams.get('status')).toBe('new')
    expect(last?.searchParams.get('page')).toBe('1')
  })
  expect(screen.getByTestId('search')).toHaveTextContent('status=new')
  expect(screen.getByTestId('search')).not.toHaveTextContent('page=')
})

test('shows an error with a retry when the API answers 400', async () => {
  fetchMock.mockImplementation(() =>
    Promise.resolve(
      Response.json(
        { errors: { page: ['must be at least 1'] } },
        {
          status: 400,
          headers: { 'Content-Type': 'application/problem+json' },
        },
      ),
    ),
  )

  renderInbox()

  expect(
    await screen.findByText(i18n.t('admin.feedback.loadError')),
  ).toBeVisible()
  expect(
    screen.getByRole('button', { name: i18n.t('admin.feedback.retry') }),
  ).toBeVisible()
})

test('changes the rows per page, goes back to page 1 and keeps the filter', async () => {
  serveFeedback(24)

  renderInbox('/admin/feedback?page=2&status=new')

  expect(await screen.findByText('Message 11')).toBeInTheDocument()

  await userEvent.click(
    screen.getByRole('combobox', { name: i18n.t('pageSizeSelect.label') }),
  )
  await userEvent.click(
    screen.getByRole('option', {
      name: i18n.t('pageSizeSelect.option', { count: 20 }),
    }),
  )

  expect(await screen.findByText('Message 20')).toBeInTheDocument()
  expect(screen.getByTestId('search')).toHaveTextContent('pageSize=20')
  expect(screen.getByTestId('search')).toHaveTextContent('status=new')
  expect(screen.getByTestId('search')).not.toHaveTextContent('page=')
  const last = requestedUrls().at(-1)
  expect(last?.searchParams.get('pageSize')).toBe('20')
  expect(last?.searchParams.get('page')).toBe('1')
})

test('shows the preview in the row and loads the whole feedback when it opens', async () => {
  fetchMock.mockImplementation((input) => {
    const url = new URL(String(input), 'http://localhost')
    if (url.pathname.endsWith(`/admin/feedback/${feedbackId(1)}`))
      return Promise.resolve(Response.json(fullFeedback(1)))
    return Promise.resolve(
      Response.json({
        items: [feedback(1)],
        page: 1,
        pageSize: PAGE_SIZE,
        totalCount: 1,
      }),
    )
  })

  renderInbox()
  await userEvent.click(
    await screen.findByRole('button', { name: 'Message 1' }),
  )

  expect(await screen.findByText('Full message 1')).toBeVisible()
  expect(screen.getByTestId('search')).toHaveTextContent(`id=${feedbackId(1)}`)
  expect(
    requestedUrls().some((url) =>
      url.pathname.endsWith(`/admin/feedback/${feedbackId(1)}`),
    ),
  ).toBe(true)
})

// The server's answer to a status change that is refused: the feedback has
// left "new" and cannot go back.
function problem409() {
  return Response.json(
    { code: 'Feedback.CannotReturnToNew', title: 'Conflict', status: 409 },
    { status: 409, headers: { 'Content-Type': 'application/problem+json' } },
  )
}

test('puts "new" out of reach once the feedback has left it', async () => {
  fetchMock.mockImplementation((input) => {
    const url = new URL(String(input), 'http://localhost')
    if (url.pathname.endsWith(`/admin/feedback/${feedbackId(1)}`))
      return Promise.resolve(Response.json(fullFeedback(1, 'in_progress')))
    return Promise.resolve(
      Response.json({
        items: [{ ...feedback(1), status: 'in_progress' }],
        page: 1,
        pageSize: PAGE_SIZE,
        totalCount: 1,
      }),
    )
  })

  renderInbox(`/admin/feedback?id=${feedbackId(1)}`)
  expect(await dialogStatus('in_progress')).toBeChecked()
  expect(await dialogStatus('new')).toBeDisabled()
  expect(await dialogStatus('resolved')).toBeEnabled()
})

test('on a 409, says so, puts the status back and loads the feedback again', async () => {
  let serverStatus: FeedbackItem['status'] = 'new'
  let detailCalls = 0
  fetchMock.mockImplementation((input, init) => {
    const url = new URL(String(input), 'http://localhost')
    if (url.pathname.endsWith(`/admin/feedback/${feedbackId(1)}/status`)) {
      expect(init?.method).toBe('PUT')
      // Another admin got there first: the feedback is in progress now.
      serverStatus = 'in_progress'
      return Promise.resolve(problem409())
    }
    if (url.pathname.endsWith(`/admin/feedback/${feedbackId(1)}`)) {
      detailCalls += 1
      return Promise.resolve(Response.json(fullFeedback(1, serverStatus)))
    }
    return Promise.resolve(
      Response.json({
        items: [{ ...feedback(1), status: serverStatus }],
        page: 1,
        pageSize: PAGE_SIZE,
        totalCount: 1,
      }),
    )
  })

  renderInbox(`/admin/feedback?id=${feedbackId(1)}`)
  expect(await dialogStatus('new')).toBeChecked()

  await userEvent.click(await dialogStatus('resolved'))

  expect(
    await screen.findByText(i18n.t('admin.feedback.cannotReturnToNew')),
  ).toBeVisible()
  // The item was asked for again, and the dialog shows what the server has.
  await waitFor(() => expect(detailCalls).toBeGreaterThan(1))
  await waitFor(() =>
    expect(
      within(screen.getByRole('dialog')).getByRole('radio', {
        name: i18n.t('admin.feedback.statuses.in_progress'),
      }),
    ).toBeChecked(),
  )
})

test('searches from the toolbar, applies when typing pauses, and resets everything', async () => {
  serveFeedback(24)

  renderInbox('/admin/feedback?page=2&status=resolved')
  await screen.findByText('Message 11')

  await userEvent.type(
    screen.getByRole('searchbox', {
      name: i18n.t('admin.feedback.columns.message'),
    }),
    'feed',
  )

  // One request for the whole word, not one per letter.
  await waitFor(() => {
    const last = requestedUrls().at(-1)
    expect(last?.searchParams.get('q')).toBe('feed')
    expect(last?.searchParams.get('page')).toBe('1')
  })
  expect(requestedUrls().some((url) => url.searchParams.get('q') === 'f')).toBe(
    false,
  )

  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('admin.toolbar.reset') }),
  )

  await waitFor(() => {
    const last = requestedUrls().at(-1)
    expect(last?.searchParams.has('q')).toBe(false)
    expect(last?.searchParams.has('status')).toBe(false)
  })
  expect(screen.getByTestId('search')).not.toHaveTextContent('status=')
  expect(
    screen.getByRole('searchbox', {
      name: i18n.t('admin.feedback.columns.message'),
    }),
  ).toHaveValue('')
  expect(
    screen.queryByRole('button', { name: i18n.t('admin.toolbar.reset') }),
  ).not.toBeInTheDocument()
})

test('links the sender to their drawer on the users screen, and shows a card on hover', async () => {
  const detail = {
    id: 'u1',
    username: 'ada',
    displayName: 'Ada Lovelace',
    createdAt: '2026-01-01T00:00:00+00:00',
    roles: [{ id: 'r1', name: 'Moderator' }],
    isSuspended: false,
    isDeleted: false,
    bio: null,
    avatarUrl: null,
    deletedAt: null,
    suspension: null,
    openReportCount: 2,
  }
  fetchMock.mockImplementation((input) => {
    const url = new URL(String(input), 'http://localhost')
    if (url.pathname.endsWith('/admin/users/u1'))
      return Promise.resolve(Response.json(detail))
    return Promise.resolve(
      Response.json({
        items: [feedback(1)],
        page: 1,
        pageSize: PAGE_SIZE,
        totalCount: 1,
      }),
    )
  })

  renderInbox()
  const link = await screen.findByRole('link', { name: /@ada/ })
  expect(link).toHaveAttribute('href', '/admin/users?user=u1')
  // Nothing about the user is asked for until the card opens.
  expect(
    requestedUrls().some((url) => url.pathname.endsWith('/admin/users/u1')),
  ).toBe(false)

  await userEvent.hover(link)

  expect(
    await screen.findByText('Ada Lovelace', undefined, { timeout: 3000 }),
  ).toBeVisible()
  expect(await screen.findByText('Moderator')).toBeVisible()
  expect(
    screen.getByRole('link', {
      name: i18n.t('admin.users.preview.viewDetails'),
    }),
  ).toHaveAttribute('href', '/admin/users?user=u1')
})

test('opens a row from any cell, but not from the sender link', async () => {
  fetchMock.mockImplementation((input) => {
    const url = new URL(String(input), 'http://localhost')
    if (url.pathname.endsWith(`/admin/feedback/${feedbackId(2)}`))
      return Promise.resolve(Response.json(fullFeedback(2)))
    return Promise.resolve(
      Response.json({
        items: [feedback(1), feedback(2)],
        page: 1,
        pageSize: PAGE_SIZE,
        totalCount: 2,
      }),
    )
  })

  renderInbox()
  await screen.findByText('Message 2')
  const rows = screen.getAllByRole('row')
  // The second data row (the first row is the header): click its category cell.
  await userEvent.click(
    within(rows[2]).getByText(i18n.t('feedback.categories.bug')),
  )

  expect(await screen.findByText('Full message 2')).toBeVisible()
  expect(screen.getByTestId('search')).toHaveTextContent(`id=${feedbackId(2)}`)
})

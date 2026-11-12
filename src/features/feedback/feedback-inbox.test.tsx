import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ToastProvider } from '@/components/toast/toast-provider'
import { i18n } from '@/i18n/i18n'

import type { FeedbackItem } from './feedback-admin-api'
import { FeedbackInbox } from './feedback-inbox'
import { FEEDBACK_PAGE_SIZE } from './feedback-inbox-api'

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

function feedback(n: number): FeedbackItem {
  return {
    id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
    author: { id: 'u1', username: 'ada', displayName: 'Ada Lovelace' },
    category: 'bug',
    message: `Message ${n}`,
    context: {
      path: '/search',
      locale: 'en',
      theme: 'dark',
      userAgent: 'TestAgent/1.0',
      viewport: { width: 800, height: 600 },
      appVersion: 'abc1234def',
    },
    status: 'new',
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

function renderInbox(url = '/admin/feedback') {
  render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[url]}>
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
  expect(screen.getByText(`Message ${FEEDBACK_PAGE_SIZE}`)).toBeInTheDocument()
  expect(
    screen.queryByText(`Message ${FEEDBACK_PAGE_SIZE + 1}`),
  ).not.toBeInTheDocument()
  expect(
    screen.getByText(
      i18n.t('admin.feedback.range', { from: 1, to: 10, total: 24 }),
    ),
  ).toBeInTheDocument()
  expect(requestedUrls()[0].searchParams.get('page')).toBe('1')
  expect(requestedUrls()[0].searchParams.get('pageSize')).toBe(
    String(FEEDBACK_PAGE_SIZE),
  )
  expect(requestedUrls()[0].searchParams.has('cursor')).toBe(false)
})

test('opens a middle page from the URL and keeps the page in it', async () => {
  serveFeedback(24)

  renderInbox('/admin/feedback?page=2')

  expect(await screen.findByText('Message 11')).toBeInTheDocument()
  expect(
    screen.getByText(
      i18n.t('admin.feedback.range', { from: 11, to: 20, total: 24 }),
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
      i18n.t('admin.feedback.range', { from: 21, to: 24, total: 24 }),
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
    screen.getByRole('button', {
      name: i18n.t('admin.feedback.filters.status'),
    }),
  )
  await userEvent.click(
    screen.getByRole('menuitemradio', {
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

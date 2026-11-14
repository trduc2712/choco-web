import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { i18n } from '@/i18n/i18n'

import { FEEDBACK_STATUSES } from './feedback-admin-api'
import type { MyFeedbackItem } from './my-feedback-api'
import { MyFeedbackList } from './my-feedback-list'

vi.mock('@clerk/react', () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'clerk-viewer',
    sessionId: 'session',
    getToken: () => Promise.resolve('token'),
  }),
}))

const fetchMock = vi.fn<typeof fetch>()
let client: QueryClient

function mine(n: number, status: MyFeedbackItem['status']): MyFeedbackItem {
  return {
    id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
    category: 'suggestion',
    message: `My message ${n}`,
    status,
    createdAt: '2026-11-01T10:00:00Z',
  }
}

function requestedUrls() {
  return fetchMock.mock.calls.map(
    ([input]) => new URL(String(input), 'http://localhost'),
  )
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
})

afterEach(() => {
  client.clear()
  vi.unstubAllGlobals()
})

function renderList() {
  render(
    <QueryClientProvider client={client}>
      <MyFeedbackList />
    </QueryClientProvider>,
  )
}

test('pages through my feedback with the cursor the API gave', async () => {
  const cursor = 'opaque+/='
  fetchMock.mockImplementation((input) => {
    const url = new URL(String(input), 'http://localhost')
    return Promise.resolve(
      url.searchParams.get('cursor') === cursor
        ? Response.json({ items: [mine(3, 'resolved')], nextCursor: null })
        : Response.json({
            items: [mine(1, 'new'), mine(2, 'in_progress')],
            nextCursor: cursor,
          }),
    )
  })

  renderList()

  expect(await screen.findByText('My message 1')).toBeVisible()
  expect(screen.getByText('My message 2')).toBeVisible()
  expect(screen.queryByText('My message 3')).not.toBeInTheDocument()
  expect(requestedUrls()[0].pathname).toMatch(/\/me\/feedback$/)
  expect(requestedUrls()[0].searchParams.has('cursor')).toBe(false)

  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('feedback.mine.loadMore') }),
  )

  expect(await screen.findByText('My message 3')).toBeVisible()
  // The cursor goes back as it came.
  expect(requestedUrls()[1].searchParams.get('cursor')).toBe(cursor)
  // The last page has no cursor, so there is nothing more to load.
  expect(
    screen.queryByRole('button', { name: i18n.t('feedback.mine.loadMore') }),
  ).not.toBeInTheDocument()
  expect(screen.getByText('My message 1')).toBeVisible()
})

test('shows each status in the words a sender reads, and the category', async () => {
  fetchMock.mockResolvedValue(
    Response.json({
      items: [
        mine(1, 'new'),
        mine(2, 'in_progress'),
        mine(3, 'resolved'),
        mine(4, 'wont_fix'),
      ],
      nextCursor: null,
    }),
  )

  renderList()

  await screen.findByText('My message 1')
  for (const status of FEEDBACK_STATUSES) {
    expect(
      screen.getByText(i18n.t(`feedback.mine.statuses.${status}`)),
    ).toBeVisible()
  }
  expect(
    screen.getAllByText(i18n.t('feedback.categories.suggestion')),
  ).toHaveLength(4)
})

test('says when nothing was sent', async () => {
  fetchMock.mockResolvedValue(Response.json({ items: [], nextCursor: null }))

  renderList()

  expect(await screen.findByText(i18n.t('feedback.mine.empty'))).toBeVisible()
})

test('keeps the pages and offers a retry when the next page fails', async () => {
  let calls = 0
  fetchMock.mockImplementation(() => {
    calls += 1
    return Promise.resolve(
      calls === 1
        ? Response.json({ items: [mine(1, 'new')], nextCursor: 'next' })
        : Response.json({}, { status: 503 }),
    )
  })

  renderList()
  await screen.findByText('My message 1')
  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('feedback.mine.loadMore') }),
  )

  expect(
    await screen.findByText(i18n.t('feedback.mine.moreError')),
  ).toBeVisible()
  expect(screen.getByText('My message 1')).toBeVisible()
  expect(
    screen.getByRole('button', { name: i18n.t('common.retry') }),
  ).toBeVisible()
})

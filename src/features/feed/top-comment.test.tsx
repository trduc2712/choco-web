import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ToastProvider } from '@/components/toast/toast-provider'

import { RecommendedFeed } from './recommended-feed'

vi.mock('@clerk/react', () => ({
  useUser: () => ({ user: null }),
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'user_ada',
    sessionId: 'sess_1',
    getToken: async () => 'test-token',
  }),
}))

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function post(id: string, topComment: unknown) {
  return {
    id,
    authorId: '00000000-0000-0000-0000-00000000000b',
    author: { username: 'bob', displayName: 'Bob Builder', avatarUrl: null },
    content: `content ${id}`,
    likeCount: 0,
    isLikedByMe: false,
    commentCount: topComment ? 3 : 0,
    createdAt: '2026-01-01T00:00:00+00:00',
    modifiedAt: '2026-01-01T00:00:00+00:00',
    topComment,
  }
}

const TOP_COMMENT = {
  id: 'c1',
  author: {
    username: 'carol',
    displayName: 'Carol Commenter',
    avatarUrl: null,
  },
  content: 'the most discussed comment',
}

function renderFeed(items: unknown[]) {
  fetchMock.mockImplementation((input) => {
    const path = String(input).replace(/^.*\/api\/v1/, '')
    if (path.startsWith('/me/feed/')) {
      return Promise.resolve(Response.json({ items, nextCursor: null }))
    }
    return Promise.resolve(Response.json({}, { status: 404 }))
  })
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ToastProvider>
        <MemoryRouter>
          <RecommendedFeed />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

test('previews the top comment under a post', async () => {
  renderFeed([post('p1', TOP_COMMENT)])

  expect(await screen.findByText('the most discussed comment')).toBeVisible()
  expect(screen.getByRole('link', { name: 'Carol Commenter' })).toHaveAttribute(
    'href',
    '/@carol',
  )
})

test('shows nothing extra when the post has no top comment', async () => {
  renderFeed([post('p0', null), post('p1', TOP_COMMENT)])

  const articles = await screen.findAllByRole('article')
  expect(articles).toHaveLength(2)
  expect(within(articles[0]!).queryByText('Carol Commenter')).toBeNull()
  expect(within(articles[1]!).getByText('Carol Commenter')).toBeVisible()
})

test('does not request comments for the preview', async () => {
  renderFeed([post('p1', TOP_COMMENT)])

  await screen.findByText('the most discussed comment')
  const paths = fetchMock.mock.calls.map(([input]) => String(input))
  expect(paths.some((path) => path.includes('/comments'))).toBe(false)
})

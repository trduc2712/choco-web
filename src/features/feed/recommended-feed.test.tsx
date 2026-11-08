import {
  type InfiniteData,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { i18n } from '@/i18n/i18n'
import { ApiSessionEndedContext } from '@/lib/api-session'

import {
  invalidateFeeds,
  recommendedFeedQueryOptions,
} from './following-feed-api'
import { RecommendedFeed } from './recommended-feed'

vi.mock('@clerk/react', () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'user_ada',
    sessionId: 'sess_1',
    getToken: async () => 'test-token',
  }),
}))

const BOB = '00000000-0000-0000-0000-00000000000b'
const GONE = '00000000-0000-0000-0000-00000000000c'

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function post(id: string, authorId: string, extra = {}) {
  return {
    id,
    authorId,
    content: `content ${id}`,
    createdAt: '2026-01-01T00:00:00+00:00',
    modifiedAt: '2026-01-01T00:00:00+00:00',
    ...extra,
  }
}

function user(id: string, extra = {}) {
  return {
    id,
    username: id === BOB ? 'bob' : 'ada',
    displayName: id === BOB ? 'Bob Builder' : 'Ada Lovelace',
    avatarUrl: null,
    followingCount: 2,
    ...extra,
  }
}

type Routes = Record<string, () => Response>

// Routes are matched on the path (and query) following /api/v1.
function route(routes: Routes) {
  fetchMock.mockImplementation((input) => {
    const url = String(input).replace(/^.*\/api\/v1/, '')
    const handler = routes[url]
    return Promise.resolve(
      handler ? handler() : Response.json({}, { status: 404 }),
    )
  })
}

function renderFeed(onSessionEnded = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 60_000 } },
  })
  render(
    <QueryClientProvider client={client}>
      <ApiSessionEndedContext.Provider value={onSessionEnded}>
        <MemoryRouter>
          <RecommendedFeed />
        </MemoryRouter>
      </ApiSessionEndedContext.Provider>
    </QueryClientProvider>,
  )
  return { client, onSessionEnded }
}

test('shows the first page with authors, then the next page via the cursor', async () => {
  route({
    '/me/feed/recommended?limit=20': () =>
      Response.json({
        items: [post('p1', BOB), post('p2', GONE)],
        nextCursor: 'abc==',
      }),
    '/me/feed/recommended?limit=20&cursor=abc%3D%3D': () =>
      Response.json({ items: [post('p3', BOB)], nextCursor: null }),
    [`/users/${BOB}`]: () => Response.json(user(BOB)),
  })
  renderFeed()

  expect(await screen.findAllByRole('article')).toHaveLength(2)
  expect(await screen.findByText('Bob Builder')).toBeVisible()
  expect(await screen.findByText(i18n.t('feed.authorMissing'))).toBeVisible()
  expect(screen.getByText('content p2')).toBeVisible()

  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('posts.loadMore') }),
  )
  expect(await screen.findByText('content p3')).toBeVisible()
  expect(
    screen.queryByRole('button', { name: i18n.t('posts.loadMore') }),
  ).not.toBeInTheDocument()
  // Bob's profile is fetched once for both of his posts.
  const userCalls = fetchMock.mock.calls.filter(([url]) =>
    String(url).endsWith(`/users/${BOB}`),
  )
  expect(userCalls).toHaveLength(1)
})

test('says there are no posts yet when the page is empty', async () => {
  route({
    '/me/feed/recommended?limit=20': () =>
      Response.json({ items: [], nextCursor: null }),
  })
  renderFeed()

  expect(await screen.findByText(i18n.t('feed.recommendedEmpty'))).toBeVisible()
})

test('offers a retry after a failed load', async () => {
  let fail = true
  route({
    '/me/feed/recommended?limit=20': () =>
      fail
        ? Response.json({}, { status: 500 })
        : Response.json({ items: [post('p1', BOB)], nextCursor: null }),
    [`/users/${BOB}`]: () => Response.json(user(BOB)),
  })
  renderFeed()

  expect(await screen.findByRole('alert')).toHaveTextContent(
    i18n.t('feed.loadError'),
  )
  fail = false
  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('common.retry') }),
  )
  expect(await screen.findByText('content p1')).toBeVisible()
})

test('treats a 401 as an ended session', async () => {
  route({
    '/me/feed/recommended?limit=20': () =>
      Response.json({ code: 'User.Deleted' }, { status: 401 }),
  })
  const { onSessionEnded } = renderFeed()

  await waitFor(() => expect(onSessionEnded).toHaveBeenCalledWith('sess_1'))
  expect(await screen.findByRole('alert')).toBeVisible()
})

test('refresh refetches from the first page only', async () => {
  let items = [post('p1', BOB)]
  route({
    '/me/feed/recommended?limit=20': () =>
      Response.json({ items, nextCursor: 'next' }),
    '/me/feed/recommended?limit=20&cursor=next': () =>
      Response.json({ items: [post('p9', BOB)], nextCursor: null }),
    [`/users/${BOB}`]: () => Response.json(user(BOB)),
  })
  const { client } = renderFeed()
  await userEvent.click(
    await screen.findByRole('button', { name: i18n.t('posts.loadMore') }),
  )
  expect(await screen.findByText('content p9')).toBeVisible()

  items = [post('p0', BOB), post('p1', BOB)]
  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('feed.refresh') }),
  )
  expect(await screen.findByText('content p0')).toBeVisible()
  await waitFor(() =>
    expect(screen.queryByText('content p9')).not.toBeInTheDocument(),
  )
  const cached = client.getQueryData<InfiniteData<unknown>>(
    recommendedFeedQueryOptions(vi.fn(), 'user_ada', 20).queryKey,
  )
  expect(cached?.pages).toHaveLength(1)
})

test('invalidating after a follow change refetches the recommended feed', async () => {
  let items = [post('p1', BOB)]
  route({
    '/me/feed/recommended?limit=20': () =>
      Response.json({ items, nextCursor: null }),
    [`/users/${BOB}`]: () => Response.json(user(BOB)),
  })
  const { client } = renderFeed()
  expect(await screen.findByText('content p1')).toBeVisible()

  items = [post('p1', BOB), post('p0', BOB)]
  invalidateFeeds(client, 'user_ada')
  expect(await screen.findByText('content p0')).toBeVisible()
})

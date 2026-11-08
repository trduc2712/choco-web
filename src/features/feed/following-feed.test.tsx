import {
  type InfiniteData,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { USER_SEARCH_PATH } from '@/constants/routes'
import { i18n } from '@/i18n/i18n'
import { ApiSessionEndedContext } from '@/lib/api-session'

import { FollowingFeed } from './following-feed'
import { followingFeedQueryOptions } from './following-feed-api'
import { invalidateFollowingFeed } from './following-feed-api'

vi.mock('@clerk/react', () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'user_ada',
    sessionId: 'sess_1',
    getToken: async () => 'test-token',
  }),
}))

const ME = '00000000-0000-0000-0000-00000000000a'
const BOB = '00000000-0000-0000-0000-00000000000b'

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
    author: {
      username: authorId === BOB ? 'bob' : 'ada',
      displayName: authorId === BOB ? 'Bob Builder' : 'Ada Lovelace',
      avatarUrl: null,
    },
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
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <ApiSessionEndedContext.Provider value={onSessionEnded}>
        <MemoryRouter>
          <FollowingFeed />
        </MemoryRouter>
      </ApiSessionEndedContext.Provider>
    </QueryClientProvider>,
  )
  return { client, onSessionEnded }
}

test('shows the first page with authors, then the next page via the cursor', async () => {
  route({
    '/me/feed/following?limit=20': () =>
      Response.json({
        items: [
          post('p1', BOB),
          post('p2', BOB, { modifiedAt: '2026-01-02T00:00:00+00:00' }),
          post('p3', ME),
        ],
        nextCursor: 'abc==',
      }),
    '/me/feed/following?limit=20&cursor=abc%3D%3D': () =>
      Response.json({ items: [post('p4', BOB)], nextCursor: null }),
  })
  renderFeed()

  expect(await screen.findAllByRole('article')).toHaveLength(3)
  expect(await screen.findAllByText('Bob Builder')).toHaveLength(2)
  expect(screen.getByText('Ada Lovelace')).toBeVisible()
  expect(screen.getAllByText('@bob')).toHaveLength(2)
  expect(screen.getByText('content p3')).toBeVisible()
  expect(screen.getAllByText(i18n.t('posts.edited'))).toHaveLength(1)
  // Authors come with each post, so no per-author request is made.
  expect(
    fetchMock.mock.calls.filter(([url]) => String(url).includes('/users/')),
  ).toHaveLength(0)

  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('posts.loadMore') }),
  )
  expect(await screen.findByText('content p4')).toBeVisible()
  expect(
    screen.queryByRole('button', { name: i18n.t('posts.loadMore') }),
  ).not.toBeInTheDocument()
})

test('invites people with no follows to search', async () => {
  route({
    '/me/feed/following?limit=20': () =>
      Response.json({ items: [], nextCursor: null }),
    '/me': () => Response.json({ id: ME }),
    [`/users/${ME}`]: () => Response.json(user(ME, { followingCount: 0 })),
  })
  renderFeed()

  expect(await screen.findByText(i18n.t('feed.noFollowing'))).toBeVisible()
  expect(
    screen.getByRole('link', { name: i18n.t('feed.findPeople') }),
  ).toHaveAttribute('href', USER_SEARCH_PATH)
})

test('says there are no new posts when the viewer follows people', async () => {
  route({
    '/me/feed/following?limit=20': () =>
      Response.json({ items: [], nextCursor: null }),
    '/me': () => Response.json({ id: ME }),
    [`/users/${ME}`]: () => Response.json(user(ME, { followingCount: 3 })),
  })
  renderFeed()

  expect(await screen.findByText(i18n.t('feed.empty'))).toBeVisible()
  expect(screen.queryByText(i18n.t('feed.noFollowing'))).not.toBeInTheDocument()
})

test('offers a retry after a failed load', async () => {
  let fail = true
  route({
    '/me/feed/following?limit=20': () =>
      fail
        ? Response.json({}, { status: 500 })
        : Response.json({ items: [post('p1', BOB)], nextCursor: null }),
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
    '/me/feed/following?limit=20': () =>
      Response.json({ code: 'User.Deleted' }, { status: 401 }),
  })
  const { onSessionEnded } = renderFeed()

  await waitFor(() => expect(onSessionEnded).toHaveBeenCalledWith('sess_1'))
  expect(await screen.findByRole('alert')).toBeVisible()
})

test('invalidating after a follow change refetches the feed', async () => {
  let items = [post('p1', BOB)]
  route({
    '/me/feed/following?limit=20': () =>
      Response.json({ items, nextCursor: null }),
  })
  const { client } = renderFeed()
  expect(await screen.findByText('content p1')).toBeVisible()

  items = [post('p1', BOB), post('p0', BOB)]
  invalidateFollowingFeed(client, 'user_ada')
  expect(await screen.findByText('content p0')).toBeVisible()
  const cached = client.getQueryData<InfiniteData<unknown>>(
    followingFeedQueryOptions(vi.fn(), 'user_ada', 20).queryKey,
  )
  expect(cached?.pages).toHaveLength(1)
})

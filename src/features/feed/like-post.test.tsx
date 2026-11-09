import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ToastProvider } from '@/components/toast/toast-provider'
import { i18n } from '@/i18n/i18n'
import { ApiSessionEndedContext } from '@/lib/api-session'

import { FollowingFeed } from './following-feed'
import { RecommendedFeed } from './recommended-feed'

vi.mock('@clerk/react', () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'user_ada',
    sessionId: 'sess_1',
    // A refresh finds no session, so the API client reports it as ended.
    getToken: async (options?: { skipCache?: boolean }) =>
      options?.skipCache ? null : 'test-token',
  }),
}))

const BOB = '00000000-0000-0000-0000-00000000000b'
const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function post(id: string, extra = {}) {
  return {
    id,
    authorId: BOB,
    author: { username: 'bob', displayName: 'Bob Builder', avatarUrl: null },
    content: `content ${id}`,
    likeCount: 3,
    isLikedByMe: false,
    createdAt: '2026-01-01T00:00:00+00:00',
    modifiedAt: '2026-01-01T00:00:00+00:00',
    ...extra,
  }
}

type Handler = () => Response | Promise<Response>

// Both feeds list the same posts. Like requests go to `likeHandler`.
function setup(likeHandler: Handler) {
  const likeCalls: { method?: string; url: string }[] = []
  fetchMock.mockImplementation((input, init) => {
    const url = String(input).replace(/^.*\/api\/v1/, '')
    if (url.includes('/like')) {
      likeCalls.push({ method: init?.method, url })
      return Promise.resolve(likeHandler())
    }
    if (url.startsWith('/me/feed/')) {
      return Promise.resolve(
        Response.json({
          items: [post('p1'), post('p2', { likeCount: 1, isLikedByMe: true })],
          nextCursor: null,
        }),
      )
    }
    return Promise.resolve(Response.json({}, { status: 404 }))
  })
  const onSessionEnded = vi.fn()
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <ApiSessionEndedContext.Provider value={onSessionEnded}>
        <ToastProvider>
          <MemoryRouter>
            <section aria-label="recommended">
              <RecommendedFeed />
            </section>
            <section aria-label="following">
              <FollowingFeed />
            </section>
          </MemoryRouter>
        </ToastProvider>
      </ApiSessionEndedContext.Provider>
    </QueryClientProvider>,
  )
  return { likeCalls, onSessionEnded }
}

const likeName = (likes: number) => i18n.t('posts.like', { likes })

async function findLike(feed: string, likes: number) {
  const region = await screen.findByRole('region', { name: feed })
  return within(region).findAllByRole('button', { name: likeName(likes) })
}

test('shows the like state and count of each post', async () => {
  setup(() => new Response(null, { status: 204 }))

  const [liked] = await findLike('recommended', 1)
  const [notLiked] = await findLike('recommended', 3)
  expect(liked).toHaveAttribute('aria-pressed', 'true')
  expect(notLiked).toHaveAttribute('aria-pressed', 'false')
})

test('liking updates the post optimistically in every list', async () => {
  let respond!: (response: Response) => void
  const { likeCalls } = setup(
    () => new Promise<Response>((resolve) => (respond = resolve)),
  )

  const [button] = await findLike('recommended', 3)
  await findLike('following', 3)
  await userEvent.click(button)

  // The new state shows before the server answers, in both feeds.
  expect(await findLike('recommended', 4)).toHaveLength(1)
  expect(await findLike('following', 4)).toHaveLength(1)
  expect((await findLike('recommended', 4))[0]).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  // Further clicks on the same post are ignored while the request is running.
  await userEvent.click((await findLike('recommended', 4))[0])
  expect(likeCalls).toEqual([{ method: 'PUT', url: '/posts/p1/like' }])

  respond(new Response(null, { status: 204 }))
  await waitFor(() =>
    expect(screen.getAllByRole('button', { name: likeName(4) })).toHaveLength(
      2,
    ),
  )
  expect(likeCalls).toHaveLength(1)
})

test('unliking sends DELETE and lowers the count', async () => {
  const { likeCalls } = setup(() => new Response(null, { status: 204 }))

  const [button] = await findLike('following', 1)
  await userEvent.click(button)

  expect(await findLike('following', 0)).toHaveLength(1)
  expect((await findLike('recommended', 0))[0]).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  expect(likeCalls).toEqual([{ method: 'DELETE', url: '/posts/p2/like' }])
})

test('undoes the change and reports a failed request', async () => {
  setup(() => Response.json({}, { status: 500 }))

  const [button] = await findLike('recommended', 3)
  await userEvent.click(button)

  expect(await screen.findByText(i18n.t('posts.likeError'))).toBeVisible()
  expect(await findLike('recommended', 3)).toHaveLength(1)
  expect(await findLike('following', 3)).toHaveLength(1)
  expect(screen.queryByRole('button', { name: likeName(4) })).toBeNull()
})

test('removes a post that no longer exists and says so', async () => {
  setup(() => Response.json({ code: 'Post.NotFound' }, { status: 404 }))

  const [button] = await findLike('recommended', 3)
  await userEvent.click(button)

  expect(await screen.findByText(i18n.t('posts.notFound'))).toBeVisible()
  await waitFor(() => expect(screen.queryByText('content p1')).toBeNull())
  expect(screen.getAllByText('content p2')).toHaveLength(2)
})

test('treats a 401 as an ended session and undoes the change', async () => {
  const { onSessionEnded } = setup(() =>
    Response.json({ code: 'User.Deleted' }, { status: 401 }),
  )

  const [button] = await findLike('recommended', 3)
  await userEvent.click(button)

  await waitFor(() => expect(onSessionEnded).toHaveBeenCalledWith('sess_1'))
  expect(await findLike('recommended', 3)).toHaveLength(1)
})

test('comment and share show a count of 0 and say they are unavailable', async () => {
  const { likeCalls } = setup(() => new Response(null, { status: 204 }))

  const [comment] = await within(
    await screen.findByRole('region', { name: 'recommended' }),
  ).findAllByRole('button', { name: i18n.t('posts.comment', { comments: 0 }) })
  expect(comment).toHaveTextContent('0')
  await userEvent.click(comment)

  expect(await screen.findByText(i18n.t('posts.unavailable'))).toBeVisible()
  expect(likeCalls).toHaveLength(0)
})

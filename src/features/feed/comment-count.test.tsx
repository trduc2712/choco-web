import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ToastProvider } from '@/components/toast/toast-provider'
import { PostDetailDialog } from '@/features/post-detail'
import { i18n } from '@/i18n/i18n'

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

const ADA = '00000000-0000-0000-0000-00000000000a'
const BOB = '00000000-0000-0000-0000-00000000000b'
const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function post(id: string, commentCount: number) {
  return {
    id,
    authorId: BOB,
    author: { username: 'bob', displayName: 'Bob Builder', avatarUrl: null },
    content: `content ${id}`,
    likeCount: 0,
    isLikedByMe: false,
    commentCount,
    createdAt: '2026-01-01T00:00:00+00:00',
    modifiedAt: '2026-01-01T00:00:00+00:00',
  }
}

function comment(id: string, postId: string, authorId = BOB) {
  return {
    id,
    postId,
    authorId,
    author: { username: 'bob', displayName: 'Bob Builder', avatarUrl: null },
    content: `comment ${id}`,
    createdAt: '2026-01-01T00:00:00+00:00',
  }
}

type Routes = Record<string, () => Response>

// Keys are "METHOD /path" following /api/v1. The feed lists p0 (no comments)
// and p1 (two comments); the detail page below it shows p1 as well.
function setup(routes: Routes = {}) {
  fetchMock.mockImplementation((input, init) => {
    const path = String(input).replace(/^.*\/api\/v1/, '')
    const key = `${init?.method ?? 'GET'} ${path}`
    const handler = routes[key]
    if (handler) return Promise.resolve(handler())
    if (key === 'GET /me') return Promise.resolve(Response.json({ id: ADA }))
    if (key === 'GET /posts/p1')
      return Promise.resolve(Response.json(post('p1', 2)))
    if (path.startsWith('/me/feed/')) {
      return Promise.resolve(
        Response.json({
          items: [post('p0', 0), post('p1', 2)],
          nextCursor: null,
        }),
      )
    }
    return Promise.resolve(Response.json({}, { status: 404 }))
  })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter>
          <section aria-label="feed">
            <RecommendedFeed />
          </section>
          <section aria-label="detail">
            <PostDetailDialog postId="p1" onClose={() => undefined} />
          </section>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

const name = (comments: number) => i18n.t('posts.comment', { comments })

function findButtons(region: string, comments: number) {
  return screen
    .findByRole('region', { name: region })
    .then((el) => within(el).findAllByRole('button', { name: name(comments) }))
}

const LIST = 'GET /posts/p1/comments'

test('shows the comment count of each post, including 0', async () => {
  setup()

  const [none] = await findButtons('feed', 0)
  const [two] = await findButtons('feed', 2)
  expect(none).toHaveTextContent('0')
  expect(two).toHaveTextContent('2')
})

test('adding a comment raises the count wherever the post shows', async () => {
  setup({
    [LIST]: () =>
      Response.json({
        items: [comment('c1', 'p1'), comment('c2', 'p1')],
        nextCursor: null,
      }),
    'POST /posts/p1/comments': () =>
      Response.json(comment('c3', 'p1', ADA), { status: 201 }),
  })

  await screen.findByText('comment c2')
  await userEvent.type(
    screen.getByRole('textbox', { name: i18n.t('comments.label') }),
    'third',
  )
  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('comments.submit') }),
  )

  expect(await findButtons('feed', 3)).toHaveLength(1)
  expect(await findButtons('detail', 3)).toHaveLength(1)
})

test('deleting a comment lowers the count wherever the post shows', async () => {
  setup({
    [LIST]: () =>
      Response.json({
        items: [comment('c1', 'p1'), comment('c2', 'p1', ADA)],
        nextCursor: null,
      }),
    'DELETE /comments/c2': () => new Response(null, { status: 204 }),
  })

  await userEvent.click(
    await screen.findByRole('button', { name: i18n.t('comments.actions') }),
  )
  await userEvent.click(
    await screen.findByRole('menuitem', { name: i18n.t('comments.delete') }),
  )
  await userEvent.click(
    within(await screen.findByRole('alertdialog')).getByRole('button', {
      name: i18n.t('comments.delete'),
    }),
  )

  expect(await findButtons('feed', 1)).toHaveLength(1)
  expect(await findButtons('detail', 1)).toHaveLength(1)
})

test('trusts the loaded list over a stale count', async () => {
  setup({
    [LIST]: () =>
      Response.json({ items: [comment('c1', 'p1')], nextCursor: null }),
  })

  expect(await findButtons('feed', 1)).toHaveLength(1)
  expect(await findButtons('detail', 1)).toHaveLength(1)
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('the count never goes below 0', async () => {
  // The post says 0 but its only comment is the viewer's own.
  setup({
    'GET /posts/p1': () => Response.json(post('p1', 0)),
    [LIST]: () =>
      Response.json({ items: [comment('c1', 'p1', ADA)], nextCursor: null }),
    'DELETE /comments/c1': () => new Response(null, { status: 204 }),
  })

  await userEvent.click(
    await screen.findByRole('button', { name: i18n.t('comments.actions') }),
  )
  await userEvent.click(
    await screen.findByRole('menuitem', { name: i18n.t('comments.delete') }),
  )
  await userEvent.click(
    within(await screen.findByRole('alertdialog')).getByRole('button', {
      name: i18n.t('comments.delete'),
    }),
  )

  expect(await findButtons('detail', 0)).toHaveLength(1)
})

test('the comment button is pressed only on the post’s own page', async () => {
  setup({
    [LIST]: () =>
      Response.json({
        items: [comment('c1', 'p1'), comment('c2', 'p1')],
        nextCursor: null,
      }),
  })

  const [button] = await findButtons('feed', 2)
  expect(button).toHaveAttribute('aria-pressed', 'false')
  const [onPage] = await findButtons('detail', 2)
  expect(onPage).toHaveAttribute('aria-pressed', 'true')
})

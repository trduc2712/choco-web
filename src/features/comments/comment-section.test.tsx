import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ToastProvider } from '@/components/toast/toast-provider'
import { SuspensionProvider } from '@/features/current-user'
import { i18n } from '@/i18n/i18n'
import { ApiSessionEndedContext } from '@/lib/api-session'

import { CommentForm } from './comment-form'
import { CommentSection } from './comment-section'
import type { Reaction } from './comments-api'

vi.mock('@clerk/react', () => ({
  useUser: () => ({ user: null }),
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'user_ada',
    sessionId: 'sess_1',
    getToken: async (options?: { skipCache?: boolean }) =>
      options?.skipCache ? null : 'test-token',
  }),
}))

const ADA = '00000000-0000-0000-0000-00000000000a'
const BOB = '00000000-0000-0000-0000-00000000000b'
const POST = 'post-1'

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function comment(
  id: string,
  authorId = BOB,
  content = `comment ${id}`,
  extra: Record<string, unknown> = {},
) {
  return {
    id,
    postId: POST,
    parentId: null,
    replyCount: 0,
    isDeleted: false,
    likeCount: 0,
    dislikeCount: 0,
    myReaction: null,
    authorId,
    author: {
      username: authorId === BOB ? 'bob' : 'ada',
      displayName: authorId === BOB ? 'Bob Builder' : 'Ada Lovelace',
      avatarUrl: null,
    },
    content,
    createdAt: '2026-01-01T00:00:00+00:00',
    ...extra,
  }
}

const placeholder = (id: string, replyCount: number) =>
  comment(id, BOB, 'x', {
    authorId: null,
    author: null,
    content: null,
    isDeleted: true,
    replyCount,
  })

type Handler = (init?: RequestInit) => Response | Promise<Response>
type Routes = Record<string, Handler>

// Keys are "METHOD /path?query" following /api/v1.
function route(routes: Routes) {
  fetchMock.mockImplementation((input, init) => {
    const path = String(input).replace(/^.*\/api\/v1/, '')
    const key = `${init?.method ?? 'GET'} ${path}`
    const handler = routes[key]
    return Promise.resolve(
      handler ? handler(init) : Response.json({}, { status: 404 }),
    )
  })
}

const ME = { 'GET /me': () => Response.json({ id: ADA }) }
const LIST = `GET /posts/${POST}/comments`

async function renderOpen(
  onPostGone = vi.fn(),
  onSessionEnded = vi.fn(),
  commentId?: string,
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 60_000 } },
  })
  render(
    <QueryClientProvider client={client}>
      <ApiSessionEndedContext.Provider value={onSessionEnded}>
        <ToastProvider>
          <SuspensionProvider>
            <MemoryRouter>
              <CommentForm postId={POST} onPostGone={onPostGone} />
              <CommentSection
                postId={POST}
                onPostGone={onPostGone}
                commentId={commentId}
              />
            </MemoryRouter>
          </SuspensionProvider>
        </ToastProvider>
      </ApiSessionEndedContext.Provider>
    </QueryClientProvider>,
  )
  return { onPostGone, onSessionEnded }
}

const box = () =>
  screen.getByRole('textbox', { name: i18n.t('comments.label') })
const submit = () =>
  screen.getByRole('button', { name: i18n.t('comments.submit') })

test('shows the first page, then the next page via the cursor', async () => {
  route({
    ...ME,
    [LIST]: () =>
      Response.json({
        items: [comment('c1'), comment('c2')],
        nextCursor: 'abc==',
      }),
    [`${LIST}?cursor=abc%3D%3D`]: () =>
      Response.json({ items: [comment('c3')], nextCursor: null }),
  })
  await renderOpen()

  expect(await screen.findByText('comment c2')).toBeVisible()
  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('comments.loadMore') }),
  )
  expect(await screen.findByText('comment c3')).toBeVisible()
  expect(
    screen.queryByRole('button', { name: i18n.t('comments.loadMore') }),
  ).not.toBeInTheDocument()
})

test('says there are no comments yet', async () => {
  route({ ...ME, [LIST]: () => Response.json({ items: [], nextCursor: null }) })
  await renderOpen()

  expect(await screen.findByText(i18n.t('comments.empty'))).toBeVisible()
})

test('offers a retry after a failed load', async () => {
  let fail = true
  route({
    ...ME,
    [LIST]: () =>
      fail
        ? Response.json({}, { status: 500 })
        : Response.json({ items: [comment('c1')], nextCursor: null }),
  })
  await renderOpen()

  expect(await screen.findByRole('alert')).toHaveTextContent(
    i18n.t('comments.loadError'),
  )
  fail = false
  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('common.retry') }),
  )
  expect(await screen.findByText('comment c1')).toBeVisible()
})

test('treats a 401 as an ended session', async () => {
  route({
    ...ME,
    [LIST]: () => Response.json({ code: 'User.Deleted' }, { status: 401 }),
  })
  const { onSessionEnded } = await renderOpen()

  await waitFor(() => expect(onSessionEnded).toHaveBeenCalledWith('sess_1'))
})

test('reports a missing post when the list returns 404', async () => {
  route({
    ...ME,
    [LIST]: () => Response.json({ code: 'Post.NotFound' }, { status: 404 }),
  })
  const { onPostGone } = await renderOpen()

  await waitFor(() => expect(onPostGone).toHaveBeenCalled())
})

test('adds a comment to the end of the list and clears the box', async () => {
  route({
    ...ME,
    [LIST]: () => Response.json({ items: [comment('c1')], nextCursor: null }),
    [`POST /posts/${POST}/comments`]: (init) => {
      expect(JSON.parse(String(init?.body))).toEqual({ content: 'hello' })
      return Response.json(comment('c2', ADA, 'hello'), { status: 201 })
    },
  })
  await renderOpen()
  await screen.findByText('comment c1')

  expect(submit()).toBeDisabled()
  await userEvent.type(box(), '  hello  ')
  await userEvent.click(submit())

  const items = await screen.findAllByRole('listitem')
  expect(items).toHaveLength(2)
  expect(items[1]).toHaveTextContent('hello')
  expect(box()).toHaveValue('')
  // The list was not refetched.
  expect(
    fetchMock.mock.calls.filter(
      ([url, init]) =>
        String(url).endsWith(`/posts/${POST}/comments`) && !init?.method,
    ),
  ).toHaveLength(1)
})

test('disables sending when the comment is over the limit', async () => {
  route({ ...ME, [LIST]: () => Response.json({ items: [], nextCursor: null }) })
  await renderOpen()
  await screen.findByText(i18n.t('comments.empty'))

  await userEvent.click(box())
  await userEvent.paste('a'.repeat(501))
  expect(submit()).toBeDisabled()
  expect(
    screen.getByText(i18n.t('comments.tooLong', { limit: 500 })),
  ).toBeVisible()
})

test('shows a 400 on the field', async () => {
  route({
    ...ME,
    [LIST]: () => Response.json({ items: [], nextCursor: null }),
    [`POST /posts/${POST}/comments`]: () =>
      Response.json(
        {
          errors: { content: ['Content is too long.'] },
          errorCodes: { content: ['Comment.Content.TooLong'] },
        },
        { status: 400 },
      ),
  })
  await renderOpen()
  await screen.findByText(i18n.t('comments.empty'))

  await userEvent.type(box(), 'hi')
  await userEvent.click(submit())

  expect(
    await screen.findByText(i18n.t('apiErrors.codes.Comment.Content.TooLong')),
  ).toBeVisible()
  expect(screen.queryByText('Content is too long.')).not.toBeInTheDocument()
  expect(box()).toHaveValue('hi')
})

test('shows the generic block message when adding returns 403', async () => {
  let attempts = 0
  route({
    ...ME,
    [LIST]: () => Response.json({ items: [], nextCursor: null }),
    [`POST /posts/${POST}/comments`]: () => {
      attempts += 1
      return Response.json({ code: 'UserBlock.Blocked' }, { status: 403 })
    },
  })
  await renderOpen()
  await screen.findByText(i18n.t('comments.empty'))

  await userEvent.type(box(), 'hi')
  await userEvent.click(submit())

  expect(await screen.findByRole('alert')).toHaveTextContent(
    i18n.t('blocks.actionBlocked'),
  )
  expect(box()).toHaveValue('hi')
  expect(screen.getByText(i18n.t('comments.empty'))).toBeVisible()
  expect(attempts).toBe(1)
})

test('reports a missing post when adding returns 404', async () => {
  route({
    ...ME,
    [LIST]: () => Response.json({ items: [], nextCursor: null }),
    [`POST /posts/${POST}/comments`]: () =>
      Response.json({ code: 'Post.NotFound' }, { status: 404 }),
  })
  const { onPostGone } = await renderOpen()
  await screen.findByText(i18n.t('comments.empty'))

  await userEvent.type(box(), 'hi')
  await userEvent.click(submit())

  await waitFor(() => expect(onPostGone).toHaveBeenCalled())
})

test('only offers delete on the viewer’s own comments', async () => {
  route({
    ...ME,
    [LIST]: () =>
      Response.json({
        items: [comment('c1', BOB), comment('c2', ADA)],
        nextCursor: null,
      }),
  })
  await renderOpen()

  await screen.findByText('comment c2')
  expect(
    await screen.findAllByRole('button', { name: i18n.t('comments.actions') }),
  ).toHaveLength(1)
})

async function openDelete() {
  await renderOpen()
  await screen.findByText('comment c2')
  await userEvent.click(
    await screen.findByRole('button', { name: i18n.t('comments.actions') }),
  )
  await userEvent.click(
    await screen.findByRole('menuitem', { name: i18n.t('comments.delete') }),
  )
  return within(await screen.findByRole('alertdialog')).getByRole('button', {
    name: i18n.t('comments.delete'),
  })
}

const OWN = {
  ...ME,
  [LIST]: () =>
    Response.json({
      items: [comment('c1'), comment('c2', ADA)],
      nextCursor: null,
    }),
}

test('removes a comment after confirming the delete', async () => {
  route({
    ...OWN,
    'DELETE /comments/c2': () => new Response(null, { status: 204 }),
  })
  const confirm = await openDelete()
  await userEvent.click(confirm)

  await waitFor(() =>
    expect(screen.queryByText('comment c2')).not.toBeInTheDocument(),
  )
  expect(screen.getByText('comment c1')).toBeVisible()
})

test('removes the comment when the delete returns 404', async () => {
  route({
    ...OWN,
    'DELETE /comments/c2': () =>
      Response.json({ code: 'Comment.NotFound' }, { status: 404 }),
  })
  await userEvent.click(await openDelete())

  await waitFor(() =>
    expect(screen.queryByText('comment c2')).not.toBeInTheDocument(),
  )
})

test('says there is no permission when the delete returns 403', async () => {
  route({
    ...OWN,
    'DELETE /comments/c2': () =>
      Response.json({ code: 'Comment.NotAuthor' }, { status: 403 }),
  })
  await userEvent.click(await openDelete())

  expect(
    await screen.findByText(i18n.t('comments.deleteForbidden')),
  ).toBeVisible()
  expect(screen.getByText('comment c2')).toBeVisible()
})

const viewReplies = (count: number) =>
  screen.getByRole('button', {
    name: i18n.t('comments.viewReplies', { count }),
  })

test('loads replies one level at a time and pages through them', async () => {
  route({
    ...ME,
    [LIST]: () =>
      Response.json({
        items: [comment('c1', BOB, 'comment c1', { replyCount: 2 })],
        nextCursor: null,
      }),
    'GET /comments/c1/replies': () =>
      Response.json({
        items: [
          comment('r1', BOB, 'reply r1', { parentId: 'c1', replyCount: 1 }),
        ],
        nextCursor: 'next',
      }),
    'GET /comments/c1/replies?cursor=next': () =>
      Response.json({
        items: [comment('r2', BOB, 'reply r2', { parentId: 'c1' })],
        nextCursor: null,
      }),
    'GET /comments/r1/replies': () =>
      Response.json({
        items: [comment('r3', BOB, 'reply r3', { parentId: 'r1' })],
        nextCursor: null,
      }),
  })
  await renderOpen()
  await screen.findByText('comment c1')
  expect(screen.queryByText('reply r1')).not.toBeInTheDocument()

  await userEvent.click(viewReplies(2))
  expect(await screen.findByText('reply r1')).toBeVisible()
  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('comments.loadMoreReplies') }),
  )
  expect(await screen.findByText('reply r2')).toBeVisible()

  await userEvent.click(viewReplies(1))
  expect(await screen.findByText('reply r3')).toBeVisible()
})

test('shows a placeholder whose replies can still be opened', async () => {
  route({
    ...ME,
    [LIST]: () =>
      Response.json({ items: [placeholder('c1', 1)], nextCursor: null }),
    'GET /comments/c1/replies': () =>
      Response.json({
        items: [comment('r1', BOB, 'reply r1', { parentId: 'c1' })],
        nextCursor: null,
      }),
  })
  await renderOpen()

  expect(await screen.findByText(i18n.t('comments.unavailable'))).toBeVisible()
  expect(
    screen.queryByRole('button', { name: i18n.t('comments.reply') }),
  ).not.toBeInTheDocument()
  await userEvent.click(viewReplies(1))
  expect(await screen.findByText('reply r1')).toBeVisible()
})

async function replyTo(text: string) {
  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('comments.reply') }),
  )
  await userEvent.type(
    screen.getByRole('textbox', { name: i18n.t('comments.replyLabel') }),
    text,
  )
  await userEvent.click(
    screen.getAllByRole('button', { name: i18n.t('comments.submit') })[1],
  )
}

test('adds a reply under its parent', async () => {
  route({
    ...ME,
    [LIST]: () => Response.json({ items: [comment('c1')], nextCursor: null }),
    'POST /comments/c1/replies': (init) => {
      expect(JSON.parse(String(init?.body))).toEqual({ content: 'hey' })
      return Response.json(comment('r1', ADA, 'hey', { parentId: 'c1' }), {
        status: 201,
      })
    },
    'GET /comments/c1/replies': () =>
      Response.json({
        items: [comment('r1', ADA, 'hey', { parentId: 'c1' })],
        nextCursor: null,
      }),
  })
  await renderOpen()
  await screen.findByText('comment c1')

  await replyTo('hey')

  expect(await screen.findByText('hey')).toBeVisible()
})

test('hides the reply action on a comment at the deepest level', async () => {
  const chain = ['c0', 'c1', 'c2', 'c3', 'c4', 'c5']
  const routes: Routes = {
    ...ME,
    [LIST]: () =>
      Response.json({
        items: [comment('c0', BOB, 'level 0', { replyCount: 1 })],
        nextCursor: null,
      }),
  }
  chain.slice(1).forEach((id, index) => {
    routes[`GET /comments/${chain[index]}/replies`] = () =>
      Response.json({
        items: [
          comment(id, BOB, `level ${index + 1}`, {
            parentId: chain[index],
            replyCount: index === 4 ? 0 : 1,
          }),
        ],
        nextCursor: null,
      })
  })
  route(routes)
  await renderOpen()
  await screen.findByText('level 0')

  for (let level = 1; level <= 5; level += 1) {
    await userEvent.click(viewReplies(1))
    await screen.findByText(`level ${level}`)
  }
  // Levels 0 to 4 can be replied to; level 5 cannot.
  expect(
    screen.getAllByRole('button', { name: i18n.t('comments.reply') }),
  ).toHaveLength(5)
})

test.each([
  [400, { code: 'Comment.MaxDepthReached' }, () => i18n.t('comments.maxDepth')],
  [403, { code: 'UserBlock.Blocked' }, () => i18n.t('blocks.actionBlocked')],
  [404, { code: 'Comment.NotFound' }, () => i18n.t('comments.replyGone')],
])('explains a failed reply (%i)', async (status, body, message) => {
  route({
    ...ME,
    [LIST]: () => Response.json({ items: [comment('c1')], nextCursor: null }),
    'POST /comments/c1/replies': () => Response.json(body, { status }),
  })
  const { onPostGone } = await renderOpen()
  await screen.findByText('comment c1')

  await replyTo('hey')

  expect(await screen.findByRole('alert')).toHaveTextContent(message())
  expect(onPostGone).not.toHaveBeenCalled()
})

const reaction = (type: Reaction) =>
  screen.getByRole('button', { name: i18n.t(`comments.${type}`) })
const noContent = () => new Response(null, { status: 204 })
function deferredResponse() {
  let resolve!: (response: Response) => void
  const promise = new Promise<Response>((finish) => {
    resolve = finish
  })
  return { promise, resolve }
}
const reactionRequests = () =>
  fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/reaction'))

function expectReaction(
  type: Reaction | null,
  likes: number,
  dislikes: number,
) {
  expect(reaction('like')).toHaveAttribute(
    'aria-pressed',
    String(type === 'like'),
  )
  expect(reaction('dislike')).toHaveAttribute(
    'aria-pressed',
    String(type === 'dislike'),
  )
  expect(reaction('like').textContent).toBe(likes ? String(likes) : '')
  expect(reaction('dislike').textContent).toBe(dislikes ? String(dislikes) : '')
}

test.each([
  [null, 'like', 'like', 3, 4],
  [null, 'dislike', 'dislike', 2, 5],
  ['like', 'like', null, 1, 4],
  ['like', 'dislike', 'dislike', 1, 5],
  ['dislike', 'dislike', null, 2, 3],
  ['dislike', 'like', 'like', 3, 3],
] as const)(
  'optimistically changes %s on a %s click',
  async (initial, click, next, likes, dislikes) => {
    const response = deferredResponse()
    const list = vi.fn(() =>
      Response.json({
        items: [
          comment('c1', BOB, 'comment c1', {
            myReaction: initial,
            likeCount: 2,
            dislikeCount: 4,
          }),
        ],
        nextCursor: null,
      }),
    )
    route({
      ...ME,
      [LIST]: list,
      'PUT /comments/c1/reaction': () => response.promise,
      'DELETE /comments/c1/reaction': () => response.promise,
    })
    await renderOpen()
    await screen.findByText('comment c1')
    expectReaction(initial, 2, 4)

    fireEvent.click(reaction(click))
    await waitFor(() => expectReaction(next, likes, dislikes))
    await waitFor(() => expect(reactionRequests()).toHaveLength(1))
    const init = reactionRequests()[0][1]
    expect(init?.method).toBe(next === null ? 'DELETE' : 'PUT')
    expect(init?.body).toBe(
      next === null ? undefined : JSON.stringify({ type: next }),
    )

    await act(async () => response.resolve(noContent()))
    expectReaction(next, likes, dislikes)
    expect(list).toHaveBeenCalledTimes(1)
  },
)

test('coalesces rapid clicks and rolls a failed final write back to the last confirmation', async () => {
  const first = deferredResponse()
  const last = deferredResponse()
  const put = vi
    .fn()
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(last.promise)
  route({
    ...ME,
    [LIST]: () => Response.json({ items: [comment('c1')], nextCursor: null }),
    'PUT /comments/c1/reaction': put,
  })
  await renderOpen()
  await screen.findByText('comment c1')

  fireEvent.click(reaction('like'))
  fireEvent.click(reaction('like'))
  fireEvent.click(reaction('dislike'))
  await waitFor(() => expectReaction('dislike', 0, 1))
  expect(reactionRequests()).toHaveLength(1)

  await act(async () => first.resolve(noContent()))
  await waitFor(() => expect(reactionRequests()).toHaveLength(2))
  expect(reactionRequests().map(([, init]) => init?.body)).toEqual([
    JSON.stringify({ type: 'like' }),
    JSON.stringify({ type: 'dislike' }),
  ])
  expectReaction('dislike', 0, 1)
  await act(async () =>
    last.resolve(Response.json({ code: 'UserBlock.Blocked' }, { status: 403 })),
  )
  await waitFor(() => expectReaction('like', 1, 0))
  expect(
    await screen.findAllByText(i18n.t('blocks.actionBlocked')),
  ).not.toHaveLength(0)
})

test.each([
  [400, 'Validation.Error', 'comments.reactionError'],
  [401, 'User.Deleted', 'comments.reactionError'],
  [403, 'User.Suspended', 'suspension.refused'],
  [404, 'Comment.NotFound', 'comments.unavailable'],
] as const)(
  'rolls back a reaction failure (%i)',
  async (status, code, message) => {
    const response = deferredResponse()
    route({
      ...ME,
      [LIST]: () => Response.json({ items: [comment('c1')], nextCursor: null }),
      'PUT /comments/c1/reaction': () => response.promise,
    })
    const { onSessionEnded } = await renderOpen()
    await screen.findByText('comment c1')
    fireEvent.click(reaction('like'))
    await waitFor(() => expectReaction('like', 1, 0))

    await act(async () => response.resolve(Response.json({ code }, { status })))
    expect(await screen.findAllByText(i18n.t(message))).not.toHaveLength(0)
    if (status === 404) {
      expect(
        screen.queryByRole('button', { name: i18n.t('comments.like') }),
      ).not.toBeInTheDocument()
      expect(screen.queryByText('comment c1')).not.toBeInTheDocument()
    } else {
      expectReaction(null, 0, 0)
    }
    if (status === 401) expect(onSessionEnded).toHaveBeenCalledWith('sess_1')
  },
)

test('reveals a linked reply inside a placeholder on a later page', async () => {
  route({
    ...ME,
    [LIST]: () => Response.json({ items: [comment('c1')], nextCursor: 'next' }),
    [`${LIST}?cursor=next`]: () =>
      Response.json({ items: [placeholder('c2', 1)], nextCursor: null }),
    'GET /comments/c2/replies': () =>
      Response.json({
        items: [comment('c3', BOB, 'linked reply', { parentId: 'c2' })],
        nextCursor: null,
      }),
    'PUT /comments/c3/reaction': noContent,
  })
  await renderOpen(vi.fn(), vi.fn(), 'c3')

  const reply = (await screen.findByText('linked reply')).closest('li')!
  await waitFor(() => expect(reply).toHaveFocus())
  expect(
    screen.getAllByRole('button', { name: i18n.t('comments.like') }),
  ).toHaveLength(2)
  const replyLike = within(reply).getByRole('button', {
    name: i18n.t('comments.like'),
  })
  await userEvent.click(replyLike)
  expect(replyLike).toHaveAttribute('aria-pressed', 'true')
  await waitFor(() =>
    expect(reactionRequests()[0]?.[0]).toMatch(/\/comments\/c3\/reaction$/),
  )
})

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { i18n } from '@/i18n/i18n'
import { ApiSessionEndedContext } from '@/lib/api-session'

import { CommentSection } from './comment-section'

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
const POST = 'post-1'

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function comment(id: string, authorId = BOB, content = `comment ${id}`) {
  return {
    id,
    postId: POST,
    authorId,
    author: {
      username: authorId === BOB ? 'bob' : 'ada',
      displayName: authorId === BOB ? 'Bob Builder' : 'Ada Lovelace',
      avatarUrl: null,
    },
    content,
    createdAt: '2026-01-01T00:00:00+00:00',
  }
}

type Handler = (init?: RequestInit) => Response
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

async function renderOpen(onPostGone = vi.fn(), onSessionEnded = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 60_000 } },
  })
  render(
    <QueryClientProvider client={client}>
      <ApiSessionEndedContext.Provider value={onSessionEnded}>
        <MemoryRouter>
          <CommentSection postId={POST} onPostGone={onPostGone} />
        </MemoryRouter>
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
        { errors: { Content: ['Content is too long.'] } },
        { status: 400 },
      ),
  })
  await renderOpen()
  await screen.findByText(i18n.t('comments.empty'))

  await userEvent.type(box(), 'hi')
  await userEvent.click(submit())

  expect(await screen.findByText('Content is too long.')).toBeVisible()
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

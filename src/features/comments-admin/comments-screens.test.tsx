import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useSearchParams } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import type * as CurrentUser from '@/features/current-user'
import { PERMISSIONS } from '@/features/current-user'
import { i18n } from '@/i18n/i18n'

import type { AdminComment, CommentedPost } from './admin-comments-api'
import { AllComments, CommentsByPost } from './comments-screens'
import { getAdminCommentsView } from './use-admin-comments-state'

vi.mock('@clerk/react', () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'clerk-viewer',
    sessionId: 'session',
    getToken: () => Promise.resolve('token'),
  }),
}))

let granted: string[]

vi.mock('@/features/current-user', async (importOriginal) => ({
  ...(await importOriginal<typeof CurrentUser>()),
  usePermissions: () => ({
    can: (permission: string) => granted.includes(permission),
  }),
}))

const fetchMock = vi.fn<typeof fetch>()
let client: QueryClient
let supportsPostLookup: boolean
let hasPostsEndpoint: boolean
let isDeleted: boolean

const author = { id: 'author-1', username: 'hana' }
const createdAt = '2026-11-01T10:00:00Z'

const firstPost: CommentedPost = {
  postId: 'post-first',
  post: { content: 'First post in the queue', author, isDeleted: false },
  commentCount: 1,
  participantCount: 1,
  recentCommentCount: 0,
  lastCommentedAt: createdAt,
}

const otherPost: CommentedPost = {
  ...firstPost,
  postId: 'post-other',
  post: { ...firstPost.post, content: 'Post on another page' },
}

const comment: AdminComment = {
  id: 'comment-1',
  postId: otherPost.postId,
  content: 'Comment on the other post',
  author,
  createdAt,
  isDeleted: false,
  deletedAt: null,
}

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  granted = [PERMISSIONS.deleteAnyComment]
  supportsPostLookup = true
  hasPostsEndpoint = true
  isDeleted = false
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('scrollTo', vi.fn())
  fetchMock.mockImplementation(async (input, init) => {
    const url = new URL(String(input), 'http://localhost')
    const postId = url.searchParams.get('postId')
    const pageSize = Number(url.searchParams.get('pageSize'))
    if (
      init?.method === 'DELETE' &&
      url.pathname.endsWith('/comments/comment-1')
    ) {
      isDeleted = true
      return new Response(null, { status: 204 })
    }
    if (url.pathname.endsWith('/admin/comments/posts')) {
      if (!hasPostsEndpoint) return new Response(null, { status: 404 })
      const items =
        supportsPostLookup && postId === otherPost.postId
          ? [otherPost]
          : [firstPost]
      return Response.json({
        items,
        page: 1,
        pageSize,
        totalCount: items.length,
      })
    }
    if (url.pathname.endsWith('/admin/comments')) {
      const items =
        !isDeleted && (!postId || postId === comment.postId) ? [comment] : []
      return Response.json({
        items,
        page: 1,
        pageSize,
        totalCount: items.length,
      })
    }
    return new Response(null, { status: 404 })
  })
})

afterEach(() => {
  client.clear()
  vi.unstubAllGlobals()
})

function CommentsView() {
  const [search] = useSearchParams()
  return (
    <>
      {getAdminCommentsView(search) === 'all' ? (
        <AllComments />
      ) : (
        <CommentsByPost />
      )}
      <p data-testid="search">{search.toString()}</p>
    </>
  )
}

function renderComments(search = '') {
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/admin/comments${search}`]}>
        <CommentsView />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const text = (key: string) => String(i18n.t(`admin.comments.${key}` as never))

function requests(path: string) {
  return fetchMock.mock.calls
    .map(([input]) => new URL(String(input), 'http://localhost'))
    .filter((url) => url.pathname.endsWith(path))
}

test('opens All comments by default without calling the posts endpoint', async () => {
  hasPostsEndpoint = false
  renderComments()

  expect(await screen.findByText(comment.content)).toBeVisible()
  expect(requests('/admin/comments/posts')).toHaveLength(0)
})

test('offers All comments when the posts endpoint returns 404', async () => {
  hasPostsEndpoint = false
  renderComments('?view=posts')

  expect(await screen.findByText(text('posts.unavailable'))).toBeVisible()
  await userEvent.click(screen.getByRole('button', { name: text('views.all') }))
  expect(await screen.findByText(comment.content)).toBeVisible()
})

test('opens an off-page post from All comments and loads only its thread', async () => {
  renderComments('?view=all&authorId=author-1&q=other&period=week')
  await userEvent.click(
    await screen.findByRole('button', { name: text('viewThread') }),
  )

  expect(
    await screen.findByRole('heading', { name: otherPost.post.content }),
  ).toBeVisible()
  expect(await screen.findByText(comment.content)).toBeVisible()
  expect(
    screen.getByRole('button', { name: /First post in the queue/ }),
  ).toBeVisible()
  const lookup = requests('/admin/comments/posts').find((url) =>
    url.searchParams.has('postId'),
  )
  expect(lookup?.searchParams.get('postId')).toBe(otherPost.postId)
  expect(lookup?.searchParams.get('q')).toBe('other')
  expect(lookup?.searchParams.get('from')).toBeTruthy()
  const threads = requests('/admin/comments').filter((url) =>
    url.searchParams.has('postId'),
  )
  expect(threads.map((url) => url.searchParams.get('postId'))).toEqual([
    otherPost.postId,
  ])
  expect(screen.getByTestId('search')).not.toHaveTextContent('authorId=')
})

test('shows an unavailable message when the lookup returns a different post', async () => {
  supportsPostLookup = false
  renderComments('?post=post-other')

  expect(await screen.findByText(text('thread.postUnavailable'))).toBeVisible()
  expect(
    screen.queryByRole('heading', { name: firstPost.post.content }),
  ).toBeNull()
  expect(requests('/admin/comments')).toHaveLength(0)
})

test('opens a linked thread on mobile and focuses the inbox heading on return', async () => {
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
  renderComments('?post=post-other')

  expect(await screen.findByText(comment.content)).toBeVisible()
  const back = screen.getByRole('button', { name: text('back') })
  expect(back).toHaveFocus()
  await userEvent.click(back)
  expect(
    screen.getByRole('heading', { name: text('posts.title') }),
  ).toHaveFocus()
})

test('deletes after confirmation and refreshes All comments', async () => {
  renderComments('?view=all')
  await userEvent.click(
    await screen.findByRole('button', { name: text('delete') }),
  )
  const dialog = screen.getByRole('alertdialog', { name: text('deleteTitle') })
  expect(isDeleted).toBe(false)
  await userEvent.click(
    within(dialog).getByRole('button', { name: text('delete') }),
  )

  expect(await screen.findByText(text('empty'))).toBeVisible()
  expect(isDeleted).toBe(true)
  expect(requests('/admin/comments')).toHaveLength(2)
})

test('hides deletion for viewers without permission', async () => {
  granted = []
  renderComments('?view=all')
  expect(await screen.findByText(comment.content)).toBeVisible()
  expect(screen.queryByRole('button', { name: text('delete') })).toBeNull()
})

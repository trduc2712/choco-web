import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
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
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'

import type { AppNotification } from './notifications-api'
import { NotificationsMenu } from './notifications-menu'

vi.mock('@clerk/react', () => ({
  useUser: () => ({ user: { username: 'ada' } }),
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

const t = (key: string, options?: Record<string, unknown>) =>
  String(i18n.t(key as never, options as never))

function notification(
  id: string,
  extra: Partial<AppNotification> = {},
): AppNotification {
  return {
    id,
    type: 'Followed',
    actor: {
      id: `actor-${id}`,
      username: `user${id}`,
      displayName: `Person ${id}`,
      avatarUrl: null,
    },
    createdAt: new Date().toISOString(),
    isRead: false,
    ...extra,
  }
}

type Server = {
  pages: Record<string, { items: AppNotification[]; nextCursor: string | null }>
  count: number
  // Respond to a write; defaults to 204.
  write?: (method: string, path: string) => Response | Promise<Response>
}

const NO_CONTENT = () => new Response(null, { status: 204 })

function setup(server: Server) {
  const requests: string[] = []
  fetchMock.mockImplementation(async (input, init) => {
    const path = String(input).replace(/^.*\/api\/v1/, '')
    const method = init?.method ?? 'GET'
    requests.push(`${method} ${path}`)
    if (method === 'GET' && path === '/me/notifications/unread-count')
      return Response.json({ count: server.count })
    if (method === 'GET' && path.startsWith('/me/notifications?')) {
      const cursor = new URL(path, 'http://x').searchParams.get('cursor')
      return Response.json(server.pages[cursor ?? ''])
    }
    if (method === 'PUT') return (server.write ?? NO_CONTENT)(method, path)
    return Response.json({}, { status: 404 })
  })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const view = render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter>
          <NotificationsMenu />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
  // Opens the dropdown, as a click on the bell would.
  openBell()
  return { ...view, client, requests }
}

function openBell() {
  fireEvent.click(screen.getByRole('button', { name: /^Notifications/ }))
}

const badgeLink = (count: number) => t('notifications.linkUnread', { count })

test('lists notifications with a sentence, profile link and unread marker', async () => {
  setup({
    count: 1,
    pages: {
      '': {
        items: [notification('1'), notification('2', { isRead: true })],
        nextCursor: null,
      },
    },
  })

  const unread = await screen.findByRole('link', { name: /Person 1/ })
  expect(unread).toHaveAttribute('href', '/@user1')
  expect(unread).toHaveTextContent(t('notifications.kind.followed'))
  expect(
    within(unread).getByText(t('notifications.unread')),
  ).toBeInTheDocument()

  const read = screen.getByRole('link', { name: /Person 2/ })
  expect(
    within(read).queryByText(t('notifications.unread')),
  ).not.toBeInTheDocument()
})

test('shows a neutral sentence for a type it does not know', async () => {
  setup({
    count: 0,
    pages: {
      '': {
        items: [notification('1', { type: 'SomethingNew' })],
        nextCursor: null,
      },
    },
  })

  const row = await screen.findByRole('link', { name: /Person 1/ })
  expect(row).toHaveTextContent(t('notifications.kind.unknown'))
})

test('words likes and comments and opens the post they are about', async () => {
  setup({
    count: 0,
    pages: {
      '': {
        items: [
          notification('1', { type: 'PostLiked', postId: 'p1' }),
          notification('2', { type: 'PostCommented', postId: 'p2' }),
        ],
        nextCursor: null,
      },
    },
  })

  const liked = await screen.findByRole('link', { name: /Person 1/ })
  expect(liked).toHaveTextContent(t('notifications.kind.postLiked'))
  expect(liked).toHaveAttribute('href', '/@ada/posts/p1')

  const commented = screen.getByRole('link', { name: /Person 2/ })
  expect(commented).toHaveTextContent(t('notifications.kind.postCommented'))
  expect(commented).toHaveAttribute('href', '/@ada/posts/p2')
})

test('shows the post and comment excerpts', async () => {
  setup({
    count: 0,
    pages: {
      '': {
        items: [
          notification('1', {
            type: 'PostCommented',
            postId: 'p1',
            postExcerpt: 'My first post',
            commentId: 'c1',
            commentExcerpt: 'Nice one!',
          }),
          notification('2', {
            type: 'PostLiked',
            postId: 'p1',
            postExcerpt: 'My first post',
            commentId: null,
            commentExcerpt: null,
          }),
        ],
        nextCursor: null,
      },
    },
  })

  const commented = await screen.findByRole('link', { name: /Person 1/ })
  expect(within(commented).getByText('Nice one!')).toBeVisible()
  expect(commented).toHaveTextContent('commented on “My first post”')
  expect(within(commented).getByText('“My first post”')).toBeVisible()

  const liked = screen.getByRole('link', { name: /Person 2/ })
  expect(liked).toHaveTextContent('liked “My first post”')
})

test('shortens a long post excerpt inside the sentence', async () => {
  setup({
    count: 0,
    pages: {
      '': {
        items: [
          notification('1', {
            type: 'PostLiked',
            postId: 'p1',
            postExcerpt: 'x'.repeat(60),
          }),
        ],
        nextCursor: null,
      },
    },
  })

  const row = await screen.findByRole('link', { name: /Person 1/ })
  expect(row).toHaveTextContent(`liked “${'x'.repeat(40)}…”`)
})

test('falls back to "your post" when there is no excerpt', async () => {
  setup({
    count: 0,
    pages: {
      '': {
        items: [
          notification('1', {
            type: 'PostLiked',
            postId: 'p1',
            postExcerpt: null,
          }),
        ],
        nextCursor: null,
      },
    },
  })

  const row = await screen.findByRole('link', { name: /Person 1/ })
  expect(row).toHaveTextContent(t('notifications.kind.postLiked'))
})

test('loads the next page with the cursor', async () => {
  const user = userEvent.setup()
  const { requests } = setup({
    count: 0,
    pages: {
      '': { items: [notification('1')], nextCursor: 'c1' },
      c1: { items: [notification('2')], nextCursor: null },
    },
  })

  await screen.findByRole('link', { name: /Person 1/ })
  // The dropdown previews a few; "See all" opens the full list.
  expect(
    screen.queryByRole('button', { name: t('notifications.loadMore') }),
  ).not.toBeInTheDocument()
  await user.click(
    screen.getByRole('button', { name: t('notifications.seeAll') }),
  )
  await user.click(
    await screen.findByRole('button', { name: t('notifications.loadMore') }),
  )

  expect(await screen.findByRole('link', { name: /Person 2/ })).toBeVisible()
  expect(requests.some((r) => r.includes('cursor=c1'))).toBe(true)
  expect(
    screen.queryByRole('button', { name: t('notifications.loadMore') }),
  ).not.toBeInTheDocument()
})

test('shows the empty state', async () => {
  setup({ count: 0, pages: { '': { items: [], nextCursor: null } } })

  expect(await screen.findByText(t('notifications.empty'))).toBeVisible()
})

test('shows an error with a retry', async () => {
  const user = userEvent.setup()
  setup({ count: 0, pages: {} })
  fetchMock.mockImplementationOnce(async () =>
    Response.json({}, { status: 500 }),
  )

  expect(await screen.findByText(t('notifications.loadError'))).toBeVisible()
  await user.click(screen.getByRole('button', { name: t('common.retry') }))
  expect(fetchMock).toHaveBeenCalled()
})

test('shows the unread count on the link, hides it at 0 and caps it at 99+', async () => {
  const first = setup({
    count: 3,
    pages: { '': { items: [], nextCursor: null } },
  })
  expect(
    await screen.findByRole('button', { name: badgeLink(3) }),
  ).toBeVisible()
  first.unmount()

  const second = setup({
    count: 120,
    pages: { '': { items: [], nextCursor: null } },
  })
  const capped = await screen.findByRole('button', { name: badgeLink(120) })
  expect(capped).toHaveTextContent('99+')
  second.unmount()

  setup({ count: 0, pages: { '': { items: [], nextCursor: null } } })
  const none = await screen.findByRole('button', {
    name: t('notifications.title'),
  })
  expect(none).not.toHaveTextContent(/\d/)
})

test('marks a notification read at once and keeps the count in step', async () => {
  const user = userEvent.setup()
  let finish: (response: Response) => void = () => undefined
  const { requests } = setup({
    count: 1,
    pages: { '': { items: [notification('1')], nextCursor: null } },
    write: () => new Promise<Response>((resolve) => (finish = resolve)),
  })

  const row = await screen.findByRole('link', { name: /Person 1/ })
  await user.click(row)

  // Before the PUT answers, the badge already changed and the dropdown closed.
  expect(
    await screen.findByRole('button', { name: t('notifications.title') }),
  ).toBeVisible()
  expect(row).not.toBeInTheDocument()
  openBell()
  const reopened = await screen.findByRole('link', { name: /Person 1/ })
  expect(
    within(reopened).queryByText(t('notifications.unread')),
  ).not.toBeInTheDocument()
  expect(requests).toContain('PUT /me/notifications/1/read')
  finish(NO_CONTENT())
})

test('rolls a failed mark-read back and says so', async () => {
  const user = userEvent.setup()
  setup({
    count: 1,
    pages: { '': { items: [notification('1')], nextCursor: null } },
    write: () => Response.json({}, { status: 500 }),
  })

  await user.click(await screen.findByRole('link', { name: /Person 1/ }))

  expect(
    await screen.findByText(t('notifications.markReadError')),
  ).toBeVisible()
  expect(
    await screen.findByRole('button', { name: badgeLink(1) }),
  ).toBeVisible()
})

test('ignores a 404 when marking read', async () => {
  const user = userEvent.setup()
  const server: Server = {
    count: 1,
    pages: { '': { items: [notification('1')], nextCursor: null } },
    // The notification is gone: the server no longer lists it.
    write: () => {
      server.pages[''].items = []
      server.count = 0
      return Response.json({}, { status: 404 })
    },
  }
  setup(server)

  await user.click(await screen.findByRole('link', { name: /Person 1/ }))

  openBell()
  expect(await screen.findByText(t('notifications.empty'))).toBeVisible()
  expect(
    screen.queryByText(t('notifications.markReadError')),
  ).not.toBeInTheDocument()
})

test('marks everything read, and is disabled when nothing is unread', async () => {
  const user = userEvent.setup()
  const server: Server = {
    count: 2,
    pages: {
      '': { items: [notification('1'), notification('2')], nextCursor: null },
    },
    write: () => {
      server.count = 0
      return NO_CONTENT()
    },
  }
  const { requests } = setup(server)

  const button = await screen.findByRole('button', {
    name: t('notifications.markAllRead'),
  })
  await waitFor(() => expect(button).toBeEnabled())
  await user.click(button)

  await waitFor(() => expect(button).toBeDisabled())
  expect(requests).toContain('PUT /me/notifications/read')
})

test('has no accessibility violations', async () => {
  setup({
    count: 1,
    pages: {
      '': {
        items: [notification('1'), notification('2', { isRead: true })],
        nextCursor: 'next',
      },
    },
  })

  await screen.findByRole('link', { name: /Person 1/ })
  await expectNoA11yViolations(document.body)
})

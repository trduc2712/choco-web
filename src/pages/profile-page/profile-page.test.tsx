import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { i18n } from '@/i18n/i18n'
import { queryClient } from '@/lib/query-client'
import { router as appRouter } from '@/router'
import { expectNoA11yViolations } from '@/test/a11y'

const clerk = vi.hoisted(() => ({
  isLoaded: true,
  isSignedIn: true,
  userId: 'clerk-viewer',
  username: 'viewer',
  hasImage: true,
  getToken: vi.fn<() => Promise<string | null>>(),
}))

vi.mock('@clerk/react', () => ({
  useAuth: () => ({ ...clerk }),
  useUser: () => ({
    user: clerk.isSignedIn
      ? { username: clerk.username, hasImage: clerk.hasImage }
      : null,
  }),
  useClerk: () => ({}),
}))

const fetchMock = vi.fn<typeof fetch>()
const profile = {
  id: '00000000-0000-0000-0000-000000000001',
  username: 'Ada',
  displayName: 'Ada Lovelace',
  avatarUrl: 'https://example.com/ada.png',
}
const firstPost = {
  id: 'post-1',
  content: 'First line\nSecond line',
  createdAt: '2026-11-08T09:00:00Z',
}
const routers: ReturnType<typeof createMemoryRouter>[] = []
const clients: QueryClient[] = []

beforeEach(() => {
  clerk.isLoaded = true
  clerk.isSignedIn = true
  clerk.userId = 'clerk-viewer'
  clerk.username = 'viewer'
  clerk.hasImage = true
  clerk.getToken.mockReset().mockResolvedValue('session-token')
  fetchMock
    .mockReset()
    .mockImplementation(async (url) =>
      String(url).endsWith('/me/posts')
        ? Response.json({ items: [], nextCursor: null })
        : Response.json(profile),
    )
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('scrollTo', vi.fn())
})

afterEach(() => {
  routers.splice(0).forEach((router) => router.dispose())
  clients.splice(0).forEach((client) => client.clear())
  vi.unstubAllGlobals()
})

function openProfile(path = '/@Ada') {
  const router = createMemoryRouter(appRouter.routes, {
    initialEntries: [path],
  })
  const client = new QueryClient({
    defaultOptions: {
      queries: { ...queryClient.getDefaultOptions().queries, retryDelay: 0 },
    },
  })
  routers.push(router)
  clients.push(client)
  const view = render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { ...view, router }
}

test('loads real profile data using the exact username and bearer token', async () => {
  const { container } = openProfile()
  const main = await screen.findByRole('main')
  expect(
    await within(main).findByRole(
      'heading',
      { name: profile.displayName },
      { timeout: 5000 },
    ),
  ).toBeVisible()
  expect(container.querySelector('header:not(main header)')).toBeNull()
  expect(screen.getByRole('link', { name: 'Choco' })).toHaveAttribute(
    'href',
    '/',
  )
  expect(
    screen.getByRole('button', { name: i18n.t('auth.accountMenu.label') }),
  ).toHaveTextContent('@viewer')
  expect(
    screen.getByRole('searchbox', { name: i18n.t('home.search') }),
  ).toBeVisible()
  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe('/api/v1/users/by-username/Ada')
  expect(new Headers(init?.headers).get('Authorization')).toBe(
    'Bearer session-token',
  )
  expect(init?.signal).toBeInstanceOf(AbortSignal)
  expect(
    screen.getByRole('img', { name: profile.displayName }),
  ).toHaveAttribute('src', profile.avatarUrl)
  expect(screen.queryByRole('article')).not.toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(
    screen.queryByRole('button', { name: i18n.t('profile.editProfile') }),
  ).not.toBeInTheDocument()
  await expectNoA11yViolations(container)
})

test('shows the owner’s saved posts and loads the next page on request', async () => {
  clerk.username = 'Ada'
  fetchMock.mockImplementation(async (url) => {
    if (url === '/api/v1/me/posts') {
      return Response.json({ items: [firstPost], nextCursor: 'next+/=' })
    }
    if (url === '/api/v1/me/posts?cursor=next%2B%2F%3D') {
      return Response.json({
        items: [{ ...firstPost, id: 'post-2', content: 'An older post' }],
        nextCursor: null,
      })
    }
    return Response.json(profile)
  })
  const { router } = openProfile()
  const posts = within(
    await screen.findByRole('tabpanel', { name: i18n.t('profile.posts') }),
  )
  expect(await posts.findByRole('article')).toHaveTextContent('@Ada')
  expect(posts.getByText('First line Second line').textContent).toBe(
    firstPost.content,
  )
  const loadMore = posts.getByRole('button', { name: i18n.t('posts.loadMore') })
  await userEvent.click(loadMore)
  expect(await posts.findByText('An older post')).toBeVisible()
  expect(posts.getAllByRole('article')).toHaveLength(2)
  expect(loadMore).not.toBeInTheDocument()

  const tabs = within(
    screen.getByRole('tablist', { name: i18n.t('profile.activity') }),
  )
  const postsTab = tabs.getByRole('tab', { name: i18n.t('profile.posts') })
  expect(postsTab).toHaveAttribute('aria-selected', 'true')
  await userEvent.click(
    tabs.getByRole('tab', { name: i18n.t('profile.replies') }),
  )
  expect(
    screen.getByRole('tabpanel', { name: i18n.t('profile.replies') }),
  ).toHaveTextContent(i18n.t('profile.repliesUnavailable'))
  await userEvent.keyboard('{ArrowRight}')
  expect(
    screen.getByRole('tabpanel', { name: i18n.t('profile.media') }),
  ).toHaveTextContent(i18n.t('profile.mediaUnavailable'))
  await userEvent.click(postsTab)
  expect(screen.getByText('An older post')).toBeVisible()

  fetchMock.mockImplementation(async () =>
    Response.json({
      ...profile,
      username: 'Grace',
      displayName: 'Grace Hopper',
    }),
  )
  await act(async () => {
    await router.navigate('/@Grace')
  })
  expect(
    await screen.findByRole('heading', { name: 'Grace Hopper' }),
  ).toBeVisible()
  expect(screen.queryByRole('article')).not.toBeInTheDocument()
  expect(fetchMock.mock.lastCall?.[0]).toBe('/api/v1/users/by-username/Grace')
})

test('retries the owner’s posts independently and shows the empty state', async () => {
  clerk.username = 'Ada'
  let shouldFail = true
  fetchMock.mockImplementation(async (url) => {
    if (!String(url).endsWith('/me/posts')) return Response.json(profile)
    if (shouldFail) return new Response(null, { status: 503 })
    return Response.json({ items: [], nextCursor: null })
  })
  openProfile()
  expect(await screen.findByRole('alert')).toHaveTextContent(
    i18n.t('posts.loadError'),
  )
  expect(
    screen.getByRole('heading', { name: profile.displayName }),
  ).toBeVisible()

  shouldFail = false
  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('common.retry') }),
  )
  expect(
    await screen.findByRole('heading', { name: i18n.t('posts.empty') }),
  ).toBeVisible()
})

test('shows editing placeholders only for the owner', async () => {
  clerk.username = 'Ada'
  openProfile()
  expect(
    await screen.findByRole('button', { name: i18n.t('profile.editProfile') }),
  ).toBeVisible()
  expect(
    screen.getByRole('button', { name: i18n.t('profile.chooseWallpaper') }),
  ).toBeVisible()
})

test('uses initials for the owner when Clerk confirms there is no custom avatar', async () => {
  clerk.username = 'Ada'
  clerk.hasImage = false
  openProfile()
  await screen.findByRole('heading', { name: profile.displayName })
  const avatar = screen.getByRole('img', { name: profile.displayName })
  expect(avatar.tagName).toBe('SPAN')
  expect(avatar).toHaveTextContent('AL')
})

test("does not apply the viewer avatar preference to someone else's custom photo", async () => {
  clerk.hasImage = false
  openProfile()
  await screen.findByRole('heading', { name: profile.displayName })
  expect(
    screen.getByRole('img', { name: profile.displayName }),
  ).toHaveAttribute('src', profile.avatarUrl)
})

test('offers guests sign-in with a return path without making authenticated requests', async () => {
  clerk.isSignedIn = false
  const { router } = openProfile('/@Ada?from=share')
  expect(
    await screen.findByRole('heading', {
      name: i18n.t('profile.signInRequired'),
    }),
  ).toBeVisible()
  const link = screen.getByRole('link', { name: i18n.t('auth.signIn.submit') })
  const signInUrl = new URL(link.getAttribute('href')!, 'http://localhost')
  expect(signInUrl.searchParams.get('redirect_url')).toBe('/@Ada?from=share')
  expect(router.state.location.pathname).toBe('/@Ada')
  expect(fetchMock).not.toHaveBeenCalled()
})

test('waits for the session to load before requesting a profile', async () => {
  clerk.isLoaded = false
  openProfile()
  expect(await screen.findByRole('status')).toHaveAttribute('aria-busy', 'true')
  expect(fetchMock).not.toHaveBeenCalled()
})

test('shows a loading state until the API responds', async () => {
  let resolveResponse!: (response: Response) => void
  fetchMock.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveResponse = resolve
      }),
  )
  openProfile()
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
  expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
  await act(async () => resolveResponse(Response.json(profile)))
  expect(
    await screen.findByRole('heading', { name: profile.displayName }),
  ).toBeVisible()
})

test.each(['/missing', '/@', `/@${'a'.repeat(65)}`])(
  'rejects invalid profile route %s before calling the API',
  async (path) => {
    openProfile(path)
    expect(
      await screen.findByRole('heading', { name: i18n.t('notFound.title') }),
    ).toBeVisible()
    expect(fetchMock).not.toHaveBeenCalled()
  },
)

test('shows not found for 404 without retrying or showing demo data', async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 404 }))
  openProfile('/@choco')
  expect(
    await screen.findByRole('heading', { name: i18n.t('profile.notFound') }),
  ).toBeVisible()
  expect(screen.queryByText('@choco')).not.toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

test('does not label a signed-in user as signed out when the API rejects the session', async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 401 }))
  openProfile()
  expect(await screen.findByRole('alert')).toHaveTextContent(
    i18n.t('profile.sessionError'),
  )
  expect(
    screen.queryByRole('link', { name: i18n.t('auth.signIn.submit') }),
  ).not.toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledTimes(2)
  expect(clerk.getToken).toHaveBeenCalledWith({ skipCache: true })
})

test('does not misreport account-validation errors as a missing profile', async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 400 }))
  openProfile()
  expect(await screen.findByRole('alert')).toHaveTextContent(
    i18n.t('profile.unavailable'),
  )
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

test('recovers from server errors with the retry button', async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 503 }))
  openProfile()
  expect(await screen.findByRole('alert')).toHaveTextContent(
    i18n.t('profile.unavailable'),
  )
  fetchMock.mockImplementation(async () => Response.json(profile))
  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('common.retry') }),
  )
  expect(
    await screen.findByRole('heading', { name: profile.displayName }),
  ).toBeVisible()
})

test('loads the new profile when the URL changes without displaying stale identity', async () => {
  const { router } = openProfile()
  await screen.findByRole('heading', { name: profile.displayName })
  fetchMock.mockImplementation(async () =>
    Response.json({
      ...profile,
      username: 'Grace',
      displayName: 'Grace Hopper',
    }),
  )
  await act(async () => {
    await router.navigate('/@Grace')
  })
  expect(
    await screen.findByRole('heading', { name: 'Grace Hopper' }),
  ).toBeVisible()
  expect(screen.queryByText('@Ada')).not.toBeInTheDocument()
  expect(fetchMock.mock.lastCall?.[0]).toBe('/api/v1/users/by-username/Grace')
})

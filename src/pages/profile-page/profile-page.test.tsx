import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import avatarStyles from '@/components/avatar/avatar.module.scss'
import { i18n } from '@/i18n/i18n'
import { queryClient } from '@/lib/query-client'
import { router as appRouter } from '@/router'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectStyle } from '@/test/styles'

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
const routers: ReturnType<typeof createMemoryRouter>[] = []
const clients: QueryClient[] = []

beforeEach(() => {
  clerk.isLoaded = true
  clerk.isSignedIn = true
  clerk.userId = 'clerk-viewer'
  clerk.username = 'viewer'
  clerk.hasImage = true
  clerk.getToken.mockReset().mockResolvedValue('session-token')
  fetchMock.mockReset().mockImplementation(async () => Response.json(profile))
  vi.stubGlobal('fetch', ((input, init) => {
    if (input === '/api/v1/me') {
      return Promise.resolve(Response.json({ id: profile.id }))
    }
    return fetchMock(input, init)
  }) satisfies typeof fetch)
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
  const posts = within(
    screen.getByRole('region', { name: i18n.t('posts.samples') }),
  )
  expect(posts.getAllByRole('article')).toHaveLength(10)
  expect(posts.getAllByText('@Ada')).toHaveLength(10)
  expect(
    screen.queryByRole('button', { name: i18n.t('profile.editProfile') }),
  ).not.toBeInTheDocument()
  await expectNoA11yViolations(container)
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
  expectStyle(avatar, avatarStyles, 'fallback-orange')
  const menu = within(
    screen.getByRole('button', { name: i18n.t('auth.accountMenu.label') }),
  )
  expectStyle(
    await menu.findByRole('img', { name: 'Ada' }),
    avatarStyles,
    'fallback-orange',
  )
  const posts = within(
    screen.getByRole('region', { name: i18n.t('posts.samples') }),
  )
  for (const post of posts.getAllByRole('article')) {
    expect(
      post.querySelector(`.${avatarStyles['fallback-orange']}`),
    ).not.toBeNull()
  }
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

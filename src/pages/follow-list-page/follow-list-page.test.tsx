import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ToastProvider } from '@/components/toast/toast-provider'
import { i18n } from '@/i18n/i18n'
import { queryClient } from '@/lib/query-client'
import { router as appRouter } from '@/router'

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
  avatarUrl: null,
  isFollowedByMe: false,
  followerCount: 3,
  followingCount: 1,
}
const grace = {
  username: 'Grace',
  displayName: 'Grace Hopper',
  avatarUrl: 'https://example.com/grace.png',
}
const linus = { username: 'Linus', displayName: 'Linus', avatarUrl: null }
const followersPath = `/api/v1/users/${profile.id}/followers`
const emptyPage = { items: [], nextCursor: null }
const routers: ReturnType<typeof createMemoryRouter>[] = []
const clients: QueryClient[] = []

beforeEach(() => {
  clerk.isLoaded = true
  clerk.isSignedIn = true
  clerk.getToken.mockReset().mockResolvedValue('session-token')
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('scrollTo', vi.fn())
})

afterEach(() => {
  routers.splice(0).forEach((router) => router.dispose())
  clients.splice(0).forEach((client) => client.clear())
  vi.unstubAllGlobals()
})

function open(path: string) {
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
  render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>,
  )
  return { router, client }
}

function mockApi(list: (url: string) => Response) {
  fetchMock.mockImplementation(async (url) => {
    const path = String(url)
    return path.startsWith('/api/v1/users/by-username/')
      ? Response.json(profile)
      : list(path)
  })
}

test('lists followers and loads the next page with the cursor', async () => {
  const cursor = 'opaque+cursor/=='
  mockApi((url) =>
    Response.json(
      url === followersPath
        ? { items: [grace], nextCursor: cursor }
        : { items: [linus], nextCursor: null },
    ),
  )
  open('/@Ada/followers')

  expect(
    await screen.findByRole('tab', { name: 'Followers', selected: true }),
  ).toBeVisible()
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
    'Ada Lovelace',
  )
  const first = await screen.findByRole('link', { name: 'Grace Hopper @Grace' })
  expect(first).toHaveAttribute('href', '/@Grace')
  expect(
    screen.queryByRole('button', { name: i18n.t('profile.follow') }),
  ).not.toBeInTheDocument()

  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('userSearch.loadMore') }),
  )
  expect(
    await screen.findByRole('link', { name: 'Linus @Linus' }),
  ).toBeVisible()
  const urls = fetchMock.mock.calls.map(([url]) => String(url))
  expect(urls).toContain(`${followersPath}?${new URLSearchParams({ cursor })}`)
  expect(
    screen.queryByRole('button', { name: i18n.t('userSearch.loadMore') }),
  ).not.toBeInTheDocument()
  const headers = new Headers(fetchMock.mock.calls.at(-1)?.[1]?.headers)
  expect(headers.get('Authorization')).toBe('Bearer session-token')
})

test('lists who a user follows', async () => {
  mockApi(() => Response.json({ items: [grace], nextCursor: null }))
  open('/@Ada/following')

  expect(
    await screen.findByRole('tab', { name: 'Following', selected: true }),
  ).toBeVisible()
  expect(await screen.findByText('Grace Hopper')).toBeVisible()
  expect(fetchMock.mock.calls.map(([url]) => String(url))).toContain(
    `/api/v1/users/${profile.id}/following`,
  )
})

test('switches between the lists with the tabs', async () => {
  mockApi((url) =>
    Response.json({
      items: [url.endsWith('/following') ? linus : grace],
      nextCursor: null,
    }),
  )
  const { router } = open('/@Ada/followers')

  expect(await screen.findByText('Grace Hopper')).toBeVisible()
  await userEvent.click(screen.getByRole('tab', { name: 'Following' }))
  expect(await screen.findByText('Linus')).toBeVisible()
  expect(router.state.location.pathname).toBe('/@Ada/following')
  expect(screen.getByRole('tab', { name: 'Following' })).toHaveFocus()
})

test('shows an empty state for an empty list', async () => {
  mockApi(() => Response.json(emptyPage))
  open('/@Ada/followers')

  expect(
    await screen.findByText(
      i18n.t('profile.followersEmpty', { name: 'Ada Lovelace' }),
    ),
  ).toBeVisible()
})

test('shows the list error and retries', async () => {
  const list = vi
    .fn<() => Response>()
    // Server errors are retried once, so fail twice.
    .mockImplementationOnce(() => new Response(null, { status: 503 }))
    .mockImplementationOnce(() => new Response(null, { status: 503 }))
    .mockReturnValue(Response.json({ items: [grace], nextCursor: null }))
  mockApi(() => list())
  open('/@Ada/followers')

  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent(i18n.t('profile.followListError'))
  await userEvent.click(
    within(alert).getByRole('button', { name: i18n.t('common.retry') }),
  )
  expect(await screen.findByText('Grace Hopper')).toBeVisible()
})

test('treats a missing user as a missing profile', async () => {
  mockApi(() => Response.json({ code: 'User.NotFound' }, { status: 404 }))
  open('/@Ada/followers')

  expect(await screen.findByText(i18n.t('profile.notFound'))).toBeVisible()
})

test('links the profile counts to the lists', async () => {
  mockApi(() => Response.json(emptyPage))
  const { router } = open('/@Ada')

  const followers = await screen.findByRole('link', { name: 'Followers: 3' })
  expect(followers).toHaveAttribute('href', '/@Ada/followers')
  expect(screen.getByRole('link', { name: 'Following: 1' })).toHaveAttribute(
    'href',
    '/@Ada/following',
  )
  await userEvent.click(followers)
  await waitFor(() =>
    expect(router.state.location.pathname).toBe('/@Ada/followers'),
  )
})

test('refetches the lists after following', async () => {
  const follow = `/api/v1/users/${profile.id}/follow`
  let followerCalls = 0
  fetchMock.mockImplementation(async (url) => {
    const path = String(url)
    if (path === follow) return new Response(null, { status: 204 })
    if (path === followersPath) followerCalls += 1
    return path.startsWith('/api/v1/users/by-username/')
      ? Response.json(profile)
      : Response.json(emptyPage)
  })
  const { router } = open('/@Ada/followers')
  await screen.findByText(
    i18n.t('profile.followersEmpty', { name: 'Ada Lovelace' }),
  )
  await router.navigate('/@Ada')
  await userEvent.click(
    await screen.findByRole('button', { name: i18n.t('profile.follow') }),
  )
  await router.navigate('/@Ada/followers')
  await screen.findByText(
    i18n.t('profile.followersEmpty', { name: 'Ada Lovelace' }),
  )
  await waitFor(() => expect(followerCalls).toBe(2))
})

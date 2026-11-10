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
  postCount: 2,
}
const graceId = '00000000-0000-0000-0000-0000000000a1'
const linusId = '00000000-0000-0000-0000-0000000000a2'
const viewerId = '00000000-0000-0000-0000-0000000000a3'
const grace = {
  id: graceId,
  username: 'Grace',
  displayName: 'Grace Hopper',
  avatarUrl: 'https://example.com/grace.png',
  isFollowedByMe: false,
}
const linus = {
  id: linusId,
  username: 'Linus',
  displayName: 'Linus',
  avatarUrl: null,
  isFollowedByMe: true,
}
const viewer = {
  id: viewerId,
  username: 'viewer',
  displayName: 'Vera Viewer',
  avatarUrl: null,
  isFollowedByMe: false,
}
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
    if (path === '/api/v1/me/profile') return Response.json(viewer)
    return path.startsWith('/api/v1/users/by-username/')
      ? Response.json(profile)
      : list(path)
  })
}

// Like mockApi, but Grace's follow endpoint is handled by `follow`.
function mockRows(
  items: object[],
  follow: (method: string) => Response | Promise<Response>,
) {
  fetchMock.mockImplementation(async (url, init) => {
    const path = String(url)
    if (path === '/api/v1/me/profile') return Response.json(viewer)
    if (path === `/api/v1/users/${graceId}/follow`)
      return follow(init?.method ?? 'GET')
    return path.startsWith('/api/v1/users/by-username/')
      ? Response.json(profile)
      : Response.json({ items, nextCursor: null })
  })
}

const methods = () =>
  fetchMock.mock.calls
    .map(([url, init]) => [String(url), init?.method] as const)
    .filter(([url]) => url.endsWith('/follow'))
    .map(([, method]) => method)

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

test('shows Follow or Unfollow per row and none on the own row', async () => {
  mockRows([viewer, grace, linus], () => new Response(null, { status: 204 }))
  open('/@Ada/following')

  expect(
    await screen.findByRole('button', { name: 'Follow Grace Hopper' }),
  ).toBeVisible()
  expect(screen.getByRole('button', { name: 'Unfollow Linus' })).toBeVisible()
  expect(screen.getByText('Vera Viewer')).toBeVisible()
  expect(
    screen.getAllByRole('button', { name: /^(Follow|Unfollow) / }),
  ).toHaveLength(2)
})

test('follows optimistically using the id from the row', async () => {
  let release: (response: Response) => void = () => undefined
  mockRows(
    [grace],
    () => new Promise<Response>((resolve) => (release = resolve)),
  )
  open('/@Ada/following')

  await userEvent.click(
    await screen.findByRole('button', { name: 'Follow Grace Hopper' }),
  )
  const pressed = await screen.findByRole('button', {
    name: 'Unfollow Grace Hopper',
  })
  expect(methods()).toEqual(['PUT'])

  // A second press while the request is in flight sends nothing.
  await userEvent.click(pressed)
  expect(methods()).toEqual(['PUT'])

  release(new Response(null, { status: 204 }))
  await waitFor(() => expect(pressed).toBeEnabled())
  await userEvent.click(pressed)
  expect(
    await screen.findByRole('button', { name: 'Follow Grace Hopper' }),
  ).toBeVisible()
  expect(methods()).toEqual(['PUT', 'DELETE'])
  expect(
    fetchMock.mock.calls.some(([url]) =>
      String(url).endsWith('/by-username/Grace'),
    ),
  ).toBe(false)
})

test('rolls back and reports a failed follow', async () => {
  mockRows([grace], () => new Response(null, { status: 500 }))
  open('/@Ada/following')

  await userEvent.click(
    await screen.findByRole('button', { name: 'Follow Grace Hopper' }),
  )
  expect(
    await screen.findByText(i18n.t('userSearch.followError')),
  ).toBeVisible()
  expect(
    screen.getByRole('button', { name: 'Follow Grace Hopper' }),
  ).toBeVisible()
})

test('removes a row whose user no longer exists', async () => {
  mockRows([grace, linus], () => Response.json({}, { status: 404 }))
  open('/@Ada/following')

  await userEvent.click(
    await screen.findByRole('button', { name: 'Follow Grace Hopper' }),
  )
  expect(await screen.findByText(i18n.t('userSearch.userGone'))).toBeVisible()
  expect(screen.queryByText('Grace Hopper')).not.toBeInTheDocument()
  expect(screen.getByText('Linus')).toBeVisible()
})

test('updates the same user in the profile cache after following', async () => {
  mockRows([grace], () => new Response(null, { status: 204 }))
  const { client } = open('/@Ada/following')
  client.setQueryData(['profile', 'Grace', 'clerk-viewer'], {
    ...profile,
    id: graceId,
    username: 'Grace',
    followerCount: 5,
  })

  await userEvent.click(
    await screen.findByRole('button', { name: 'Follow Grace Hopper' }),
  )
  await screen.findByRole('button', { name: 'Unfollow Grace Hopper' })
  expect(
    client.getQueryData(['profile', 'Grace', 'clerk-viewer']),
  ).toMatchObject({ isFollowedByMe: true })
})

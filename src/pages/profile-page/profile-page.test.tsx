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
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ToastProvider } from '@/components/toast/toast-provider'
import type * as CurrentUser from '@/features/current-user'
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

// The app layout asks for the viewer's permissions; these tests count requests.
vi.mock('@/features/current-user/use-permissions', () => ({
  usePermissions: () => ({
    isLoading: false,
    can: () => false,
    canAny: () => false,
  }),
}))

vi.mock('@/features/notifications', () => ({
  NotificationsMenu: () => null,
  NotificationsRealtime: () => null,
}))

vi.mock('@/features/current-user', async (importOriginal) => ({
  ...(await importOriginal<typeof CurrentUser>()),
  // The viewer's avatar comes from the API; these tests do not exercise it.
  useMyAvatarUrl: () => undefined,
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
  isFollowedByMe: false,
  isBlockedByMe: false,
  followerCount: 12,
  followingCount: 3,
  postCount: 5,
}
const otherProfile = {
  ...profile,
  id: '00000000-0000-0000-0000-000000000002',
  username: 'Grace',
  displayName: 'Grace Hopper',
}
const profilePostsPath = `/api/v1/users/${profile.id}/posts`
const otherProfilePostsPath = `/api/v1/users/${otherProfile.id}/posts`
const emptyPosts = { items: [], nextCursor: null }
const firstPost = {
  id: 'post-1',
  authorId: profile.id,
  author: {
    username: profile.username,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl as string | null,
  },
  content: 'First line\nSecond line',
  likeCount: 3,
  commentCount: 2,
  isLikedByMe: false,
  createdAt: '2026-11-08T09:00:00Z',
  modifiedAt: '2026-11-08T09:00:00Z',
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
      String(url).endsWith('/posts')
        ? Response.json(emptyPosts)
        : Response.json(profile),
    )
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('scrollTo', vi.fn())
})

afterEach(() => {
  localStorage.clear()
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
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>,
  )
  return { ...view, router, client }
}

test('loads another user’s profile by username and their posts by GUID', async () => {
  fetchMock.mockImplementation(async (url) => {
    if (url === profilePostsPath) {
      return Response.json({ items: [firstPost], nextCursor: null })
    }
    return Response.json(profile)
  })
  const { container } = openProfile()
  const main = await screen.findByRole('main')
  expect(
    await within(main).findByRole(
      'heading',
      { name: profile.displayName },
      { timeout: 5000 },
    ),
  ).toBeVisible()
  expect(
    screen.getByRole('button', { name: i18n.t('auth.accountMenu.label') }),
  ).toBeVisible()
  expect(
    screen.getByRole('combobox', { name: i18n.t('userSearch.label') }),
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
    await screen.findByRole('tabpanel', { name: i18n.t('profile.posts') }),
  )
  expect(await posts.findByRole('article')).toHaveTextContent('Ada Lovelace')
  expect(posts.getByText('First line Second line')).toBeVisible()
  expect(fetchMock).toHaveBeenCalledTimes(2)
  const [postsUrl, postsInit] = fetchMock.mock.calls[1]
  expect(postsUrl).toBe(profilePostsPath)
  expect(new Headers(postsInit?.headers).get('Authorization')).toBe(
    'Bearer session-token',
  )
  expect(
    screen.queryByRole('button', { name: i18n.t('profile.editProfile') }),
  ).not.toBeInTheDocument()
  await expectNoA11yViolations(container)
})

test('shows bio in Intro and loads each follow list from its tab', async () => {
  const requests = {
    followers: `/api/v1/users/${profile.id}/followers`,
    following: `/api/v1/users/${profile.id}/following`,
  }
  fetchMock.mockImplementation(async (url) =>
    Response.json(
      [profilePostsPath, requests.followers, requests.following].includes(
        String(url),
      )
        ? emptyPosts
        : { ...profile, bio: 'Maths and music' },
    ),
  )
  openProfile()
  expect(await screen.findByText('Maths and music')).toBeVisible()
  expect(
    screen.queryByText(i18n.t('profile.posts'), { selector: 'dt' }),
  ).not.toBeInTheDocument()
  expect(fetchMock.mock.calls.some(([url]) => url === requests.followers)).toBe(
    false,
  )

  await userEvent.click(
    screen.getByRole('tab', { name: i18n.t('profile.follow') }),
  )
  expect(
    await screen.findByText(
      i18n.t('profile.followersEmpty', { name: profile.displayName }),
    ),
  ).toBeVisible()

  await userEvent.click(
    screen.getByRole('tab', { name: i18n.t('profile.following') }),
  )
  expect(
    await screen.findByText(
      i18n.t('profile.followingEmpty', { name: profile.displayName }),
    ),
  ).toBeVisible()
})
test('updates follow state and counts optimistically, then syncs with the server', async () => {
  const path = `/api/v1/users/${profile.id}/follow`
  let state = { isFollowedByMe: false, followerCount: 12 }
  let finishFollow!: (response: Response) => void
  const pending = new Promise<Response>((resolve) => {
    finishFollow = resolve
  })
  fetchMock.mockImplementation(async (url, init) => {
    if (url === path) {
      if (init?.method === 'PUT') {
        state = { isFollowedByMe: true, followerCount: 13 }
        return pending
      }
      state = { isFollowedByMe: false, followerCount: 12 }
      return new Response(null, { status: 204 })
    }
    return Response.json(
      url === profilePostsPath ? emptyPosts : { ...profile, ...state },
    )
  })

  const { client } = openProfile()
  const profileKey = ['profile', profile.username, clerk.userId]
  const follow = await screen.findByRole('button', {
    name: i18n.t('profile.follow'),
  })
  const counts = () =>
    screen.getAllByRole('definition').map((value) => value.textContent)
  expect(counts().slice(0, 2)).toEqual(['12', '3'])
  await userEvent.click(follow)
  expect(
    await screen.findByRole('button', { name: i18n.t('profile.unfollow') }),
  ).toHaveAttribute('aria-busy', 'true')
  expect(counts()[0]).toBe('13')
  expect(client.getQueryData(profileKey)).toMatchObject({
    isFollowedByMe: true,
    followerCount: 13,
  })
  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('profile.unfollow') }),
  )
  const writes = () => fetchMock.mock.calls.filter(([url]) => url === path)
  expect(writes()).toHaveLength(1)
  expect(writes()[0][1]?.method).toBe('PUT')
  expect(new Headers(writes()[0][1]?.headers).get('Authorization')).toBe(
    'Bearer session-token',
  )

  await act(async () => finishFollow(new Response(null, { status: 204 })))
  const unfollow = await screen.findByRole('button', {
    name: i18n.t('profile.unfollow'),
  })
  await waitFor(() => expect(unfollow).not.toHaveAttribute('aria-busy'))
  await userEvent.click(unfollow)
  await waitFor(() =>
    expect(unfollow).toHaveAccessibleName(i18n.t('profile.follow')),
  )
  await waitFor(() => expect(counts()[0]).toBe('12'))
  expect(writes().map(([, init]) => init?.method)).toEqual(['PUT', 'DELETE'])
})

test('keeps the follow action available after a failed request', async () => {
  const path = `/api/v1/users/${profile.id}/follow`
  let isFollowedByMe = false
  const follow = vi
    .fn<() => Response>()
    .mockReturnValueOnce(new Response(null, { status: 503 }))
    .mockReturnValueOnce(new Response(null, { status: 204 }))
  fetchMock.mockImplementation(async (url, init) => {
    if (url === path && init?.method === 'PUT') {
      const response = follow()
      isFollowedByMe = response.ok
      return response
    }
    return Response.json(
      url === profilePostsPath ? emptyPosts : { ...profile, isFollowedByMe },
    )
  })

  openProfile()
  const button = await screen.findByRole('button', {
    name: i18n.t('profile.follow'),
  })
  await userEvent.click(button)
  expect(await screen.findByRole('alert')).toHaveTextContent(
    i18n.t('profile.followError'),
  )
  expect(follow).toHaveBeenCalledTimes(1)
  expect(screen.getAllByRole('definition')[0]).toHaveTextContent('12')
  expect(
    screen.queryByRole('button', { name: i18n.t('profile.unfollow') }),
  ).not.toBeInTheDocument()
  await userEvent.click(button)
  expect(
    await screen.findByRole('button', { name: i18n.t('profile.unfollow') }),
  ).toBeVisible()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('shows Unfollow on the first load of an already followed profile', async () => {
  fetchMock.mockImplementation(async (url) =>
    Response.json(
      url === profilePostsPath
        ? emptyPosts
        : { ...profile, isFollowedByMe: true, followerCount: 3 },
    ),
  )

  const { client } = openProfile()
  expect(
    await screen.findByRole('button', { name: i18n.t('profile.unfollow') }),
  ).toBeEnabled()
  expect(
    client.getQueryData(['profile', profile.username, clerk.userId]),
  ).toMatchObject({ isFollowedByMe: true })
  expect(
    screen.queryByRole('button', { name: i18n.t('profile.follow') }),
  ).not.toBeInTheDocument()
})

const blockPath = `/api/v1/users/${profile.id}/block`
const followPath = `/api/v1/users/${profile.id}/follow`
const moreActions = () =>
  screen.findByRole('button', {
    name: i18n.t('blocks.moreActions', { name: profile.displayName }),
  })

async function openBlockDialog() {
  await userEvent.click(await moreActions())
  await userEvent.click(
    await screen.findByRole('menuitem', {
      name: i18n.t('blocks.blockUser', { username: profile.username }),
    }),
  )
  return screen.findByRole('alertdialog', {
    name: i18n.t('blocks.confirmTitle', { username: profile.username }),
  })
}

test('blocks after confirming, swaps Follow for Unblock and refreshes the counts', async () => {
  // Ada follows the viewer and the viewer follows Ada; blocking removes both.
  let state = { isFollowedByMe: true, isBlockedByMe: false, followerCount: 12 }
  fetchMock.mockImplementation(async (url, init) => {
    if (url === blockPath) {
      state =
        init?.method === 'PUT'
          ? { isFollowedByMe: false, isBlockedByMe: true, followerCount: 11 }
          : { ...state, isBlockedByMe: false }
      return new Response(null, { status: 204 })
    }
    return Response.json(
      url === profilePostsPath
        ? state.isBlockedByMe
          ? emptyPosts
          : { items: [firstPost], nextCursor: null }
        : { ...profile, ...state },
    )
  })
  const { client } = openProfile()
  const counts = () =>
    screen.getAllByRole('definition').map((value) => value.textContent)
  expect(
    await screen.findByRole('button', { name: i18n.t('profile.unfollow') }),
  ).toBeVisible()

  // Notifications are mocked out here; their cached unread count stands in.
  const unreadKey = ['notifications-unread-count', clerk.userId]
  client.setQueryData(unreadKey, { count: 3 })
  const dialog = await openBlockDialog()
  expect(dialog).toHaveTextContent(i18n.t('blocks.confirmDescription'))
  await userEvent.click(
    within(dialog).getByRole('button', { name: i18n.t('blocks.block') }),
  )

  const unblock = await screen.findByRole('button', {
    name: i18n.t('blocks.unblock'),
  })
  expect(
    screen.queryByRole('button', { name: i18n.t('profile.unfollow') }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: i18n.t('profile.follow') }),
  ).not.toBeInTheDocument()
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  expect(screen.getByText(i18n.t('blocks.notice'))).toBeVisible()
  expect(
    await screen.findByText(
      i18n.t('blocks.blocked', { username: profile.username }),
    ),
  ).toBeVisible()
  expect(
    screen.getByText(
      i18n.t('blocks.postsHidden', { username: profile.username }),
    ),
  ).toBeVisible()
  await waitFor(() => expect(counts()[0]).toBe('11'))
  expect(
    client.getQueryData(['profile', profile.username, clerk.userId]),
  ).toMatchObject({ isBlockedByMe: true, isFollowedByMe: false })
  const writes = () => fetchMock.mock.calls.filter(([url]) => url === blockPath)
  expect(writes().map(([, init]) => init?.method)).toEqual(['PUT'])
  // Blocks also hide notifications, so the unread count goes stale.
  expect(client.getQueryState(unreadKey)?.isInvalidated).toBe(true)

  await userEvent.click(unblock)
  // Unblocking doesn't restore the follow.
  expect(
    await screen.findByRole('button', { name: i18n.t('profile.follow') }),
  ).toBeVisible()
  expect(await moreActions()).toBeVisible()
  expect(screen.queryByText(i18n.t('blocks.notice'))).not.toBeInTheDocument()
  expect(writes().map(([, init]) => init?.method)).toEqual(['PUT', 'DELETE'])
})

test('sends nothing when the block confirmation is cancelled', async () => {
  openProfile()
  const dialog = await openBlockDialog()
  await userEvent.click(
    within(dialog).getByRole('button', { name: i18n.t('alertDialog.cancel') }),
  )
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: i18n.t('profile.follow') }),
  ).toBeVisible()
  expect(fetchMock.mock.calls.some(([url]) => url === blockPath)).toBe(false)
})

test('shows Unblock instead of Follow on the first load of a blocked profile', async () => {
  fetchMock.mockImplementation(async (url) =>
    Response.json(
      url === profilePostsPath
        ? emptyPosts
        : { ...profile, isBlockedByMe: true },
    ),
  )
  openProfile()
  expect(
    await screen.findByRole('button', { name: i18n.t('blocks.unblock') }),
  ).toBeVisible()
  expect(
    screen.queryByRole('button', { name: i18n.t('profile.follow') }),
  ).not.toBeInTheDocument()
})

test('reports a failed block and keeps the profile as it was', async () => {
  fetchMock.mockImplementation(async (url) => {
    if (url === blockPath) return new Response(null, { status: 503 })
    return Response.json(url === profilePostsPath ? emptyPosts : profile)
  })
  openProfile()
  const dialog = await openBlockDialog()
  await userEvent.click(
    within(dialog).getByRole('button', { name: i18n.t('blocks.block') }),
  )
  expect(await screen.findByText(i18n.t('blocks.blockError'))).toBeVisible()
  expect(
    screen.getByRole('button', { name: i18n.t('profile.follow') }),
  ).toBeVisible()
  expect(
    screen.queryByRole('button', { name: i18n.t('blocks.unblock') }),
  ).not.toBeInTheDocument()
})

test('shows the generic block message when following returns 403, and rolls back', async () => {
  const follow = vi.fn(() =>
    Response.json({ code: 'UserBlock.Blocked' }, { status: 403 }),
  )
  fetchMock.mockImplementation(async (url, init) => {
    if (url === followPath && init?.method === 'PUT') return follow()
    return Response.json(url === profilePostsPath ? emptyPosts : profile)
  })
  openProfile()
  await userEvent.click(
    await screen.findByRole('button', { name: i18n.t('profile.follow') }),
  )
  expect(await screen.findByRole('alert')).toHaveTextContent(
    i18n.t('blocks.actionBlocked'),
  )
  expect(screen.getAllByRole('definition')[0]).toHaveTextContent('12')
  expect(
    screen.getByRole('button', { name: i18n.t('profile.follow') }),
  ).toBeVisible()
  expect(follow).toHaveBeenCalledTimes(1)
})

test('offers no block controls on the viewer’s own profile', async () => {
  clerk.username = 'Ada'
  openProfile()
  await screen.findByRole('button', { name: i18n.t('profile.editProfile') })
  expect(
    screen.queryByRole('button', {
      name: i18n.t('blocks.moreActions', { name: profile.displayName }),
    }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: i18n.t('blocks.unblock') }),
  ).not.toBeInTheDocument()
})

test('announces loading and empty suggestions while keeping focus in the input', async () => {
  let finishSuggestions!: (response: Response) => void
  const pending = new Promise<Response>((resolve) => {
    finishSuggestions = resolve
  })
  fetchMock.mockImplementation(async (url) => {
    if (url === '/api/v1/users/search?q=missing') return pending
    return String(url).endsWith('/posts')
      ? Response.json(emptyPosts)
      : Response.json(profile)
  })
  openProfile()
  const search = await screen.findByRole('search', {
    name: i18n.t('userSearch.label'),
  })
  const input = within(search).getByRole('combobox')
  await userEvent.click(input)
  fireEvent.change(input, { target: { value: 'missing' } })
  const status = within(search).getByRole('status')
  await waitFor(() =>
    expect(status).toHaveTextContent(i18n.t('userSearch.loadingSuggestions')),
  )
  expect(input).toHaveFocus()
  await act(async () =>
    finishSuggestions(Response.json({ items: [], nextCursor: null })),
  )
  const hint = i18n.t('userSearch.noSuggestionsHint')
  await waitFor(() => expect(status).toHaveTextContent(hint))
  expect(within(search).getByText(hint, { exact: true })).toBeVisible()
  expect(within(search).queryByRole('listbox')).not.toBeInTheDocument()
  expect(input).toHaveFocus()
  expect(input).toHaveValue('missing')
})

test('shows the custom avatar image for a suggested user', async () => {
  fetchMock.mockImplementation(async (url) => {
    if (url === '/api/v1/users/search?q=Ada')
      return Response.json({ items: [profile], nextCursor: null })
    return String(url).endsWith('/posts')
      ? Response.json(emptyPosts)
      : Response.json(profile)
  })
  openProfile()
  const input = await screen.findByRole('combobox', {
    name: i18n.t('userSearch.label'),
  })
  fireEvent.change(input, { target: { value: 'Ada' } })
  const option = await screen.findByRole('option', {
    name: 'Ada Lovelace @Ada',
  })
  expect(option.querySelector('img')).toHaveAttribute('src', profile.avatarUrl)
})

test('ignores superseded suggestions and opens the highlighted profile with the keyboard', async () => {
  let finishOldRequest!: (response: Response) => void
  const oldRequest = new Promise<Response>((resolve) => {
    finishOldRequest = resolve
  })
  fetchMock.mockImplementation(async (url) => {
    if (url === '/api/v1/users/search?q=A') return oldRequest
    if (url === '/api/v1/users/search?q=Grace') {
      return Response.json({
        items: [{ ...otherProfile, avatarUrl: null }],
        nextCursor: null,
      })
    }
    return String(url).endsWith('/posts')
      ? Response.json(emptyPosts)
      : Response.json(
          url === '/api/v1/users/by-username/Grace' ? otherProfile : profile,
        )
  })
  const { router, container } = openProfile()
  const input = await screen.findByRole('combobox', {
    name: i18n.t('userSearch.label'),
  })
  await userEvent.click(input)
  fireEvent.change(input, { target: { value: 'A' } })
  await waitFor(() =>
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/users/search?q=A',
      expect.anything(),
    ),
  )
  const [, request] = fetchMock.mock.calls.find(
    ([url]) => url === '/api/v1/users/search?q=A',
  )!
  expect(new Headers(request?.headers).get('Authorization')).toBe(
    'Bearer session-token',
  )

  fireEvent.change(input, { target: { value: ' Grace ' } })
  const option = await screen.findByRole('option', {
    name: 'Grace Hopper @Grace',
  })
  expect(request?.signal?.aborted).toBe(true)
  expect(option.querySelector('svg')).toBeInTheDocument()
  await act(async () => finishOldRequest(Response.json([profile])))
  expect(screen.getAllByRole('option')).toEqual([option])
  await expectNoA11yViolations(container)

  await userEvent.keyboard('{ArrowDown}')
  expect(input).toHaveAttribute('aria-activedescendant', option.id)
  await userEvent.keyboard('{Escape}')
  expect(input).toHaveValue(' Grace ')
  expect(input).toHaveFocus()
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  await userEvent.keyboard('{ArrowDown}')
  expect(await screen.findByRole('listbox')).toBeVisible()
  expect(input).toHaveAttribute('aria-activedescendant', option.id)
  await userEvent.keyboard('{Enter}')
  await waitFor(() => expect(router.state.location.pathname).toBe('/@Grace'))
  const heading = await screen.findByRole('heading', {
    name: otherProfile.displayName,
  })
  await waitFor(() => expect(heading).toHaveFocus())
})

test('opens a clicked suggestion without focusing the profile heading', async () => {
  {
    fetchMock.mockImplementation(async (url) => {
      if (url === '/api/v1/users/search?q=Grace')
        return Response.json({ items: [otherProfile], nextCursor: null })
      if (String(url).endsWith('/posts')) return Response.json(emptyPosts)
      return Response.json(
        url === '/api/v1/users/by-username/Grace' ? otherProfile : profile,
      )
    })
    const { container, router } = openProfile('/@Ada')
    const identity = { name: 'Grace Hopper @Grace' }
    await screen.findByRole('heading', { name: profile.displayName })
    const input = screen.getByRole('combobox', {
      name: i18n.t('userSearch.label'),
    })
    await userEvent.type(input, 'Grace')
    await userEvent.click(await screen.findByRole('option', identity))

    const heading = await screen.findByRole('heading', {
      name: otherProfile.displayName,
    })
    const region = container.querySelector('[aria-live="polite"]')
    await waitFor(() =>
      expect(region).toHaveTextContent(
        i18n.t('pageNavigation.announcement', {
          page: otherProfile.displayName,
        }),
      ),
    )
    expect(router.state.location.pathname).toBe('/@Grace')
    expect(heading).not.toHaveFocus()
  }
})

test('lists the search in the panel, pages it with the cursor and never leaves the page', async () => {
  const firstPage = '/api/v1/users/search?q=Ada'
  const nextPage = `${firstPage}&cursor=opaque%2B%2F%3D`
  fetchMock.mockImplementation(async (url) => {
    if (url === firstPage)
      return Response.json({ items: [profile], nextCursor: 'opaque+/=' })
    if (url === nextPage)
      return Response.json({ items: [otherProfile], nextCursor: null })
    if (url === '/api/v1/users/search?q=none')
      return Response.json({ items: [], nextCursor: null })
    return String(url).endsWith('/posts')
      ? Response.json(emptyPosts)
      : Response.json(profile)
  })
  const { router } = openProfile()
  const input = await screen.findByRole('combobox', {
    name: i18n.t('userSearch.label'),
  })
  await userEvent.type(input, ' Ada {Enter}')
  expect(
    await screen.findByRole('option', { name: 'Ada Lovelace @Ada' }),
  ).toBeVisible()
  // Enter keeps the page and the panel: the results are the panel's list.
  expect(router.state.location.pathname).toBe('/@Ada')

  const more = i18n.t('userSearch.loadMore')
  await userEvent.click(screen.getByRole('button', { name: more }))
  expect(
    await screen.findByRole('option', { name: 'Grace Hopper @Grace' }),
  ).toBeVisible()
  expect(screen.queryByRole('button', { name: more })).not.toBeInTheDocument()

  await userEvent.clear(input)
  await userEvent.type(input, 'none{Enter}')
  expect(
    await screen.findByText(i18n.t('userSearch.noSuggestionsHint')),
  ).toBeVisible()
  expect(
    screen.queryByRole('option', { name: 'Ada Lovelace @Ada' }),
  ).not.toBeInTheDocument()
  expect(
    fetchMock.mock.calls
      .map(([url]) => url)
      .filter((url) => String(url).includes('/users/search?')),
  ).toEqual([firstPage, nextPage, '/api/v1/users/search?q=none'])
})

test('shows the author from each post, using the default silhouette when avatarUrl is null', async () => {
  fetchMock.mockImplementation(async (url) => {
    if (url === profilePostsPath) {
      return Response.json({
        items: [
          {
            ...firstPost,
            author: { ...firstPost.author, avatarUrl: null },
          },
        ],
        nextCursor: null,
      })
    }
    return Response.json(profile)
  })
  openProfile()
  const article = await screen.findByRole('article')
  expect(article).toHaveTextContent('Ada Lovelace')
  expect(article).toHaveTextContent('Ada Lovelace')
  expect(within(article).queryByRole('img')).not.toBeInTheDocument()
  expect(article.querySelector('svg')).toBeInTheDocument()
  expect(
    fetchMock.mock.calls.filter(([url]) => String(url).includes('/users/')),
  ).toHaveLength(2)
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
  expect(await posts.findByRole('article')).toHaveTextContent('Ada Lovelace')
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
  expect(tabs.getAllByRole('tab')).toHaveLength(3)
  postsTab.focus()
  await userEvent.keyboard('{ArrowRight}')
  expect(
    screen.getByRole('tabpanel', { name: i18n.t('profile.media') }),
  ).toHaveTextContent(i18n.t('profile.mediaUnavailable'))
  await userEvent.click(postsTab)
  expect(screen.getByText('An older post')).toBeVisible()

  fetchMock.mockImplementation(async (url) =>
    Response.json(url === otherProfilePostsPath ? emptyPosts : otherProfile),
  )
  await act(async () => {
    await router.navigate('/@Grace')
  })
  expect(
    await screen.findByRole('heading', { name: 'Grace Hopper' }),
  ).toBeVisible()
  expect(
    await screen.findByRole('heading', { name: i18n.t('posts.empty') }),
  ).toBeVisible()
  expect(screen.queryByRole('article')).not.toBeInTheDocument()
  expect(fetchMock.mock.lastCall?.[0]).toBe(otherProfilePostsPath)
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

test('uses the profile API avatar for the owner even without a custom Clerk image', async () => {
  clerk.username = 'Ada'
  clerk.hasImage = false
  openProfile()
  await screen.findByRole('heading', { name: profile.displayName })
  expect(
    screen.getByRole('img', { name: profile.displayName }),
  ).toHaveAttribute('src', profile.avatarUrl)
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
  await waitFor(() => {
    const main = screen.getByRole('main')
    expect(within(main).getByRole('status', { busy: true })).toBeVisible()
  })
  expect(fetchMock).not.toHaveBeenCalled()
})

test('shows a loading state until the API responds', async () => {
  let resolveResponse!: (response: Response) => void
  fetchMock.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveResponse = resolve
      }),
  )
  openProfile()
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
  expect(
    within(screen.getByRole('main')).getByRole('status', { busy: true }),
  ).toBeVisible()
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
  fetchMock.mockImplementation(async (url) =>
    Response.json(url === profilePostsPath ? emptyPosts : profile),
  )
  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('common.retry') }),
  )
  expect(
    await screen.findByRole('heading', { name: profile.displayName }),
  ).toBeVisible()
})

test('loads the new profile and its posts when switching between other users', async () => {
  fetchMock.mockImplementation(async (url) => {
    if (url === profilePostsPath) {
      return Response.json({ items: [firstPost], nextCursor: null })
    }
    if (url === otherProfilePostsPath) {
      return Response.json(emptyPosts)
    }
    return Response.json(
      url === '/api/v1/users/by-username/Grace' ? otherProfile : profile,
    )
  })
  const { router } = openProfile()
  expect(await screen.findByRole('article')).toHaveTextContent('Ada Lovelace')
  await act(async () => {
    await router.navigate('/@Grace')
  })
  expect(
    await screen.findByRole('heading', { name: 'Grace Hopper' }),
  ).toBeVisible()
  expect(
    await screen.findByRole('heading', { name: i18n.t('posts.empty') }),
  ).toBeVisible()
  expect(screen.queryByText('@Ada')).not.toBeInTheDocument()
  expect(screen.queryByRole('article')).not.toBeInTheDocument()
  expect(fetchMock.mock.lastCall?.[0]).toBe(otherProfilePostsPath)
})

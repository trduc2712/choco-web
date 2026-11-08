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
  isFollowedByMe: false,
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
      <RouterProvider router={router} />
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
  expect(container.querySelector('header:not(main header)')).toBeNull()
  expect(screen.getByRole('link', { name: 'Choco' })).toHaveAttribute(
    'href',
    '/',
  )
  expect(
    screen.getByRole('button', { name: i18n.t('auth.accountMenu.label') }),
  ).toHaveTextContent('@viewer')
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
  expect(await posts.findByRole('article')).toHaveTextContent('@Ada')
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

test.each([
  { api: 'current', returnsFollowState: true },
  { api: 'legacy', returnsFollowState: false },
])(
  'keeps follow and unfollow results across reloads with the $api profile API',
  async ({ returnsFollowState }) => {
    const path = `/api/v1/users/${profile.id}/follow`
    let isFollowedByMe = false
    let finishFollow!: (response: Response) => void
    const pending = new Promise<Response>((resolve) => {
      finishFollow = resolve
    })
    fetchMock.mockImplementation(async (url, init) => {
      if (url === path) {
        isFollowedByMe = init?.method === 'PUT'
        return init?.method === 'PUT'
          ? pending
          : new Response(null, { status: 204 })
      }
      return Response.json(
        url === profilePostsPath
          ? emptyPosts
          : {
              ...profile,
              isFollowedByMe: returnsFollowState ? isFollowedByMe : undefined,
            },
      )
    })

    const initialView = openProfile()
    const profileKey = ['profile', profile.username, clerk.userId]
    const follow = await screen.findByRole('button', {
      name: i18n.t('profile.follow'),
    })
    expect(follow).toBeEnabled()
    expect(initialView.client.getQueryData(profileKey)).toMatchObject({
      isFollowedByMe: false,
    })
    expect(
      screen.queryByRole('button', { name: i18n.t('profile.unfollow') }),
    ).not.toBeInTheDocument()
    await userEvent.click(follow)
    expect(follow).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(follow)
    const writes = () => fetchMock.mock.calls.filter(([url]) => url === path)
    expect(writes()).toHaveLength(1)
    expect(writes()[0][1]?.method).toBe('PUT')
    expect(new Headers(writes()[0][1]?.headers).get('Authorization')).toBe(
      'Bearer session-token',
    )

    await act(async () => finishFollow(new Response(null, { status: 204 })))
    expect(
      await screen.findByRole('button', {
        name: i18n.t('profile.unfollow'),
      }),
    ).toBeVisible()
    expect(initialView.client.getQueryData(profileKey)).toMatchObject({
      isFollowedByMe: true,
    })
    expect(
      screen.queryByRole('button', { name: i18n.t('profile.follow') }),
    ).not.toBeInTheDocument()
    initialView.unmount()

    const reloadedView = openProfile()
    expect(reloadedView.client.getQueryData(profileKey)).toBeUndefined()
    const unfollow = await screen.findByRole('button', {
      name: i18n.t('profile.unfollow'),
    })
    expect(reloadedView.client.getQueryData(profileKey)).toMatchObject({
      isFollowedByMe: true,
    })
    await userEvent.click(unfollow)
    await waitFor(() =>
      expect(unfollow).toHaveAccessibleName(i18n.t('profile.follow')),
    )
    reloadedView.unmount()

    const finalView = openProfile()
    expect(
      await screen.findByRole('button', {
        name: i18n.t('profile.follow'),
      }),
    ).toBeEnabled()
    expect(finalView.client.getQueryData(profileKey)).toMatchObject({
      isFollowedByMe: false,
    })
    expect(
      screen.queryByRole('button', { name: i18n.t('profile.unfollow') }),
    ).not.toBeInTheDocument()
    expect(writes().map(([, init]) => init?.method)).toEqual(['PUT', 'DELETE'])
  },
)

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

test('announces loading and empty suggestions while keeping focus in the input', async () => {
  let finishSuggestions!: (response: Response) => void
  const pending = new Promise<Response>((resolve) => {
    finishSuggestions = resolve
  })
  fetchMock.mockImplementation(async (url) => {
    if (url === '/api/v1/users/suggestions?q=missing') return pending
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
  await act(async () => finishSuggestions(Response.json([])))
  const hint = i18n.t('userSearch.noSuggestionsHint')
  await waitFor(() => expect(status).toHaveTextContent(hint))
  expect(within(search).getByText(hint, { exact: true })).toBeVisible()
  expect(within(search).queryByRole('listbox')).not.toBeInTheDocument()
  expect(input).toHaveFocus()
  expect(input).toHaveValue('missing')
})

test('uses initials for a suggested user who has an avatar URL', async () => {
  fetchMock.mockImplementation(async (url) => {
    if (url === '/api/v1/users/suggestions?q=Ada')
      return Response.json([profile])
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
  expect(option).toHaveTextContent('AL')
  expect(option.querySelector('img')).toBeNull()
})

test('ignores superseded suggestions and opens the highlighted profile with the keyboard', async () => {
  let finishOldRequest!: (response: Response) => void
  const oldRequest = new Promise<Response>((resolve) => {
    finishOldRequest = resolve
  })
  fetchMock.mockImplementation(async (url) => {
    if (url === '/api/v1/users/suggestions?q=A') return oldRequest
    if (url === '/api/v1/users/suggestions?q=Grace') {
      return Response.json([{ ...otherProfile, avatarUrl: null }])
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
      '/api/v1/users/suggestions?q=A',
      expect.anything(),
    ),
  )
  const [, request] = fetchMock.mock.calls.find(
    ([url]) => url === '/api/v1/users/suggestions?q=A',
  )!
  expect(new Headers(request?.headers).get('Authorization')).toBe(
    'Bearer session-token',
  )

  fireEvent.change(input, { target: { value: ' Grace ' } })
  const option = await screen.findByRole('option', {
    name: 'Grace Hopper @Grace',
  })
  expect(request?.signal?.aborted).toBe(true)
  expect(option).toHaveTextContent('GH')
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
  expect(
    fetchMock.mock.calls.some(([url]) => String(url).includes('/users/search')),
  ).toBe(false)
})

test.each(['suggestion', 'result'])(
  'opens a clicked %s without focusing the profile heading',
  async (source) => {
    fetchMock.mockImplementation(async (url) => {
      if (url === '/api/v1/users/suggestions?q=Grace')
        return Response.json([otherProfile])
      if (url === '/api/v1/users/search?q=Grace')
        return Response.json({ items: [otherProfile], nextCursor: null })
      if (String(url).endsWith('/posts')) return Response.json(emptyPosts)
      return Response.json(
        url === '/api/v1/users/by-username/Grace' ? otherProfile : profile,
      )
    })
    const { container, router } = openProfile(
      source === 'result' ? '/search?q=Grace' : '/@Ada',
    )
    const identity = { name: 'Grace Hopper @Grace' }
    if (source === 'suggestion') {
      await screen.findByRole('heading', { name: profile.displayName })
      const input = screen.getByRole('combobox', {
        name: i18n.t('userSearch.label'),
      })
      await userEvent.type(input, 'Grace')
      await userEvent.click(await screen.findByRole('option', identity))
    } else {
      await userEvent.click(await screen.findByRole('link', identity))
    }

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
  },
)

test('submits the trimmed query and uses the cursor only for the matching search', async () => {
  const firstPage = '/api/v1/users/search?q=Ada'
  const nextPage = `${firstPage}&cursor=opaque%2B%2F%3D`
  fetchMock.mockImplementation(async (url) => {
    if (url === firstPage)
      return Response.json({ items: [profile], nextCursor: 'opaque+/=' })
    if (url === nextPage)
      return Response.json({ items: [otherProfile], nextCursor: null })
    if (url === '/api/v1/users/search?q=none') return Response.json(emptyPosts)
    if (String(url).includes('/suggestions?')) return Response.json([])
    return String(url).endsWith('/posts')
      ? Response.json(emptyPosts)
      : Response.json(profile)
  })
  const { router } = openProfile()
  const input = await screen.findByRole('combobox', {
    name: i18n.t('userSearch.label'),
  })
  await userEvent.type(input, ' Ada {Enter}')
  const ada = await screen.findByRole('link', { name: 'Ada Lovelace @Ada' })
  expect(ada).toHaveAttribute('href', '/@Ada')
  expect(router.state.location.search).toBe('?q=Ada')

  const more = i18n.t('userSearch.loadMore')
  const loadMore = screen.getByRole('button', { name: more })
  loadMore.focus()
  await userEvent.keyboard('{Enter}')
  const grace = await screen.findByRole('link', { name: 'Grace Hopper @Grace' })
  expect(grace).toHaveAttribute('href', '/@Grace')
  await waitFor(() => expect(grace).toHaveFocus())
  expect(ada).toBeVisible()
  expect(screen.queryByRole('button', { name: more })).not.toBeInTheDocument()

  const resultsInput = screen.getByRole('combobox', {
    name: i18n.t('userSearch.label'),
  })
  await userEvent.clear(resultsInput)
  await userEvent.type(resultsInput, 'none{Enter}')
  expect(await screen.findByText(i18n.t('userSearch.empty'))).toBeVisible()
  expect(
    screen.queryByRole('link', { name: 'Ada Lovelace @Ada' }),
  ).not.toBeInTheDocument()
  expect(
    fetchMock.mock.calls
      .map(([url]) => url)
      .filter((url) => String(url).includes('/users/search?')),
  ).toEqual([firstPage, nextPage, '/api/v1/users/search?q=none'])
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
  expect(await screen.findByRole('article')).toHaveTextContent('@Ada')
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

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ToastProvider } from '@/components/toast/toast-provider'
import { BLOCKED_USERS_PATH } from '@/constants/routes'
import type * as CurrentUser from '@/features/current-user'
import { i18n } from '@/i18n/i18n'
import { queryClient } from '@/lib/query-client'
import { router as appRouter } from '@/router'
import { expectNoA11yViolations } from '@/test/a11y'

// The app layout asks for the viewer's permissions; these tests count requests.
vi.mock('@/features/current-user/use-permissions', () => ({
  usePermissions: () => ({
    isLoading: false,
    can: () => false,
    canAny: () => false,
  }),
}))

vi.mock('@/features/current-user', async (importOriginal) => ({
  ...(await importOriginal<typeof CurrentUser>()),
  // The viewer's avatar comes from the API; these tests do not exercise it.
  useMyAvatarUrl: () => undefined,
}))

vi.mock('@clerk/react', () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'clerk-viewer',
    getToken: async () => 'session-token',
  }),
  useUser: () => ({ user: { username: 'viewer', hasImage: false } }),
  useClerk: () => ({}),
}))

const grace = {
  id: '00000000-0000-0000-0000-0000000000a1',
  username: 'Grace',
  displayName: 'Grace Hopper',
  avatarUrl: null,
  isFollowedByMe: false,
}
const linus = {
  id: '00000000-0000-0000-0000-0000000000a2',
  username: 'Linus',
  displayName: '',
  avatarUrl: null,
  isFollowedByMe: false,
}
const firstPage = '/api/v1/me/blocks'
const nextPage = '/api/v1/me/blocks?cursor=opaque%2B%2F%3D'

const fetchMock = vi.fn<typeof fetch>()
const routers: ReturnType<typeof createMemoryRouter>[] = []

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('scrollTo', vi.fn())
})

afterEach(() => {
  routers.splice(0).forEach((router) => router.dispose())
  vi.unstubAllGlobals()
})

function openPage(path = BLOCKED_USERS_PATH) {
  const router = createMemoryRouter(appRouter.routes, {
    initialEntries: [path],
  })
  routers.push(router)
  const client = new QueryClient({
    defaultOptions: {
      queries: { ...queryClient.getDefaultOptions().queries, retryDelay: 0 },
    },
  })
  const view = render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>,
  )
  return { ...view, router }
}

test('lists blocked users page by page and unblocks one, removing the row', async () => {
  const unblocks: string[] = []
  fetchMock.mockImplementation(async (input, init) => {
    const url = String(input)
    if (url === firstPage)
      return Response.json({ items: [grace], nextCursor: 'opaque+/=' })
    if (url === nextPage)
      return Response.json({ items: [linus], nextCursor: null })
    if (url === `/api/v1/users/${grace.id}/block`) {
      unblocks.push(init?.method ?? 'GET')
      return new Response(null, { status: 204 })
    }
    return Response.json({}, { status: 404 })
  })
  const { container } = openPage()

  expect(
    await screen.findByRole(
      'heading',
      { level: 1, name: i18n.t('blocks.title') },
      { timeout: 5000 },
    ),
  ).toBeVisible()
  expect(
    await screen.findByRole('link', { name: 'Grace Hopper @Grace' }),
  ).toHaveAttribute('href', '/@Grace')
  expect(
    screen.queryByRole('button', { name: i18n.t('userSearch.follow') }),
  ).not.toBeInTheDocument()
  await expectNoA11yViolations(container)

  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('userSearch.loadMore') }),
  )
  expect(
    await screen.findByRole('link', { name: 'Linus @Linus' }),
  ).toBeVisible()

  const row = screen.getByRole('link', {
    name: 'Grace Hopper @Grace',
  }).parentElement!
  await userEvent.click(
    within(row).getByRole('button', {
      name: i18n.t('blocks.unblockUser', { name: 'Grace Hopper' }),
    }),
  )
  await waitFor(() =>
    expect(
      screen.queryByRole('link', { name: 'Grace Hopper @Grace' }),
    ).not.toBeInTheDocument(),
  )
  expect(
    await screen.findByText(i18n.t('blocks.unblocked', { username: 'Grace' })),
  ).toBeVisible()
  expect(screen.getByRole('link', { name: 'Linus @Linus' })).toBeVisible()
  expect(unblocks).toEqual(['DELETE'])
})

test('keeps the row and reports a failed unblock', async () => {
  fetchMock.mockImplementation(async (input) => {
    const url = String(input)
    if (url === firstPage)
      return Response.json({ items: [grace], nextCursor: null })
    if (url.endsWith('/block')) return new Response(null, { status: 503 })
    return Response.json({}, { status: 404 })
  })
  openPage()
  await userEvent.click(
    await screen.findByRole(
      'button',
      { name: i18n.t('blocks.unblockUser', { name: 'Grace Hopper' }) },
      { timeout: 5000 },
    ),
  )
  expect(await screen.findByText(i18n.t('blocks.unblockError'))).toBeVisible()
  expect(
    screen.getByRole('link', { name: 'Grace Hopper @Grace' }),
  ).toBeVisible()
})

test('says when nobody is blocked', async () => {
  fetchMock.mockImplementation(async () =>
    Response.json({ items: [], nextCursor: null }),
  )
  openPage()
  expect(
    await screen.findByText(i18n.t('blocks.empty'), undefined, {
      timeout: 5000,
    }),
  ).toBeVisible()
})

test('opens from the account menu', async () => {
  fetchMock.mockImplementation(async () =>
    Response.json({ items: [], nextCursor: null }),
  )
  const { router } = openPage('/search')
  await userEvent.click(
    await screen.findByRole(
      'button',
      { name: i18n.t('auth.accountMenu.label') },
      { timeout: 5000 },
    ),
  )
  await userEvent.click(
    await screen.findByRole('button', {
      name: i18n.t('auth.accountMenu.settings'),
    }),
  )
  await userEvent.click(
    await screen.findByRole('button', { name: i18n.t('blocks.title') }),
  )
  await waitFor(() =>
    expect(router.state.location.pathname).toBe(BLOCKED_USERS_PATH),
  )
})

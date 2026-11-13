import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ToastProvider } from '@/components/toast/toast-provider'
import { DESIGN_SYSTEM_PATH } from '@/constants/routes'
import type * as CurrentUser from '@/features/current-user'
import { i18n } from '@/i18n/i18n'
import { AppLayout } from '@/layouts/app-layout'
import { HomePage } from '@/pages/home-page/home-page'
import { startingWith } from '@/test/text'

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
  useAuth: () => ({
    userId: 'user_ada',
    isLoaded: true,
    isSignedIn: true,
    getToken: async () => 'test-token',
  }),
  useUser: () => ({
    user: { fullName: 'Ada Lovelace', username: 'Ada', hasImage: false },
  }),
  useClerk: () => ({ signOut: vi.fn() }),
}))

const fetchMock = vi.fn<typeof fetch>()
const ME = '00000000-0000-0000-0000-00000000000a'
const feedRequests: string[] = []
const recommendedPosts = Array.from({ length: 10 }, (_, index) => ({
  id: `recommended-${index}`,
  authorId: 'author-2',
  author: { username: 'Grace', displayName: 'Grace Hopper', avatarUrl: null },
  content: `Recommended post ${index}`,
  likeCount: 3,
  commentCount: 2,
  isLikedByMe: false,
  createdAt: '2026-11-07T09:00:00Z',
  modifiedAt: '2026-11-07T09:00:00Z',
}))

// The feed requests and the viewer reads are answered here so fetchMock only
// sees the composer's requests.
function routedFetch(input: Parameters<typeof fetch>[0], init?: RequestInit) {
  const url = String(input).replace(/^.*\/api\/v1/, '')
  if (url === '/me') return Promise.resolve(Response.json({ id: ME }))
  if (url === `/users/${ME}`) {
    return Promise.resolve(
      Response.json({
        id: ME,
        username: 'ada',
        displayName: 'Ada Lovelace',
        avatarUrl: null,
        followingCount: 2,
      }),
    )
  }
  if (url.startsWith('/me/feed/')) {
    feedRequests.push(url)
    const items = url.startsWith('/me/feed/recommended') ? recommendedPosts : []
    return Promise.resolve(Response.json({ items, nextCursor: null }))
  }
  return fetchMock(input, init)
}

beforeEach(() => {
  fetchMock.mockReset()
  feedRequests.length = 0
  vi.stubGlobal('fetch', routedFetch)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderHome() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <ToastProvider>
        <MemoryRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="/@Ada" element={<h1>Profile destination</h1>} />
            </Route>
            <Route
              path={DESIGN_SYSTEM_PATH}
              element={<h1>Ares destination</h1>}
            />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

test('shows the publish response above the recommended feed without requesting the personal post list', async () => {
  const post = {
    id: 'post-1',
    authorId: 'author-1',
    author: { username: 'Ada', displayName: 'Ada Lovelace', avatarUrl: null },
    content: 'First line\nSecond line',
    likeCount: 3,
    commentCount: 2,
    isLikedByMe: false,
    createdAt: '2026-11-08T09:00:00Z',
    modifiedAt: '2026-11-08T09:00:00Z',
  }
  fetchMock.mockResolvedValueOnce(Response.json(post, { status: 201 }))
  const { unmount } = renderHome()

  const posts = within(screen.getByRole('main'))
  expect(
    screen.getByRole('combobox', { name: i18n.t('userSearch.label') }),
  ).toBeVisible()
  expect(
    screen.getByRole('link', { name: i18n.t('home.feed') }),
  ).toHaveAttribute('aria-current', 'page')

  await userEvent.click(
    posts.getByRole('button', { name: i18n.t('postComposer.placeholder') }),
  )
  const editor = screen.getByRole('textbox', {
    name: i18n.t('postComposer.body'),
  })
  const submit = screen.getByRole('button', {
    name: i18n.t('postComposer.post'),
  })
  expect(submit).toBeDisabled()
  expect(await posts.findAllByRole('article')).toHaveLength(10)
  expect(feedRequests).toHaveLength(1)
  expect(feedRequests[0]).toMatch(/^\/me\/feed\/recommended\?/)
  expect(fetchMock).not.toHaveBeenCalled()
  await userEvent.type(editor, 'First line{enter}Second line')
  expect(submit).toBeEnabled()
  await userEvent.click(submit)
  await waitFor(() => expect(editor).toHaveValue(''))
  expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
    '/api/v1/posts',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ content: post.content }),
    }),
  )
  expect(
    new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('Authorization'),
  ).toBe('Bearer test-token')
  expect(posts.getAllByRole('article')[0]).toHaveTextContent(
    'First line Second line',
  )
  expect(posts.getAllByRole('article')[0]).toHaveTextContent('Ada Lovelace')
  expect(
    within(posts.getAllByRole('article')[0]).getByRole('link', {
      name: 'Ada Lovelace',
    }),
  ).toHaveAttribute('href', '/@Ada')

  expect(posts.getAllByRole('article')).toHaveLength(11)

  await userEvent.click(posts.getAllByRole('article')[0])
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

  unmount()
  renderHome()
  expect(screen.queryByText('First line Second line')).not.toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

test('blocks a second submission while publishing and preserves the draft on failure', async () => {
  let resolveResponse!: (response: Response) => void
  const response = new Promise<Response>((resolve) => {
    resolveResponse = resolve
  })
  fetchMock.mockReturnValue(response)
  renderHome()

  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('postComposer.placeholder') }),
  )
  const editor = screen.getByRole('textbox', {
    name: i18n.t('postComposer.body'),
  })
  const submit = screen.getByRole('button', {
    name: i18n.t('postComposer.post'),
  })
  const form = editor.closest('form')!

  await userEvent.type(editor, 'Keep this draft')
  await userEvent.click(submit)
  expect(submit).toBeDisabled()
  fireEvent.submit(form)

  resolveResponse(Response.json({}, { status: 500 }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    i18n.t('postComposer.publishError'),
  )
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(editor).toHaveValue('Keep this draft')
  expect(submit).toBeEnabled()

  const post = {
    id: 'post-2',
    authorId: 'author-1',
    author: { username: 'Ada', displayName: 'Ada Lovelace', avatarUrl: null },
    content: 'Keep this draft',
    likeCount: 3,
    commentCount: 2,
    isLikedByMe: false,
    createdAt: '2026-11-08T09:00:00Z',
    modifiedAt: '2026-11-08T09:00:00Z',
  }
  fetchMock.mockResolvedValueOnce(Response.json(post, { status: 201 }))
  await userEvent.click(submit)
  await waitFor(() => expect(editor).toHaveValue(''))
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('the account dropdown shows the profile, a short list and two levels of settings', async () => {
  renderHome()

  const account = screen.getByRole('button', {
    name: i18n.t('auth.accountMenu.label'),
  })
  expect(
    within(account)
      .getByRole('img', { name: 'Ada Lovelace' })
      .querySelector('svg'),
  ).toBeInTheDocument()

  await userEvent.click(account)
  const panel = within(screen.getByRole('dialog'))
  expect(panel.getByText('Ada Lovelace')).toBeVisible()
  for (const label of [
    i18n.t('auth.accountMenu.settings'),
    i18n.t('auth.accountMenu.display'),
    i18n.t('feedback.menuItem'),
    i18n.t('auth.accountMenu.signOut'),
  ]) {
    expect(panel.getByRole('button', { name: label })).toBeVisible()
  }

  // Settings and privacy holds language, blocked users and the account page.
  await userEvent.click(
    panel.getByRole('button', { name: i18n.t('auth.accountMenu.settings') }),
  )
  expect(
    panel.getByRole('button', { name: startingWith(i18n.t('language.label')) }),
  ).toBeVisible()
  expect(
    panel.getByRole('button', { name: i18n.t('blocks.title') }),
  ).toBeVisible()
  expect(
    panel.getByRole('button', {
      name: i18n.t('auth.accountMenu.manageAccount'),
    }),
  ).toBeVisible()
  await userEvent.click(
    panel.getByRole('button', { name: i18n.t('auth.accountMenu.back') }),
  )

  // Display holds the theme choices.
  await userEvent.click(
    panel.getByRole('button', { name: i18n.t('auth.accountMenu.display') }),
  )
  for (const label of [
    i18n.t('theme.system'),
    i18n.t('theme.light'),
    i18n.t('theme.dark'),
  ]) {
    expect(panel.getByRole('button', { name: label })).toBeVisible()
  }
  await userEvent.click(
    panel.getByRole('button', { name: i18n.t('auth.accountMenu.back') }),
  )

  await userEvent.click(
    panel.getByRole('button', { name: i18n.t('auth.accountMenu.viewProfile') }),
  )
  expect(
    screen.getByRole('heading', { name: 'Profile destination' }),
  ).toBeVisible()

  await userEvent.click(account)
  await userEvent.click(
    screen.getByRole('button', {
      name: i18n.t('auth.accountMenu.designSystem'),
    }),
  )
  expect(
    screen.getByRole('heading', { name: 'Ares destination' }),
  ).toBeVisible()
})

test('offers only the feed and following tabs in the header, opening on the feed', async () => {
  renderHome()

  const tabs = within(
    screen.getByRole('navigation', { name: i18n.t('home.timeline') }),
  )
  expect(tabs.getAllByRole('link')).toHaveLength(2)
  const feed = tabs.getByRole('link', { name: i18n.t('home.feed') })
  const following = tabs.getByRole('link', { name: i18n.t('home.following') })
  expect(feed).toHaveAttribute('aria-current', 'page')
  expect(following).not.toHaveAttribute('aria-current')

  await userEvent.click(following)
  expect(following).toHaveAttribute('aria-current', 'page')
  expect(feed).not.toHaveAttribute('aria-current')
})

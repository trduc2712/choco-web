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

import { DESIGN_SYSTEM_PATH } from '@/constants/routes'
import { i18n } from '@/i18n/i18n'
import { AppLayout } from '@/layouts/app-layout'
import { HomePage } from '@/pages/home-page/home-page'
import { startingWith } from '@/test/text'

vi.mock('@clerk/react', () => ({
  useAuth: () => ({
    userId: 'user_ada',
    isSignedIn: true,
    getToken: async () => 'test-token',
  }),
  useUser: () => ({
    user: { fullName: 'Ada Lovelace', username: 'Ada', hasImage: false },
  }),
  useClerk: () => ({ signOut: vi.fn() }),
}))

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderHome() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
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
    </QueryClientProvider>,
  )
}

test('shows the publish response above sample posts without requesting the personal post list', async () => {
  const post = {
    id: 'post-1',
    authorId: 'author-1',
    author: { username: 'Ada', displayName: 'Ada Lovelace', avatarUrl: null },
    content: 'First line\nSecond line',
    createdAt: '2026-11-08T09:00:00Z',
    modifiedAt: '2026-11-08T09:00:00Z',
  }
  fetchMock.mockResolvedValueOnce(Response.json(post, { status: 201 }))
  const { unmount } = renderHome()

  const main = within(screen.getByRole('main'))
  expect(screen.queryByRole('banner')).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Choco' })).toHaveAttribute(
    'href',
    '/',
  )
  expect(
    screen.getByRole('combobox', { name: i18n.t('userSearch.label') }),
  ).toBeVisible()
  expect(main.getByRole('tab', { name: i18n.t('home.feed') })).toHaveAttribute(
    'aria-selected',
    'true',
  )

  const posts = within(
    main.getByRole('region', { name: i18n.t('home.timelineContent') }),
  )
  const editor = posts.getByRole('textbox', {
    name: i18n.t('postComposer.body'),
  })
  const submit = posts.getByRole('button', {
    name: i18n.t('postComposer.post'),
  })
  expect(submit).toBeDisabled()
  const articles = posts.getAllByRole('article')
  expect(articles).toHaveLength(10)
  expect(fetchMock).not.toHaveBeenCalled()
  expect(
    new Set(
      articles.map(
        (article) => article.querySelector<HTMLElement>('[lang]')?.lang,
      ),
    ),
  ).toEqual(
    new Set(['vi', 'en', 'ja', 'ar', 'hi', 'ru', 'zh-Hans', 'ko', 'es', 'sw']),
  )
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
    createdAt: '2026-11-08T09:00:00Z',
    modifiedAt: '2026-11-08T09:00:00Z',
  }
  fetchMock.mockResolvedValueOnce(Response.json(post, { status: 201 }))
  await userEvent.click(submit)
  await waitFor(() => expect(editor).toHaveValue(''))
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('the sidebar account menu shows the user identity, preferences and actions', async () => {
  renderHome()

  const account = screen.getByRole('button', {
    name: i18n.t('auth.accountMenu.label'),
  })
  expect(account).toHaveTextContent('Ada Lovelace')
  expect(account).toHaveTextContent('@Ada')
  expect(
    within(account).getByRole('img', { name: 'Ada Lovelace' }),
  ).toHaveTextContent('AL')

  await userEvent.click(account)
  const menu = within(screen.getByRole('menu'))
  expect(menu.getAllByRole('menuitem')).toHaveLength(5)
  expect(
    menu.getByRole('menuitem', { name: startingWith(i18n.t('theme.label')) }),
  ).toHaveAttribute('aria-haspopup', 'menu')
  expect(
    menu.getByRole('menuitem', {
      name: startingWith(i18n.t('language.label')),
    }),
  ).toHaveAttribute('aria-haspopup', 'menu')
  expect(
    menu.getByRole('menuitem', { name: i18n.t('auth.accountMenu.signOut') }),
  ).toBeVisible()
  await userEvent.click(
    menu.getByRole('menuitem', { name: i18n.t('home.profile') }),
  )
  expect(
    screen.getByRole('heading', { name: 'Profile destination' }),
  ).toBeVisible()

  await userEvent.click(account)
  await userEvent.click(
    screen.getByRole('menuitem', {
      name: i18n.t('auth.accountMenu.designSystem'),
    }),
  )
  expect(
    screen.getByRole('heading', { name: 'Ares destination' }),
  ).toBeVisible()
})

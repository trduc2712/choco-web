import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { expect, test, vi } from 'vitest'

import { DESIGN_SYSTEM_PATH } from '@/constants/routes'
import { i18n } from '@/i18n/i18n'
import { AppLayout } from '@/layouts/app-layout'
import { HomePage } from '@/pages/home-page/home-page'
import { startingWith } from '@/test/text'

vi.mock('@clerk/react', () => ({
  useUser: () => ({
    user: { fullName: 'Ada Lovelace', username: 'Ada', hasImage: false },
  }),
  useClerk: () => ({ signOut: vi.fn() }),
}))

test('adds a local post above the sample posts and keeps it when switching tabs', async () => {
  render(
    <MemoryRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

  const main = within(screen.getByRole('main'))
  expect(screen.queryByRole('banner')).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Choco' })).toHaveAttribute(
    'href',
    '/',
  )
  expect(
    screen.getByRole('searchbox', { name: i18n.t('home.search') }),
  ).toBeVisible()
  expect(main.getByRole('tab', { name: i18n.t('home.feed') })).toHaveAttribute(
    'aria-selected',
    'true',
  )

  const following = main.getByRole('tab', { name: i18n.t('home.following') })
  await userEvent.click(following)
  expect(following).toHaveAttribute('aria-selected', 'true')
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
  expect(editor).toHaveValue('')
  expect(posts.getAllByRole('article')[0]).toHaveTextContent(
    'First line Second line',
  )

  await userEvent.click(main.getByRole('tab', { name: i18n.t('home.feed') }))
  expect(posts.getAllByRole('article')).toHaveLength(11)
  expect(posts.getAllByRole('article')[0]).toHaveTextContent(
    'First line Second line',
  )

  await userEvent.click(posts.getAllByRole('article')[0])
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('the sidebar account menu shows the user identity, preferences and actions', async () => {
  render(
    <MemoryRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/@Ada" element={<h1>Profile destination</h1>} />
        </Route>
        <Route path={DESIGN_SYSTEM_PATH} element={<h1>Ares destination</h1>} />
      </Routes>
    </MemoryRouter>,
  )

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

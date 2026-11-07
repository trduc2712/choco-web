import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { SIGN_IN_PATH } from '@/constants/routes'
import { AccountMenu } from '@/features/auth/account-menu'
import { i18n, LANGUAGE_STORAGE_KEY } from '@/i18n/i18n'
import { FALLBACK_LANGUAGE, LANGUAGE_NAMES } from '@/i18n/languages'
import { expectNoA11yViolations } from '@/test/a11y'
import { startingWith } from '@/test/text'

type UserMock = {
  fullName: string | null
  username: string | null
  hasImage: boolean
  imageUrl: string
  primaryEmailAddress: { emailAddress: string } | null
}

const clerk = vi.hoisted(() => ({
  user: undefined as UserMock | undefined,
  signOut: undefined as unknown,
  redirectToUserProfile: undefined as unknown,
}))

vi.mock('@clerk/react', () => ({
  useUser: () => ({ user: clerk.user }),
  useClerk: () => ({
    signOut: clerk.signOut,
    redirectToUserProfile: clerk.redirectToUserProfile,
  }),
}))

const signOut = vi.fn()
const redirectToUserProfile = vi.fn()

afterEach(async () => {
  await i18n.changeLanguage(FALLBACK_LANGUAGE)
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

beforeEach(() => {
  signOut.mockReset()
  redirectToUserProfile.mockReset()
  clerk.signOut = signOut
  clerk.redirectToUserProfile = redirectToUserProfile
  clerk.user = {
    fullName: 'Ada Lovelace',
    username: 'ada',
    hasImage: false,
    imageUrl: 'https://img.example/default.png',
    primaryEmailAddress: { emailAddress: 'ada@example.com' },
  }
})

async function openMenu() {
  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('auth.accountMenu.label') }),
  )

  return screen.getByRole('menu', { name: i18n.t('auth.accountMenu.label') })
}

test('opens from the user avatar with the account actions', async () => {
  const { container } = render(<AccountMenu />)

  expect(
    within(
      screen.getByRole('button', { name: i18n.t('auth.accountMenu.label') }),
    ).getByRole('img', { name: 'Ada Lovelace' }),
  ).toBeInTheDocument()

  const menu = await openMenu()
  const labels = within(menu)
    .getAllByRole('menuitem')
    .map((item) => item.textContent)

  expect(labels).toEqual([
    `${i18n.t('theme.label')}${i18n.t('theme.system')}`,
    `${i18n.t('language.label')}${LANGUAGE_NAMES.en}`,
    i18n.t('auth.accountMenu.manageAccount'),
    i18n.t('auth.accountMenu.signOut'),
  ])
  expect(screen.queryByRole('menuitemradio')).not.toBeInTheDocument()
  await expectNoA11yViolations(container)
})

test('switches the theme from a submenu', async () => {
  render(<AccountMenu />)
  await openMenu()
  const theme = screen.getByRole('menuitem', {
    name: startingWith(i18n.t('theme.label')),
  })

  expect(theme).toHaveAttribute('aria-haspopup', 'menu')

  await userEvent.click(theme)
  const themes = screen.getByRole('menu', { name: i18n.t('theme.label') })

  expect(
    within(themes).getByRole('menuitemradio', {
      name: i18n.t('theme.system'),
    }),
  ).toHaveAttribute('aria-checked', 'true')

  await userEvent.click(
    within(themes).getByRole('menuitemradio', { name: i18n.t('theme.dark') }),
  )

  expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()

  await openMenu()

  expect(
    screen.getByRole('menuitem', {
      name: startingWith(i18n.t('theme.label')),
    }),
  ).toHaveTextContent(i18n.t('theme.dark'))
})

test.each([
  {
    language: 'ja',
    account: 'アカウント',
    label: '言語',
    signOut: 'サインアウト',
  },
  {
    language: 'vi',
    account: 'Tài khoản',
    label: 'Ngôn ngữ',
    signOut: 'Đăng xuất',
  },
] as const)(
  'switches to $language from the submenu and remembers it',
  async ({ language, account, label, signOut: signOutLabel }) => {
    const { container } = render(<AccountMenu />)
    await openMenu()

    await userEvent.click(
      screen.getByRole('menuitem', {
        name: startingWith(i18n.t('language.label')),
      }),
    )
    const languages = screen.getByRole('menu', {
      name: i18n.t('language.label'),
    })

    expect(
      within(languages).getByRole('menuitemradio', { name: LANGUAGE_NAMES.en }),
    ).toHaveAttribute('aria-checked', 'true')

    await userEvent.click(
      within(languages).getByRole('menuitemradio', {
        name: LANGUAGE_NAMES[language],
      }),
    )

    expect(i18n.resolvedLanguage).toBe(language)
    expect(document.documentElement).toHaveAttribute('lang', language)
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe(language)

    await userEvent.click(screen.getByRole('button', { name: account }))
    expect(
      screen.getByRole('menuitem', { name: startingWith(label) }),
    ).toHaveTextContent(LANGUAGE_NAMES[language])
    expect(
      screen.getByRole('menuitem', { name: signOutLabel }),
    ).toBeInTheDocument()
    await expectNoA11yViolations(container)
  },
)

test('opens Clerk account management', async () => {
  render(<AccountMenu />)
  await openMenu()

  await userEvent.click(
    screen.getByRole('menuitem', {
      name: i18n.t('auth.accountMenu.manageAccount'),
    }),
  )

  expect(redirectToUserProfile).toHaveBeenCalledOnce()
})

test('signs the user out to the sign-in page', async () => {
  render(<AccountMenu />)
  await openMenu()

  await userEvent.click(
    screen.getByRole('menuitem', { name: i18n.t('auth.accountMenu.signOut') }),
  )

  expect(signOut).toHaveBeenCalledWith({ redirectUrl: SIGN_IN_PATH })
})

test('uses the profile image only when the user set one', () => {
  clerk.user = {
    ...clerk.user!,
    hasImage: true,
    imageUrl: 'https://img.example/ada.png',
  }

  render(<AccountMenu />)

  expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toHaveAttribute(
    'src',
    'https://img.example/ada.png',
  )
})

test('falls back to the username when there is no name', () => {
  clerk.user = { ...clerk.user!, fullName: null }

  render(<AccountMenu />)

  expect(screen.getByRole('img', { name: 'ada' })).toBeInTheDocument()
})

test('renders nothing until the user has loaded', () => {
  clerk.user = undefined

  const { container } = render(<AccountMenu />)

  expect(container).toBeEmptyDOMElement()
})

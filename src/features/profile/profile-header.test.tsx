import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  act,
  fireEvent,
  render as renderView,
  screen,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { expect, test, vi } from 'vitest'

import { ToastProvider } from '@/components/toast/toast-provider'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'

vi.mock('@clerk/react', () => ({
  useAuth: () => ({
    userId: 'clerk-viewer',
    getToken: () => Promise.resolve('token'),
  }),
}))

import { ProfileHeader } from './profile-header'

const profile = {
  username: 'ada',
  displayName: 'Ada Lovelace',
  avatarUrl: '/avatar.jpg',
  backgroundImageUrl: '/cover.jpg',
}

const testClient = new QueryClient()

function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={testClient}>
      <ToastProvider>
        <MemoryRouter>{children}</MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}

function render(view: ReactElement) {
  return renderView(view, { wrapper: Providers })
}

test.each([
  'https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCJ9',
  'https://images.clerk.dev/eyJ0eXBlIjoiZGVmYXVsdCJ9?width=96',
  'https://images.clerk.dev/default-user.png',
])('renders initials instead of the generated Clerk avatar %s', (avatarUrl) => {
  render(<ProfileHeader profile={{ ...profile, avatarUrl }} />)
  const avatar = screen.getByRole('img', { name: profile.displayName })
  expect(avatar.tagName).toBe('SPAN')
  expect(avatar).toHaveTextContent('AL')
})

test.each([
  'https://img.clerk.com/eyJ0eXBlIjoiaW1hZ2UiLCJpbWFnZV9pZCI6ImltZ18xMjMifQ',
  'https://images.clerk.dev/uploaded/avatar.png',
  'https://example.com/eyJ0eXBlIjoiZGVmYXVsdCJ9',
  'https://img.clerk.com/not-base64-json',
])('preserves uploaded or unrecognized avatar URLs: %s', (avatarUrl) => {
  render(<ProfileHeader profile={{ ...profile, avatarUrl }} />)
  expect(
    screen.getByRole('img', { name: profile.displayName }),
  ).toHaveAttribute('src', avatarUrl)
})

test('shows public identity, social actions and a decorative cover without owner controls', async () => {
  const { container } = render(<ProfileHeader profile={profile} />)

  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
    'Ada Lovelace',
  )
  expect(screen.getByText('@ada')).toBeVisible()
  expect(screen.queryByText(i18n.t('home.profile'))).not.toBeInTheDocument()
  expect(
    screen.getByRole('link', { name: i18n.t('notFound.backToHome') }),
  ).toHaveAttribute('href', '/')
  expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toHaveAttribute(
    'src',
    '/avatar.jpg',
  )
  expect(container.querySelector('img[alt=""]')).toHaveAttribute(
    'src',
    '/cover.jpg',
  )
  expect(
    screen.getByRole('button', { name: i18n.t('profile.message') }),
  ).toBeVisible()
  expect(
    screen.getByRole('button', { name: i18n.t('profile.follow') }),
  ).toBeVisible()
  expect(
    screen.queryByRole('button', { name: i18n.t('profile.editProfile') }),
  ).not.toBeInTheDocument()
  await expectNoA11yViolations(container)
})

test('falls back gracefully when both images fail to load', () => {
  const { container } = render(<ProfileHeader profile={profile} />)
  fireEvent.error(screen.getByRole('img', { name: 'Ada Lovelace' }))
  fireEvent.error(container.querySelector('img[alt=""]')!)

  expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toHaveTextContent(
    'AL',
  )
  expect(container.querySelector('img')).not.toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
    'Ada Lovelace',
  )
})

test('uses the username for an empty display name and supports missing images', () => {
  render(<ProfileHeader profile={{ username: 'ada', displayName: '  ' }} />)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('ada')
  expect(screen.getByRole('img', { name: 'ada' })).toHaveTextContent('A')
})

test('loads a new cover when navigating away from a profile with a broken cover', () => {
  const { container, rerender } = render(<ProfileHeader profile={profile} />)
  fireEvent.error(container.querySelector('img[alt=""]')!)

  rerender(
    <ProfileHeader
      profile={{
        ...profile,
        username: 'grace',
        backgroundImageUrl: '/new-cover.jpg',
      }}
    />,
  )
  expect(container.querySelector('img[alt=""]')).toHaveAttribute(
    'src',
    '/new-cover.jpg',
  )
  expect(screen.getByText('@grace')).toBeVisible()
})

test('opens the edit dialog with the bio editor and closes it from its close button', async () => {
  const user = userEvent.setup()
  render(<ProfileHeader profile={profile} canEdit />)

  expect(
    screen.queryByRole('button', { name: i18n.t('profile.message') }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: i18n.t('profile.follow') }),
  ).not.toBeInTheDocument()

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  await user.click(
    screen.getByRole('button', { name: i18n.t('profile.editProfile') }),
  )
  const dialog = screen.getByRole('dialog', {
    name: i18n.t('profile.editProfile'),
  })
  expect(dialog).toBeVisible()
  expect(screen.getByRole('textbox')).toBeVisible()
  await expectNoA11yViolations(dialog)

  await user.click(screen.getByRole('button', { name: i18n.t('common.close') }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('renders follower, following and post counts, including zero', () => {
  render(
    <ProfileHeader
      profile={{
        ...profile,
        followerCount: 0,
        followingCount: 12,
        postCount: 3,
      }}
    />,
  )
  const values = screen.getAllByRole('definition')
  expect(values[0]).toHaveTextContent('0')
  expect(values[1]).toHaveTextContent('12')
  expect(values[2]).toHaveTextContent('3')
})

test('uses placeholders instead of inventing missing profile metadata', () => {
  render(<ProfileHeader profile={{ ...profile, postCount: null }} />)
  for (const value of screen.getAllByRole('definition')) {
    expect(value).toHaveTextContent('—')
  }
})

test('shows a toast explaining that messaging is unavailable', async () => {
  render(<ProfileHeader profile={profile} />)
  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('profile.message') }),
  )
  expect(await screen.findByRole('status')).toHaveTextContent(
    i18n.t('profile.messagingUnavailable'),
  )
})

test('leaves the wallpaper button as a placeholder without opening a picker or dialog', async () => {
  const { container } = render(<ProfileHeader profile={profile} canEdit />)
  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('profile.chooseWallpaper') }),
  )

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(container.querySelector('input[type="file"]')).not.toBeInTheDocument()
  expect(screen.getByText('@ada')).toBeVisible()
})

test('offers Follow in the toolbar once the main button scrolls under it', async () => {
  let notify!: IntersectionObserverCallback
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: IntersectionObserverCallback) {
        notify = callback
      }
      observe() {}
      disconnect() {}
    },
  )
  const setFollowing = vi.fn()
  const follow = {
    isFollowing: false,
    isPending: false,
    isError: false,
    isBlockedError: false,
    setFollowing,
  }
  const { container } = render(
    <ProfileHeader profile={profile} follow={follow} />,
  )
  const name = i18n.t('profile.follow')
  expect(screen.getAllByRole('button', { name })).toHaveLength(1)

  act(() =>
    notify(
      [
        {
          isIntersecting: false,
          boundingClientRect: { bottom: 10 },
          rootBounds: { top: 50 },
        } as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver,
    ),
  )
  const buttons = screen.getAllByRole('button', { name })
  expect(buttons).toHaveLength(2)
  expect(container.querySelector('[data-profile-toolbar]')).toContainElement(
    buttons[0],
  )
  await userEvent.click(buttons[0])
  expect(setFollowing).toHaveBeenCalledWith(true)

  act(() =>
    notify(
      [
        {
          isIntersecting: true,
          boundingClientRect: { bottom: 100 },
          rootBounds: { top: 50 },
        } as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver,
    ),
  )
  expect(screen.getAllByRole('button', { name })).toHaveLength(1)
  vi.unstubAllGlobals()
})

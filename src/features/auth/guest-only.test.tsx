import { render, screen } from '@testing-library/react'
import { createMemoryRouter, useLocation } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, expect, test, vi } from 'vitest'

import { SIGN_IN_PATH } from '@/constants/routes'
import { GuestOnly } from '@/features/auth/guest-only'
import { i18n } from '@/i18n/i18n'

type AuthState = { isLoaded: boolean; isSignedIn: boolean | undefined }

const useAuth = vi.fn<() => AuthState>()

vi.mock('@clerk/react', () => ({
  useAuth: () => useAuth(),
}))

const SIGN_IN_FORM = 'sign-in-form'
const APP_LOCATION = 'app-location'

function AppLocation() {
  const { pathname } = useLocation()

  return <p data-testid={APP_LOCATION}>{pathname}</p>
}

function renderSignIn(url = SIGN_IN_PATH) {
  const router = createMemoryRouter(
    [
      {
        element: <GuestOnly />,
        children: [
          { path: SIGN_IN_PATH, element: <div data-testid={SIGN_IN_FORM} /> },
        ],
      },
      { path: '*', element: <AppLocation /> },
    ],
    { initialEntries: [url] },
  )

  render(<RouterProvider router={router} />)
}

afterEach(() => {
  vi.resetAllMocks()
})

test('shows a loading state while Clerk is loading', () => {
  useAuth.mockReturnValue({ isLoaded: false, isSignedIn: undefined })

  renderSignIn()

  expect(screen.getByRole('status')).toHaveTextContent(i18n.t('common.loading'))
})

test('shows the page to signed-out users', () => {
  useAuth.mockReturnValue({ isLoaded: true, isSignedIn: false })

  renderSignIn()

  expect(screen.getByTestId(SIGN_IN_FORM)).toBeInTheDocument()
})

test('sends signed-in users on to where they were going', () => {
  useAuth.mockReturnValue({ isLoaded: true, isSignedIn: true })

  renderSignIn(`${SIGN_IN_PATH}?redirect_url=%2Fsettings`)

  expect(screen.getByTestId(APP_LOCATION)).toHaveTextContent('/settings')
  expect(screen.queryByTestId(SIGN_IN_FORM)).not.toBeInTheDocument()
})

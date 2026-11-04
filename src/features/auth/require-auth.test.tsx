import { render, screen } from '@testing-library/react'
import { createMemoryRouter, useLocation } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, expect, test, vi } from 'vitest'

import { SIGN_IN_PATH } from '@/constants/routes'
import { RequireAuth } from '@/features/auth/require-auth'
import { i18n } from '@/i18n/i18n'

type AuthState = { isLoaded: boolean; isSignedIn: boolean | undefined }

const useAuth = vi.fn<() => AuthState>()

vi.mock('@clerk/react', () => ({
  useAuth: () => useAuth(),
}))

const PROTECTED_CONTENT = 'protected-content'
const SIGN_IN_LOCATION = 'sign-in-location'

function SignInLocation() {
  const { pathname, search } = useLocation()

  return <p data-testid={SIGN_IN_LOCATION}>{`${pathname}${search}`}</p>
}

function renderGuardedRoute(url = '/') {
  const router = createMemoryRouter(
    [
      {
        element: <RequireAuth />,
        children: [
          { path: '*', element: <div data-testid={PROTECTED_CONTENT} /> },
        ],
      },
      { path: SIGN_IN_PATH, element: <SignInLocation /> },
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

  renderGuardedRoute()

  expect(screen.getByRole('status')).toHaveTextContent(i18n.t('common.loading'))
  expect(screen.queryByTestId(PROTECTED_CONTENT)).not.toBeInTheDocument()
})

test('sends signed-out users to sign in', () => {
  useAuth.mockReturnValue({ isLoaded: true, isSignedIn: false })

  renderGuardedRoute()

  expect(screen.getByTestId(SIGN_IN_LOCATION)).toHaveTextContent(SIGN_IN_PATH)
  expect(screen.queryByTestId(PROTECTED_CONTENT)).not.toBeInTheDocument()
})

test('remembers the page to return to after signing in', () => {
  useAuth.mockReturnValue({ isLoaded: true, isSignedIn: false })

  renderGuardedRoute('/posts/1?tab=comments')

  expect(screen.getByTestId(SIGN_IN_LOCATION)).toHaveTextContent(
    `${SIGN_IN_PATH}?redirect_url=%2Fposts%2F1%3Ftab%3Dcomments`,
  )
})

test('renders the protected route for signed-in users', () => {
  useAuth.mockReturnValue({ isLoaded: true, isSignedIn: true })

  renderGuardedRoute()

  expect(screen.getByTestId(PROTECTED_CONTENT)).toBeInTheDocument()
})

import { render, screen } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, expect, test, vi } from 'vitest'

import { RequireAuth } from '@/features/auth/require-auth'
import { i18n } from '@/i18n/i18n'

type AuthState = { isLoaded: boolean; isSignedIn: boolean | undefined }

const useAuth = vi.fn<() => AuthState>()

vi.mock('@clerk/react', () => ({
  useAuth: () => useAuth(),
  RedirectToSignIn: () => <div data-testid="redirect-to-sign-in" />,
}))

const PROTECTED_CONTENT = 'protected-content'

function renderGuardedRoute() {
  const router = createMemoryRouter([
    {
      element: <RequireAuth />,
      children: [
        { index: true, element: <div data-testid={PROTECTED_CONTENT} /> },
      ],
    },
  ])

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

test('redirects signed-out users to sign in', () => {
  useAuth.mockReturnValue({ isLoaded: true, isSignedIn: false })

  renderGuardedRoute()

  expect(screen.getByTestId('redirect-to-sign-in')).toBeInTheDocument()
  expect(screen.queryByTestId(PROTECTED_CONTENT)).not.toBeInTheDocument()
})

test('renders the protected route for signed-in users', () => {
  useAuth.mockReturnValue({ isLoaded: true, isSignedIn: true })

  renderGuardedRoute()

  expect(screen.getByTestId(PROTECTED_CONTENT)).toBeInTheDocument()
})

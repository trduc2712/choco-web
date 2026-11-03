import { render, screen, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

import { SIGN_IN_PATH, SIGN_UP_PATH } from '@/constants/routes'
import { SignUpPage } from '@/pages/sign-up-page/sign-up-page'

type SignUpProps = { path: string; signInUrl: string }

const SIGN_UP = 'sign-up'

vi.mock('@clerk/react', () => ({
  SignUp: ({ path, signInUrl }: SignUpProps) => (
    <div data-testid={SIGN_UP} data-path={path} data-sign-in-url={signInUrl} />
  ),
}))

test('renders the sign-up form wired to the auth routes', () => {
  render(<SignUpPage />)

  const signUp = within(screen.getByRole('main')).getByTestId(SIGN_UP)

  expect(signUp).toHaveAttribute('data-path', SIGN_UP_PATH)
  expect(signUp).toHaveAttribute('data-sign-in-url', SIGN_IN_PATH)
})

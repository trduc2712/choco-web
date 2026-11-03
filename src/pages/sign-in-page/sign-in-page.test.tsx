import { render, screen, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

import { SIGN_IN_PATH, SIGN_UP_PATH } from '@/constants/routes'
import { SignInPage } from '@/pages/sign-in-page/sign-in-page'

type SignInProps = { path: string; signUpUrl: string }

const SIGN_IN = 'sign-in'

vi.mock('@clerk/react', () => ({
  SignIn: ({ path, signUpUrl }: SignInProps) => (
    <div data-testid={SIGN_IN} data-path={path} data-sign-up-url={signUpUrl} />
  ),
}))

test('renders the sign-in form wired to the auth routes', () => {
  render(<SignInPage />)

  const signIn = within(screen.getByRole('main')).getByTestId(SIGN_IN)

  expect(signIn).toHaveAttribute('data-path', SIGN_IN_PATH)
  expect(signIn).toHaveAttribute('data-sign-up-url', SIGN_UP_PATH)
})

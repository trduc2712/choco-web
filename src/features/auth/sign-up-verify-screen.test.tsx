import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'

import {
  SIGN_UP_CONTINUE_PATH,
  SIGN_UP_PATH,
  SIGN_UP_VERIFY_PATH,
} from '@/constants/routes'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'
import type { SignUpMock } from '@/test/clerk'
import { clerkApiError, createSignUpMock } from '@/test/clerk'
import { LOCATION_TEST_ID, renderRoute } from '@/test/router'

import { SignUpVerifyScreen } from './sign-up-verify-screen'

const clerk = vi.hoisted(() => ({ signUp: undefined as unknown }))

vi.mock('@clerk/react', () => ({
  useSignUp: () => ({ signUp: clerk.signUp }),
}))

let signUp: SignUpMock

beforeEach(() => {
  signUp = createSignUpMock()
  signUp.status = 'missing_requirements'
  signUp.unverifiedFields = ['email_address']
  signUp.emailAddress = 'ada@example.com'
  clerk.signUp = signUp
})

function renderVerify() {
  return renderRoute(<SignUpVerifyScreen />, {
    path: SIGN_UP_VERIFY_PATH,
    url: `${SIGN_UP_VERIFY_PATH}?redirect_url=%2Fsettings`,
  })
}

async function enterCode() {
  await userEvent.click(
    screen.getByRole('textbox', {
      name: i18n.t('pinInput.digit', { index: 1, count: 6 }),
    }),
  )
  await userEvent.paste('424242')
}

test('sends users with nothing to verify back to sign up', () => {
  signUp.unverifiedFields = []

  renderVerify()

  expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent(
    `${SIGN_UP_PATH}?redirect_url=%2Fsettings`,
  )
})

test('verifies the email and finishes signing up', async () => {
  signUp.verifications.verifyEmailCode.mockImplementation(() => {
    signUp.status = 'complete'
    return Promise.resolve({ error: null })
  })
  const { container } = renderVerify()

  expect(
    screen.getByText(
      i18n.t('auth.verify.description', { email: 'ada@example.com' }),
    ),
  ).toBeInTheDocument()
  await expectNoA11yViolations(container)

  await enterCode()

  expect(signUp.verifications.verifyEmailCode).toHaveBeenCalledWith({
    code: '424242',
  })
  expect(signUp.finalize).toHaveBeenCalledOnce()
  expect(await screen.findByTestId(LOCATION_TEST_ID)).toHaveTextContent(
    '/settings',
  )
})

test('moves on to the fields Clerk still needs', async () => {
  signUp.verifications.verifyEmailCode.mockImplementation(() => {
    signUp.unverifiedFields = []
    signUp.missingFields = ['username']
    return Promise.resolve({ error: null })
  })
  renderVerify()

  await enterCode()

  expect(await screen.findByTestId(LOCATION_TEST_ID)).toHaveTextContent(
    `${SIGN_UP_CONTINUE_PATH}?redirect_url=%2Fsettings`,
  )
})

test('shows an expired code', async () => {
  signUp.verifications.verifyEmailCode.mockResolvedValue({
    error: clerkApiError('verification_expired', 'code'),
  })
  renderVerify()

  await enterCode()

  expect(
    await screen.findByText(i18n.t('auth.errors.codeExpired')),
  ).toBeInTheDocument()
})

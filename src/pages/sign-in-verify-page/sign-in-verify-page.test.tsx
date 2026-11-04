import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'

import { SIGN_IN_PATH, SIGN_IN_VERIFY_PATH } from '@/constants/routes'
import { i18n } from '@/i18n/i18n'
import { SignInVerifyPage } from '@/pages/sign-in-verify-page/sign-in-verify-page'
import { expectNoA11yViolations } from '@/test/a11y'
import type { SignInMock } from '@/test/clerk'
import { clerkApiError, createSignInMock } from '@/test/clerk'
import { LOCATION_TEST_ID, renderRoute } from '@/test/router'

const clerk = vi.hoisted(() => ({ signIn: undefined as unknown }))

vi.mock('@clerk/react', () => ({
  useSignIn: () => ({ signIn: clerk.signIn }),
}))

const EMAIL = 'a***@example.com'

let signIn: SignInMock

beforeEach(() => {
  signIn = createSignInMock()
  signIn.status = 'needs_client_trust'
  signIn.supportedSecondFactors = [
    { strategy: 'email_code', safeIdentifier: EMAIL },
  ]
  clerk.signIn = signIn
})

function renderVerify() {
  return renderRoute(<SignInVerifyPage />, {
    path: SIGN_IN_VERIFY_PATH,
    url: `${SIGN_IN_VERIFY_PATH}?redirect_url=%2Fsettings`,
  })
}

async function enterCode(code = '424242') {
  await userEvent.click(
    screen.getByRole('textbox', {
      name: i18n.t('pinInput.digit', { index: 1, count: 6 }),
    }),
  )
  await userEvent.paste(code)
}

test('sends users without a pending verification back to sign in', () => {
  signIn.status = 'needs_identifier'

  renderVerify()

  expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent(
    `${SIGN_IN_PATH}?redirect_url=%2Fsettings`,
  )
})

test('names the email the code went to', async () => {
  const { container } = renderVerify()

  expect(
    screen.getByText(i18n.t('auth.deviceVerify.description', { email: EMAIL })),
  ).toBeInTheDocument()
  await expectNoA11yViolations(container)
})

test('verifies the code and finishes signing in', async () => {
  signIn.mfa.verifyEmailCode.mockImplementation(() => {
    signIn.status = 'complete'
    return Promise.resolve({ error: null })
  })
  renderVerify()

  await enterCode()

  expect(signIn.mfa.verifyEmailCode).toHaveBeenCalledWith({ code: '424242' })
  expect(await screen.findByTestId(LOCATION_TEST_ID)).toHaveTextContent(
    '/settings',
  )
})

test('shows an incorrect code on the code field', async () => {
  signIn.mfa.verifyEmailCode.mockResolvedValue({
    error: clerkApiError('form_code_incorrect', 'code'),
  })
  renderVerify()

  await enterCode()

  expect(
    await screen.findByText(i18n.t('auth.errors.codeIncorrect')),
  ).toBeInTheDocument()
  expect(signIn.finalize).not.toHaveBeenCalled()
})

test('sends a new code on request', async () => {
  renderVerify()

  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('auth.verify.resend') }),
  )

  expect(signIn.mfa.sendEmailCode).toHaveBeenCalledOnce()
  expect(screen.getByRole('status')).toHaveTextContent(
    i18n.t('auth.verify.resent'),
  )
})

test('starts over with another account', async () => {
  renderVerify()

  await userEvent.click(
    screen.getByRole('button', {
      name: i18n.t('auth.verify.useAnotherAccount'),
    }),
  )

  expect(signIn.reset).toHaveBeenCalledOnce()
  expect(await screen.findByTestId(LOCATION_TEST_ID)).toHaveTextContent(
    `${SIGN_IN_PATH}?redirect_url=%2Fsettings`,
  )
})

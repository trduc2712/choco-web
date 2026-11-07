import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'

import { RESET_PASSWORD_PATH, SIGN_IN_PATH } from '@/constants/routes'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'
import type { SignInMock } from '@/test/clerk'
import { clerkApiError, createSignInMock } from '@/test/clerk'
import { LOCATION_TEST_ID, renderRoute } from '@/test/router'
import { startingWith } from '@/test/text'

import { ResetPasswordScreen } from './reset-password-screen'

const clerk = vi.hoisted(() => ({ signIn: undefined as unknown }))

vi.mock('@clerk/react', () => ({
  useSignIn: () => ({ signIn: clerk.signIn }),
}))

const NEW_PASSWORD = 'a much longer password'

let signIn: SignInMock

beforeEach(() => {
  signIn = createSignInMock()
  signIn.resetPasswordEmailCode.verifyCode.mockImplementation(() => {
    signIn.status = 'needs_new_password'
    return Promise.resolve({ error: null })
  })
  clerk.signIn = signIn
})

function renderReset() {
  return renderRoute(<ResetPasswordScreen />, {
    path: RESET_PASSWORD_PATH,
    url: `${RESET_PASSWORD_PATH}?redirect_url=%2Fsettings`,
  })
}

async function requestCode() {
  await userEvent.type(
    screen.getByRole('textbox', {
      name: startingWith(i18n.t('auth.fields.email')),
    }),
    'ada@example.com',
  )
  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('auth.resetPassword.sendCode') }),
  )
}

async function enterCode() {
  await userEvent.click(
    screen.getByRole('textbox', {
      name: i18n.t('pinInput.digit', { index: 1, count: 6 }),
    }),
  )
  await userEvent.paste('424242')
}

async function submitNewPassword() {
  await userEvent.type(
    await screen.findByLabelText(
      startingWith(i18n.t('auth.fields.newPassword')),
    ),
    NEW_PASSWORD,
  )
  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('auth.resetPassword.submit') }),
  )
}

test('resets the password with an emailed code and signs in', async () => {
  signIn.resetPasswordEmailCode.submitPassword.mockImplementation(() => {
    signIn.status = 'complete'
    return Promise.resolve({ error: null })
  })
  const { container } = renderReset()
  await expectNoA11yViolations(container)

  await requestCode()

  expect(signIn.create).toHaveBeenCalledWith({ identifier: 'ada@example.com' })
  expect(signIn.resetPasswordEmailCode.sendCode).toHaveBeenCalledOnce()
  expect(
    screen.getByText(
      i18n.t('auth.resetPassword.codeDescription', {
        email: 'ada@example.com',
      }),
    ),
  ).toBeInTheDocument()

  await enterCode()

  expect(signIn.resetPasswordEmailCode.verifyCode).toHaveBeenCalledWith({
    code: '424242',
  })

  await submitNewPassword()

  expect(signIn.resetPasswordEmailCode.submitPassword).toHaveBeenCalledWith({
    password: NEW_PASSWORD,
    signOutOfOtherSessions: true,
  })
  expect(await screen.findByTestId(LOCATION_TEST_ID)).toHaveTextContent(
    '/settings',
  )
})

test('shows an unknown email on the email field', async () => {
  signIn.create.mockResolvedValue({
    error: clerkApiError('form_identifier_not_found', 'identifier'),
  })
  renderReset()

  await requestCode()

  expect(
    screen.getByRole('textbox', {
      name: startingWith(i18n.t('auth.fields.email')),
    }),
  ).toHaveAccessibleDescription(i18n.t('auth.errors.identifierNotFound'))
  expect(signIn.resetPasswordEmailCode.sendCode).not.toHaveBeenCalled()
})

test('shows a rejected new password on the password field', async () => {
  signIn.resetPasswordEmailCode.submitPassword.mockResolvedValue({
    error: clerkApiError('form_password_pwned', 'password'),
  })
  renderReset()
  await requestCode()
  await enterCode()

  await submitNewPassword()

  expect(
    screen.getByLabelText(startingWith(i18n.t('auth.fields.newPassword'))),
  ).toHaveAccessibleDescription(i18n.t('auth.errors.passwordPwned'))
})

test('links back to sign in', () => {
  renderReset()

  expect(
    screen.getByRole('link', {
      name: i18n.t('auth.resetPassword.backToSignIn'),
    }),
  ).toHaveAttribute('href', `${SIGN_IN_PATH}?redirect_url=%2Fsettings`)
})
